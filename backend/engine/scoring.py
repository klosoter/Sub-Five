"""Scoring logic for Sub-Five rounds and games.

Pure functions — take player data, return results.
"""
from dataclasses import dataclass, field
from .card import sort_hand


@dataclass
class RoundResult:
    """Result of ending a round."""
    hand_values: dict[str, int]       # player_name -> raw hand value
    round_points: dict[str, int]      # player_name -> points added this round
    total_scores: dict[str, int]      # player_name -> total score after round
    penalty_applied: bool             # whether the ender got +15
    ender_name: str
    hands: dict[str, list[str]]       # player_name -> [card strings] for display


def calculate_round_scores(players, ending_player_name):
    """Score a round when a player ends it.

    Rules:
    - Player with lowest hand value scores 0 for the round
    - All others add their hand value to their total
    - If the ender doesn't have the strictly lowest value,
      they get +15 penalty on top of their hand value

    Returns a RoundResult with all scoring data.
    """
    ending_player = next((p for p in players if p.name == ending_player_name), None)
    if not ending_player:
        raise ValueError("Player not found.")
    if not ending_player.can_end_round():
        raise ValueError("You may only end the round with 5 points or fewer.")

    # Capture hand values and hand cards before any mutation
    hand_values = {p.name: p.hand_value() for p in players}
    hands = {p.name: [str(c) for c in sort_hand(p.hand)] for p in players}

    ending_value = hand_values[ending_player_name]
    lowest_value = min(hand_values.values())

    # Determine penalty: if any OTHER player has value <= ender's value
    penalty_applied = any(
        v <= ending_value
        for name, v in hand_values.items()
        if name != ending_player_name
    )

    # Calculate round points
    round_points = {}
    for p in players:
        pv = hand_values[p.name]
        if p.name == ending_player_name:
            if penalty_applied:
                round_points[p.name] = pv + 15
            else:
                round_points[p.name] = 0
        elif pv == lowest_value:
            round_points[p.name] = 0
        else:
            round_points[p.name] = pv

    # Apply points to player scores
    for p in players:
        p.score += round_points[p.name]

    total_scores = {p.name: p.score for p in players}

    return RoundResult(
        hand_values=hand_values,
        round_points=round_points,
        total_scores=total_scores,
        penalty_applied=penalty_applied,
        ender_name=ending_player_name,
        hands=hands,
    )


def determine_winners(players):
    """Return list of (name, score) tuples for player(s) with lowest score.

    Only meaningful when at least one player has >= 100 points (game over).
    """
    if all(p.score < 100 for p in players):
        return []
    min_score = min(p.score for p in players)
    return [(p.name, p.score) for p in players if p.score == min_score]


def is_game_over(players):
    """Check if any player has reached >= 100 points."""
    return any(p.score >= 100 for p in players)
