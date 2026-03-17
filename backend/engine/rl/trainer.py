"""Training loop for Sub-Five RL agent.

Two phases:
1. Imitation: learn from heuristic bot decisions (warm-start)
2. Self-play PPO: improve beyond heuristic via self-play

Both phases use the same network architecture. Imitation uses cross-entropy
on the heuristic bot's action choice. PPO uses clipped surrogate objective.
"""
import copy
import random
import time
from collections import deque
from dataclasses import dataclass, field

import torch
import torch.nn as nn
import torch.nn.functional as F

from ..bot import BotStrategy, CardTracker
from ..card import Card
from ..game import Game
from ..player import Player
from .encoding import (
    encode_state, encode_action, enumerate_actions,
    STATE_DIM, ACTION_DIM, ACTION_HISTORY_SIZE,
)
from .environment import SubFiveEnv
from .network import SubFiveNetwork


# === Data structures ===

@dataclass
class Experience:
    """One step of experience for PPO."""
    state: torch.Tensor          # (STATE_DIM,)
    action_tensors: torch.Tensor # (num_actions, ACTION_DIM)
    action_idx: int
    log_prob: float
    value: float
    reward: float
    num_actions: int


@dataclass
class ImitationSample:
    """One sample for imitation learning."""
    state: torch.Tensor
    action_tensors: torch.Tensor
    target_idx: int
    num_actions: int


# === Imitation Training ===

class ImitationTrainer:
    """Learn from the heuristic bot's decisions."""

    def __init__(self, network: SubFiveNetwork, lr: float = 1e-3):
        self.network = network
        self.optimizer = torch.optim.Adam(network.parameters(), lr=lr)

    def collect_data(self, num_games: int = 1000, num_players: int = 3) -> list[ImitationSample]:
        """Play games with heuristic bot, record (state, action) pairs."""
        samples = []
        player_names = [f"P{i}" for i in range(num_players)]

        for _ in range(num_games):
            game = Game(player_names)
            trackers = {name: CardTracker() for name in player_names}
            strategies = {name: BotStrategy() for name in player_names}
            action_histories: dict[str, list] = {name: [] for name in player_names}
            player_indices = {name: i for i, name in enumerate(player_names)}

            # Observe initial hands
            for name in player_names:
                player = next(p for p in game.players if p.name == name)
                trackers[name].observe_hand(player.hand)

            max_turns = num_players * 50  # safety limit
            for _ in range(max_turns):
                if game.round_ended or game.game_over:
                    break

                current = game.current_player()
                name = current.name
                tracker = trackers[name]
                strategy = strategies[name]

                # Feed last action to strategy
                if game.last_action:
                    strategy.observe_action(game.last_action)

                pile_top = game.play_pile[-1] if game.play_pile else None
                opp_counts = {
                    p.name: len(p.hand) for p in game.players if p.name != name
                }

                # Get heuristic bot's choice
                bot_cards, bot_draw, bot_end = strategy.choose_action(
                    current, pile_top, len(game.deck), opp_counts
                )

                # Build state observation
                opponents = [p for p in game.players if p.name != name]
                state = encode_state(
                    hand=current.hand,
                    pile_top=pile_top,
                    seen_cards=tracker.seen_cards,
                    hand_value=current.hand_value(),
                    can_end=current.can_end_round(),
                    own_score=current.score,
                    opponent_counts=[len(p.hand) for p in opponents],
                    opponent_scores=[p.score for p in opponents],
                    deck_count=len(game.deck),
                    action_history=action_histories[name],
                )

                # Enumerate all valid actions
                valid_actions = enumerate_actions(
                    current.hand, pile_top, current.can_end_round()
                )
                action_tensors = torch.stack([
                    encode_action(cards, draw, end)
                    for cards, draw, end in valid_actions
                ])

                # Find which action index matches the bot's choice
                target_idx = self._find_matching_action(
                    valid_actions, bot_cards, bot_draw, bot_end
                )

                if target_idx is not None:
                    samples.append(ImitationSample(
                        state=state,
                        action_tensors=action_tensors,
                        target_idx=target_idx,
                        num_actions=len(valid_actions),
                    ))

                # Execute the bot's action
                if bot_end:
                    game.end_round(name)
                else:
                    if not bot_cards:
                        bot_cards = [current.hand[0]]
                    try:
                        action = game.play_cards(name, bot_cards, bot_draw)
                        # Update trackers
                        for pname in player_names:
                            trackers[pname].observe_action(action)
                        action_with_idx = {**action, "_player_idx": player_indices[name]}
                        for pname in player_names:
                            action_histories[pname].append(action_with_idx)
                        trackers[name].observe_hand(current.hand)
                    except Exception:
                        # Fallback
                        try:
                            action = game.play_cards(name, [current.hand[0]], "deck")
                            for pname in player_names:
                                trackers[pname].observe_action(action)
                        except Exception:
                            break

        return samples

    def _find_matching_action(self, valid_actions, bot_cards, bot_draw, bot_end):
        """Find the index in valid_actions that matches the bot's choice."""
        bot_card_set = frozenset(bot_cards)

        for i, (cards, draw, end) in enumerate(valid_actions):
            if end != bot_end:
                continue
            if end:
                return i
            if frozenset(cards) == bot_card_set and draw == bot_draw:
                return i

        # Fuzzy match: same cards, different draw source
        for i, (cards, draw, end) in enumerate(valid_actions):
            if end:
                continue
            if frozenset(cards) == bot_card_set:
                return i

        return None

    def train(self, samples: list[ImitationSample], epochs: int = 50,
              batch_size: int = 64, patience: int = 3,
              min_delta: float = 0.005, save_path: str | None = None) -> list[float]:
        """Train network to imitate heuristic bot via cross-entropy.

        Saves model after each epoch. Stops early when loss improvement
        is below min_delta for `patience` consecutive epochs.
        """
        self.network.train()
        losses = []
        best_loss = float('inf')
        stale_epochs = 0

        for epoch in range(epochs):
            random.shuffle(samples)
            epoch_loss = 0.0
            num_batches = 0

            for i in range(0, len(samples), batch_size):
                batch = samples[i:i + batch_size]
                total_loss = torch.tensor(0.0)

                for sample in batch:
                    scores, _ = self.network(sample.state, sample.action_tensors)
                    log_probs = F.log_softmax(scores, dim=-1)
                    loss = -log_probs[sample.target_idx]
                    total_loss = total_loss + loss

                total_loss = total_loss / len(batch)

                self.optimizer.zero_grad()
                total_loss.backward()
                nn.utils.clip_grad_norm_(self.network.parameters(), 0.5)
                self.optimizer.step()

                epoch_loss += total_loss.item()
                num_batches += 1

            avg_loss = epoch_loss / max(num_batches, 1)
            losses.append(avg_loss)
            print(f"  Imitation epoch {epoch + 1}: loss={avg_loss:.4f}")

            # Save after each epoch
            if save_path:
                torch.save(self.network.state_dict(), save_path)

            # Early stopping check
            if best_loss - avg_loss > min_delta:
                best_loss = avg_loss
                stale_epochs = 0
            else:
                stale_epochs += 1
                if stale_epochs >= patience:
                    print(f"  Early stopping — no improvement for {patience} epochs")
                    break

        return losses


