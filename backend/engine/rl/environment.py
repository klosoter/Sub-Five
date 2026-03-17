"""Gym-like environment wrapping the Sub-Five game engine for RL training.

Manages game lifecycle, card tracking, action history, and reward computation.
Supports multi-agent self-play: all players share the same interface.
"""
import torch
from collections import deque
from ..game import Game, InvalidMoveError
from ..card import Card, sort_hand
from ..bot import CardTracker
from ..player import Player
from .encoding import (
    encode_state, encode_action, enumerate_actions,
    ACTION_HISTORY_SIZE, STATE_DIM, ACTION_DIM,
)


class SubFiveEnv:
    """Environment for Sub-Five RL training.

    Wraps the Game engine and provides:
    - State observations as tensors
    - Action enumeration with validity masks
    - Reward computation
    - Multi-agent turn management
    """

    def __init__(self, num_players: int = 3):
        self.num_players = num_players
        self.player_names = [f"P{i}" for i in range(num_players)]
        self.game: Game | None = None
        self.trackers: dict[str, CardTracker] = {}
        self.action_histories: dict[str, deque] = {}
        self.prev_hand_values: dict[str, int] = {}
        self._player_indices: dict[str, int] = {}
        self.rounds_played = 0
        self.reset()

    def reset(self) -> dict[str, torch.Tensor]:
        """Start a new game. Returns initial observations for all players."""
        self.game = Game(self.player_names)
        self.trackers = {name: CardTracker() for name in self.player_names}
        self.action_histories = {
            name: deque(maxlen=ACTION_HISTORY_SIZE)
            for name in self.player_names
        }
        self._player_indices = {name: i for i, name in enumerate(self.player_names)}
        self.rounds_played = 0

        # Initialize hand values and observe initial hands
        for name in self.player_names:
            player = self._get_player(name)
            self.prev_hand_values[name] = player.hand_value()
            self.trackers[name].observe_hand(player.hand)

        return {name: self._observe(name) for name in self.player_names}

    def _get_player(self, name: str) -> Player:
        return next(p for p in self.game.players if p.name == name)

    def _observe(self, name: str) -> torch.Tensor:
        """Build observation tensor for a player."""
        player = self._get_player(name)
        pile_top = self.game.play_pile[-1] if self.game.play_pile else None

        opponents = [p for p in self.game.players if p.name != name]
        opp_counts = [len(p.hand) for p in opponents]
        opp_scores = [p.score for p in opponents]

        return encode_state(
            hand=player.hand,
            pile_top=pile_top,
            seen_cards=self.trackers[name].seen_cards,
            hand_value=player.hand_value(),
            can_end=player.can_end_round(),
            own_score=player.score,
            opponent_counts=opp_counts,
            opponent_scores=opp_scores,
            deck_count=len(self.game.deck),
            action_history=list(self.action_histories[name]),
        )

    def current_player_name(self) -> str:
        return self.game.current_player().name

    def is_round_ended(self) -> bool:
        return self.game.round_ended

    def is_game_over(self) -> bool:
        return self.game.game_over

    def get_valid_actions(self, name: str):
        """Return list of valid (cards, draw_source, end_round) tuples."""
        player = self._get_player(name)
        pile_top = self.game.play_pile[-1] if self.game.play_pile else None
        return enumerate_actions(player.hand, pile_top, player.can_end_round())

    def get_valid_action_tensors(self, name: str) -> tuple[list, torch.Tensor]:
        """Return valid actions and their tensor encodings.

        Returns:
            (actions_list, action_tensor) where action_tensor has shape (N, ACTION_DIM)
        """
        actions = self.get_valid_actions(name)
        tensors = torch.stack([
            encode_action(cards, draw, end)
            for cards, draw, end in actions
        ])
        return actions, tensors

    def step(self, name: str, action_index: int) -> tuple[torch.Tensor, float, bool, dict]:
        """Execute an action for the named player.

        Args:
            name: Player name (must be current player)
            action_index: Index into get_valid_actions() result

        Returns:
            (next_obs, reward, done, info)
            - next_obs: observation tensor for this player after the action
            - reward: immediate reward
            - done: True if game is over (someone hit 100)
            - info: dict with extra data (round_ended, scores, etc.)
        """
        actions = self.get_valid_actions(name)
        cards, draw_source, end_round = actions[action_index]

        reward = 0.0
        info = {"round_ended": False, "game_over": False}

        if end_round:
            return self._do_end_round(name, info)

        return self._do_play(name, cards, draw_source, info)

    def _do_play(self, name: str, cards: list[Card], draw_source: str,
                 info: dict) -> tuple[torch.Tensor, float, bool, dict]:
        """Execute a play action and compute reward."""
        player = self._get_player(name)
        prev_hv = player.hand_value()

        try:
            action = self.game.play_cards(name, cards, draw_source)
        except InvalidMoveError:
            # Should not happen if enumerate_actions is correct, but handle gracefully
            return self._observe(name), -1.0, False, {"error": "invalid_move"}

        # Update trackers for all players
        for pname in self.player_names:
            tracker = self.trackers[pname]
            tracker.observe_action(action)
            if pname == name:
                tracker.observe_hand(self._get_player(name).hand)

        # Store action in history with player index
        action_with_idx = {**action, "_player_idx": self._player_indices[name]}
        for pname in self.player_names:
            self.action_histories[pname].append(action_with_idx)

        # Per-turn reward shaping (small signals)
        cards_played = len(cards)
        new_hv = self._get_player(name).hand_value()
        reward = 0.02 * cards_played
        if new_hv > prev_hv:
            reward -= 0.01

        self.prev_hand_values[name] = new_hv

        obs = self._observe(name)
        return obs, reward, False, info

    def _do_end_round(self, name: str, info: dict) -> tuple[torch.Tensor, float, bool, dict]:
        """End the round and compute rewards for the ending player."""
        try:
            result = self.game.end_round(name)
        except InvalidMoveError:
            return self._observe(name), -1.0, False, {"error": "invalid_end_round"}

        self.rounds_played += 1
        round_points = result.round_points[name]
        penalty = result.penalty_applied and result.ender_name == name

        # Round-end reward for the ender
        reward = -round_points / 50.0
        if penalty:
            reward -= 0.3

        info["round_ended"] = True
        info["round_points"] = result.round_points
        info["penalty"] = penalty

        # Check game over
        done = self.game.game_over
        if done:
            info["game_over"] = True
            info["winners"] = self.game.winners
            # Game-end bonus
            winner_names = {w[0] for w in self.game.winners}
            if name in winner_names:
                reward += 1.0
            else:
                reward -= self._get_player(name).score / 100.0

        obs = self._observe(name)
        return obs, reward, done, info

    def get_round_rewards(self) -> dict[str, float]:
        """Get round-end rewards for all players (call after round ends).

        Only meaningful when is_round_ended() is True.
        """
        if not self.game.round_ended or not self.game.last_round_data:
            return {name: 0.0 for name in self.player_names}

        rewards = {}
        for name in self.player_names:
            pts = self.game.last_round_data["round_points"].get(name, 0)
            rewards[name] = -pts / 50.0

            if self.game.game_over:
                winner_names = {w[0] for w in self.game.winners}
                if name in winner_names:
                    rewards[name] += 1.0
                else:
                    rewards[name] -= self._get_player(name).score / 100.0

        return rewards

    def start_next_round(self):
        """Start a new round (call after all players have been rewarded)."""
        self.game.start_next_round()
        # Re-observe hands
        for name in self.player_names:
            self.trackers[name].observe_hand(self._get_player(name).hand)
            self.prev_hand_values[name] = self._get_player(name).hand_value()

    def all_mark_ready(self):
        """Mark all players ready and start next round."""
        for name in self.player_names:
            self.game.mark_ready(name)
        self.start_next_round()
