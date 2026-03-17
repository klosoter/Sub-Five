"""State and action encoding for the Sub-Five RL agent.

Maps game state and actions to fixed-size tensors suitable for neural networks.
All tensors use float32 with values normalized to roughly [0, 1].
"""
import torch
from collections import deque
from ..card import Card, SUITS, RANKS, JOKER, JOKER_SUITS, CARD_VALUES
from ..bot import BotStrategy

# Total unique cards: 52 normal + 2 jokers = 54
NUM_CARDS = 54

# Build card-to-index mapping: suit_idx * 13 + rank_idx, jokers at 52-53
_RANK_IDX = {rank: i for i, rank in enumerate(RANKS)}  # A=0, 2=1, ..., K=12
_SUIT_IDX = {suit: i for i, suit in enumerate(SUITS)}  # ♠=0, ♥=1, ♦=2, ♣=3
_JOKER_IDX = {suit: 52 + i for i, suit in enumerate(JOKER_SUITS)}  # ♠=52, ♥=53

# Action history: 10 floats per action, 6 actions (2 rounds × 3 players)
ACTION_HISTORY_SIZE = 6
FLOATS_PER_ACTION = 10  # simplified encoding of one action
STATE_DIM = 54 + 54 + 54 + 1 + 1 + 1 + 2 + 2 + 1 + ACTION_HISTORY_SIZE * FLOATS_PER_ACTION  # = 230
ACTION_DIM = 54 + 1 + 1  # = 56


def card_to_index(card: Card) -> int:
    """Map a Card to its unique index 0-53."""
    if card.is_joker():
        return _JOKER_IDX[card.suit]
    return _SUIT_IDX[card.suit] * 13 + _RANK_IDX[card.rank]


def card_str_to_index(s: str) -> int:
    """Map a card string like 'A♠' or 'JOKER♠' to index 0-53."""
    return card_to_index(Card.from_str(s))


def _cards_to_binary(cards, use_strings=False) -> torch.Tensor:
    """Convert a list of Card objects (or card strings) to a 54-dim binary vector."""
    vec = torch.zeros(NUM_CARDS)
    for c in cards:
        idx = card_str_to_index(c) if use_strings else card_to_index(c)
        vec[idx] = 1.0
    return vec


def _encode_action_history_entry(action: dict | None) -> torch.Tensor:
    """Encode one action into FLOATS_PER_ACTION floats.

    Encoding (10 floats):
    - [0-3]: which player (one-hot, max 4 players, padded)
    - [4]: number of cards played / 5
    - [5]: max card value played / 10
    - [6]: draw source (0=deck, 1=pile)
    - [7]: drew a known card (1 if pile draw with visible card)
    - [8]: drawn card value / 10 (0 if unknown)
    - [9]: total points played / 50
    """
    vec = torch.zeros(FLOATS_PER_ACTION)
    if action is None:
        return vec

    # Player index (stored externally as 0-based)
    player_idx = action.get("_player_idx", 0)
    if 0 <= player_idx < 4:
        vec[player_idx] = 1.0

    played = action.get("played", [])
    vec[4] = len(played) / 5.0

    if played:
        values = [CARD_VALUES.get(Card.from_str(c).rank, 0) for c in played]
        vec[5] = max(values) / 10.0
        vec[9] = sum(values) / 50.0

    vec[6] = 1.0 if action.get("draw_source") == "pile" else 0.0

    drawn = action.get("drawn_card")
    if drawn and action.get("draw_source") == "pile":
        vec[7] = 1.0
        vec[8] = CARD_VALUES.get(Card.from_str(drawn).rank, 0) / 10.0

    return vec


def encode_state(
    hand: list[Card],
    pile_top: Card | None,
    seen_cards: set[str],
    hand_value: int,
    can_end: bool,
    own_score: int,
    opponent_counts: list[int],
    opponent_scores: list[int],
    deck_count: int,
    action_history: list[dict | None],
) -> torch.Tensor:
    """Encode full game state as a fixed-size tensor.

    Args:
        hand: Player's current hand (Card objects)
        pile_top: Top card of the pile (Card object or None)
        seen_cards: Set of card strings that have been observed
        hand_value: Current hand point value
        can_end: Whether player can end the round
        own_score: Player's cumulative score
        opponent_counts: List of opponent card counts (length 2, padded with 0)
        opponent_scores: List of opponent scores (length 2, padded with 0)
        deck_count: Cards remaining in deck
        action_history: Last ACTION_HISTORY_SIZE actions (dicts or None)

    Returns:
        Tensor of shape (STATE_DIM,)
    """
    parts = []

    # Own hand: 54-dim binary
    parts.append(_cards_to_binary(hand))

    # Pile top: 54-dim one-hot
    pile_vec = torch.zeros(NUM_CARDS)
    if pile_top is not None:
        pile_vec[card_to_index(pile_top)] = 1.0
    parts.append(pile_vec)

    # Cards seen (card counting): 54-dim binary
    parts.append(_cards_to_binary(seen_cards, use_strings=True))

    # Scalar features
    parts.append(torch.tensor([hand_value / 50.0]))
    parts.append(torch.tensor([1.0 if can_end else 0.0]))
    parts.append(torch.tensor([own_score / 100.0]))

    # Opponent card counts (pad to 2)
    opp_counts = list(opponent_counts[:2])
    while len(opp_counts) < 2:
        opp_counts.append(0)
    parts.append(torch.tensor([c / 10.0 for c in opp_counts]))

    # Opponent scores (pad to 2)
    opp_scores = list(opponent_scores[:2])
    while len(opp_scores) < 2:
        opp_scores.append(0)
    parts.append(torch.tensor([s / 100.0 for s in opp_scores]))

    # Deck count
    parts.append(torch.tensor([deck_count / 54.0]))

    # Action history (last 6 actions)
    history = list(action_history)
    while len(history) < ACTION_HISTORY_SIZE:
        history.append(None)
    for action in history[-ACTION_HISTORY_SIZE:]:
        parts.append(_encode_action_history_entry(action))

    return torch.cat(parts)


def encode_action(cards: list[Card], draw_source: str, end_round: bool) -> torch.Tensor:
    """Encode one candidate action as a fixed-size tensor.

    Args:
        cards: Cards to play (empty if ending round)
        draw_source: "deck" or "pile"
        end_round: Whether this action ends the round

    Returns:
        Tensor of shape (ACTION_DIM,)
    """
    parts = []
    parts.append(_cards_to_binary(cards))
    parts.append(torch.tensor([1.0 if draw_source == "pile" else 0.0]))
    parts.append(torch.tensor([1.0 if end_round else 0.0]))
    return torch.cat(parts)


def enumerate_actions(hand: list[Card], pile_top: Card | None, can_end: bool):
    """Enumerate all valid (cards, draw_source, end_round) tuples.

    Returns list of (cards: list[Card], draw_source: str, end_round: bool) tuples.
    Reuses BotStrategy._find_all_plays() for play enumeration.
    """
    actions = []

    if can_end:
        actions.append(([], "deck", True))

    # Find all valid plays
    strategy = BotStrategy()
    plays = strategy._find_all_plays(hand)

    for play in plays:
        actions.append((play, "deck", False))
        if pile_top is not None:
            actions.append((play, "pile", False))

    return actions
