"""RL bot strategy — drop-in replacement for BotStrategy using a trained neural network."""
import torch
from ..bot import CardTracker, BotStrategy
from ..card import Card
from ..player import Player
from .encoding import encode_state, encode_action, enumerate_actions
from .network import SubFiveNetwork


class RLBotStrategy:
    """Uses a trained SubFiveNetwork to make decisions.

    Same interface as BotStrategy.choose_action() so it can be used
    as a drop-in replacement in dev/routes.py.
    """

    def __init__(self, model_path: str):
        self.network = SubFiveNetwork()
        self.network.load_state_dict(torch.load(model_path, weights_only=True))
        self.network.eval()
        self.tracker = CardTracker()
        self.action_history: list[dict] = []

    def observe_action(self, action: dict):
        """Feed an action from the game log."""
        self.tracker.observe_action(action)
        self.action_history.append(action)

    def choose_action(self, player: Player, pile_top: Card | None,
                      deck_count: int, opponent_card_counts: dict[str, int] | None = None):
        """Choose an action using the trained network.

        Returns: (cards_to_play, draw_source, should_end_round)
        Same signature as BotStrategy.choose_action().
        """
        self.tracker.observe_hand(player.hand)

        opp_counts = opponent_card_counts or {}
        opp_count_list = list(opp_counts.values())
        # We don't have opponent scores here — use 0 as default
        opp_score_list = [0] * len(opp_count_list)

        state = encode_state(
            hand=player.hand,
            pile_top=pile_top,
            seen_cards=self.tracker.seen_cards,
            hand_value=player.hand_value(),
            can_end=player.can_end_round(),
            own_score=player.score,
            opponent_counts=opp_count_list,
            opponent_scores=opp_score_list,
            deck_count=deck_count,
            action_history=self.action_history[-6:],
        )

        valid_actions = enumerate_actions(
            player.hand, pile_top, player.can_end_round()
        )
        action_tensors = torch.stack([
            encode_action(cards, draw, end)
            for cards, draw, end in valid_actions
        ])

        with torch.no_grad():
            action_idx, _, _ = self.network.select_action(
                state, action_tensors, deterministic=True
            )

        cards, draw_source, should_end = valid_actions[action_idx]
        return cards, draw_source, should_end