# === PPO Self-Play Training ===

class PPOTrainer:
    """PPO with self-play for Sub-Five."""

    def __init__(self, network: SubFiveNetwork, lr: float = 3e-4,
                 gamma: float = 0.99, clip_ratio: float = 0.2,
                 entropy_coef: float = 0.01, value_coef: float = 0.5):
        self.network = network
        self.optimizer = torch.optim.Adam(network.parameters(), lr=lr)
        self.gamma = gamma
        self.clip_ratio = clip_ratio
        self.entropy_coef = entropy_coef
        self.value_coef = value_coef
        self.frozen_opponents: deque[SubFiveNetwork] = deque(maxlen=5)

    def collect_rollout(self, num_games: int = 64,
                        num_players: int = 3) -> list[Experience]:
        """Play games collecting experience from all seats."""
        self.network.eval()
        all_experiences: list[Experience] = []

        for _ in range(num_games):
            experiences = self._play_one_game(num_players)
            all_experiences.extend(experiences)

        return all_experiences

    def _play_one_game(self, num_players: int) -> list[Experience]:
        """Play one full game, collecting experiences from all players."""
        env = SubFiveEnv(num_players)
        env.reset()

        # Decide which seats use frozen opponents
        use_frozen = {}
        frozen_net = None
        if self.frozen_opponents:
            frozen_net = random.choice(list(self.frozen_opponents))
            for name in env.player_names[1:]:
                use_frozen[name] = random.random() < 0.5

        # Per-player experience buffers
        player_exps: dict[str, list[Experience]] = {
            name: [] for name in env.player_names
        }

        max_rounds = 30  # games end well before this
        for _ in range(max_rounds):
            # Play one round
            round_exps = self._play_one_round(env, frozen_net, use_frozen)
            for name, exps in round_exps.items():
                player_exps[name].extend(exps)

            if env.is_game_over():
                break

            # Start next round
            env.all_mark_ready()

        # Compute discounted returns
        all_exps = []
        for name, exps in player_exps.items():
            self._compute_returns(exps)
            all_exps.extend(exps)

        return all_exps

    def _play_one_round(self, env: SubFiveEnv, frozen_net, use_frozen):
        """Play turns until round ends. Returns per-player experiences."""
        player_exps: dict[str, list[Experience]] = {
            name: [] for name in env.player_names
        }

        max_turns = len(env.player_names) * 50
        for _ in range(max_turns):
            if env.is_round_ended() or env.is_game_over():
                break

            name = env.current_player_name()
            net = self.network
            if frozen_net and use_frozen.get(name, False):
                net = frozen_net

            # Get observation and valid actions
            obs = env._observe(name)
            actions, action_tensors = env.get_valid_action_tensors(name)

            # Select action
            action_idx, log_prob, value = net.select_action(obs, action_tensors)

            # Step environment
            next_obs, reward, done, info = env.step(name, action_idx)

            # Store experience (only for current network seats)
            if not use_frozen.get(name, False):
                player_exps[name].append(Experience(
                    state=obs,
                    action_tensors=action_tensors,
                    action_idx=action_idx,
                    log_prob=log_prob.item(),
                    value=value.item(),
                    reward=reward,
                    num_actions=len(actions),
                ))

            if done:
                # Add game-end rewards for non-ending players
                if info.get("game_over"):
                    round_rewards = env.get_round_rewards()
                    for pname, exp_list in player_exps.items():
                        if pname != name and exp_list:
                            exp_list[-1].reward += round_rewards.get(pname, 0)
                break

        # Add round-end rewards for non-ending players
        if env.is_round_ended():
            round_rewards = env.get_round_rewards()
            for pname, exp_list in player_exps.items():
                if exp_list:
                    # The ender already got reward from step()
                    if pname != env.current_player_name() or not any(
                        e.reward != 0 for e in exp_list[-1:]
                    ):
                        exp_list[-1].reward += round_rewards.get(pname, 0)

        return player_exps

    def _compute_returns(self, experiences: list[Experience]):
        """Compute discounted returns in-place (stored in reward field)."""
        if not experiences:
            return

        running_return = 0.0
        for exp in reversed(experiences):
            running_return = exp.reward + self.gamma * running_return
            exp.reward = running_return  # overwrite reward with return

    def ppo_update(self, experiences: list[Experience],
                   epochs: int = 4, batch_size: int = 64) -> dict[str, float]:
        """Run PPO update on collected experiences."""
        if not experiences:
            return {"policy_loss": 0, "value_loss": 0, "entropy": 0}

        self.network.train()
        total_policy_loss = 0.0
        total_value_loss = 0.0
        total_entropy = 0.0
        num_updates = 0

        for _ in range(epochs):
            random.shuffle(experiences)

            for i in range(0, len(experiences), batch_size):
                batch = experiences[i:i + batch_size]
                batch_policy_loss = torch.tensor(0.0)
                batch_value_loss = torch.tensor(0.0)
                batch_entropy = torch.tensor(0.0)

                for exp in batch:
                    new_log_prob, new_value, entropy = self.network.evaluate_action(
                        exp.state, exp.action_tensors, exp.action_idx
                    )

                    # Advantage
                    advantage = exp.reward - exp.value  # return - baseline

                    # PPO clipped objective
                    ratio = torch.exp(new_log_prob - exp.log_prob)
                    clipped = torch.clamp(ratio, 1 - self.clip_ratio, 1 + self.clip_ratio)
                    policy_loss = -torch.min(
                        ratio * advantage, clipped * advantage
                    )

                    # Value loss
                    value_loss = F.mse_loss(new_value, torch.tensor(exp.reward))

                    batch_policy_loss = batch_policy_loss + policy_loss
                    batch_value_loss = batch_value_loss + value_loss
                    batch_entropy = batch_entropy + entropy

                n = len(batch)
                loss = (
                    batch_policy_loss / n
                    + self.value_coef * batch_value_loss / n
                    - self.entropy_coef * batch_entropy / n
                )

                self.optimizer.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(self.network.parameters(), 0.5)
                self.optimizer.step()

                total_policy_loss += (batch_policy_loss / n).item()
                total_value_loss += (batch_value_loss / n).item()
                total_entropy += (batch_entropy / n).item()
                num_updates += 1

        n = max(num_updates, 1)
        return {
            "policy_loss": total_policy_loss / n,
            "value_loss": total_value_loss / n,
            "entropy": total_entropy / n,
        }

    def snapshot_opponent(self):
        """Save a copy of the current network as a frozen opponent."""
        frozen = copy.deepcopy(self.network)
        frozen.eval()
        self.frozen_opponents.append(frozen)

    def train(self, total_games: int = 10000, games_per_iter: int = 64,
              eval_interval: int = 50, num_players: int = 3,
              save_path: str | None = None):
        """Main training loop: collect -> update -> evaluate -> repeat."""
        iterations = total_games // games_per_iter
        train_start = time.time()

        for i in range(iterations):
            t0 = time.time()

            # Collect
            experiences = self.collect_rollout(games_per_iter, num_players)

            # Update
            metrics = self.ppo_update(experiences)

            elapsed = time.time() - t0
            total_elapsed = time.time() - train_start

            if (i + 1) % 10 == 0:
                # Estimate remaining time
                avg_per_iter = total_elapsed / (i + 1)
                eta = avg_per_iter * (iterations - i - 1)
                eta_min = eta / 60

                print(
                    f"  Iter {i + 1}/{iterations}: "
                    f"exps={len(experiences)}, "
                    f"policy={metrics['policy_loss']:.4f}, "
                    f"value={metrics['value_loss']:.4f}, "
                    f"entropy={metrics['entropy']:.3f}, "
                    f"iter={elapsed:.1f}s, "
                    f"total={total_elapsed / 60:.1f}m, "
                    f"ETA={eta_min:.0f}m"
                )

            # Snapshot opponent
            if (i + 1) % eval_interval == 0:
                self.snapshot_opponent()
                win_rate = evaluate_vs_heuristic(self.network, num_players=num_players)
                print(f"  === Eval: win rate vs heuristic = {win_rate:.1%} ===")

                if save_path:
                    torch.save(self.network.state_dict(), save_path)
                    print(f"  Saved to {save_path}")


# === Evaluation ===

def evaluate_vs_heuristic(network: SubFiveNetwork, num_games: int = 100,
                          num_players: int = 3) -> float:
    """Play games with RL agent (seat 0) vs heuristic bots. Return win rate."""
    network.eval()
    wins = 0

    for _ in range(num_games):
        env = SubFiveEnv(num_players)
        strategies = {name: BotStrategy() for name in env.player_names[1:]}
        env.reset()

        max_rounds = 30
        for _ in range(max_rounds):
            # Play one round
            max_turns = num_players * 50
            for _ in range(max_turns):
                if env.is_round_ended() or env.is_game_over():
                    break

                name = env.current_player_name()

                if name == env.player_names[0]:
                    # RL agent
                    obs = env._observe(name)
                    _, action_tensors = env.get_valid_action_tensors(name)
                    action_idx, _, _ = network.select_action(
                        obs, action_tensors, deterministic=True
                    )
                    env.step(name, action_idx)
                else:
                    # Heuristic bot
                    player = env._get_player(name)
                    strategy = strategies[name]
                    pile_top = env.game.play_pile[-1] if env.game.play_pile else None
                    opp_counts = {
                        p.name: len(p.hand) for p in env.game.players if p.name != name
                    }

                    if env.game.last_action:
                        strategy.observe_action(env.game.last_action)

                    bot_cards, bot_draw, bot_end = strategy.choose_action(
                        player, pile_top, len(env.game.deck), opp_counts
                    )

                    # Find matching action index
                    valid_actions = env.get_valid_actions(name)
                    action_idx = _find_bot_action(
                        valid_actions, bot_cards, bot_draw, bot_end, player
                    )
                    env.step(name, action_idx)

            if env.is_game_over():
                winner_names = {w[0] for w in env.game.winners}
                if env.player_names[0] in winner_names:
                    wins += 1
                break

            env.all_mark_ready()

    return wins / max(num_games, 1)


def _find_bot_action(valid_actions, bot_cards, bot_draw, bot_end, player):
    """Find the action index matching the bot's choice. Fallback to 0."""
    bot_card_set = frozenset(bot_cards)

    for i, (cards, draw, end) in enumerate(valid_actions):
        if end and bot_end:
            return i
        if not end and not bot_end:
            if frozenset(cards) == bot_card_set and draw == bot_draw:
                return i

    # Fuzzy: same cards, any draw
    for i, (cards, draw, end) in enumerate(valid_actions):
        if not end and not bot_end and frozenset(cards) == bot_card_set:
            return i

    # Fallback: play first valid action
    return 0
