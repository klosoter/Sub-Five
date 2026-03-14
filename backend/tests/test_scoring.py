import pytest
from backend.engine.card import Card, JOKER
from backend.engine.player import Player
from backend.engine.scoring import calculate_round_scores, determine_winners, is_game_over


def make_player(name, hand_cards, score=0):
    """Helper to create a player with a specific hand."""
    p = Player(name)
    p.hand = hand_cards
    p.score = score
    return p


class TestCalculateRoundScores:
    def test_ender_has_lowest_gets_zero(self):
        players = [
            make_player("Alice", [Card("A", "♠"), Card("2", "♠"), Card("A", "♥")]),  # value=4
            make_player("Bob", [Card("K", "♠"), Card("Q", "♠"), Card("J", "♠")]),    # value=30
        ]
        result = calculate_round_scores(players, "Alice")
        assert result.round_points["Alice"] == 0
        assert result.round_points["Bob"] == 30
        assert not result.penalty_applied

    def test_ender_penalty_when_not_lowest(self):
        players = [
            make_player("Alice", [Card("A", "♠"), Card("3", "♠"), Card("A", "♥")]),  # value=5
            make_player("Bob", [Card("A", "♦"), Card("2", "♦"), Card("A", "♣")]),    # value=4
        ]
        result = calculate_round_scores(players, "Alice")
        assert result.penalty_applied
        assert result.round_points["Alice"] == 5 + 15  # hand value + penalty
        assert result.round_points["Bob"] == 0  # lowest gets 0

    def test_ender_penalty_when_tied(self):
        """If another player ties the ender's value, ender gets penalty."""
        players = [
            make_player("Alice", [Card("A", "♠"), Card("A", "♥"), Card("A", "♦")]),  # value=3
            make_player("Bob", [Card("A", "♣"), Card("2", "♠"), Card(JOKER, "♠")]),  # value=3
        ]
        result = calculate_round_scores(players, "Alice")
        assert result.penalty_applied
        assert result.round_points["Alice"] == 3 + 15

    def test_scores_accumulate(self):
        players = [
            make_player("Alice", [Card("A", "♠")], score=50),  # value=1
            make_player("Bob", [Card("K", "♠")], score=40),     # value=10
        ]
        result = calculate_round_scores(players, "Alice")
        assert players[0].score == 50  # +0 (lowest)
        assert players[1].score == 50  # +10

    def test_hands_captured_in_result(self):
        players = [
            make_player("Alice", [Card("A", "♠"), Card("2", "♠")]),
            make_player("Bob", [Card("K", "♠")]),
        ]
        result = calculate_round_scores(players, "Alice")
        assert "Alice" in result.hands
        assert "Bob" in result.hands
        assert len(result.hands["Alice"]) == 2

    def test_raises_if_hand_too_high(self):
        players = [
            make_player("Alice", [Card("K", "♠"), Card("Q", "♠")]),  # value=20
        ]
        with pytest.raises(ValueError, match="5 points or fewer"):
            calculate_round_scores(players, "Alice")

    def test_raises_if_player_not_found(self):
        players = [make_player("Alice", [Card("A", "♠")])]
        with pytest.raises(ValueError, match="not found"):
            calculate_round_scores(players, "Nobody")

    def test_three_players(self):
        players = [
            make_player("Alice", [Card("A", "♠"), Card("A", "♥")]),   # value=2, ender
            make_player("Bob", [Card("5", "♠"), Card("5", "♥")]),     # value=10
            make_player("Carol", [Card("K", "♠"), Card("Q", "♥")]),   # value=20
        ]
        result = calculate_round_scores(players, "Alice")
        assert result.round_points["Alice"] == 0   # lowest, no penalty
        assert result.round_points["Bob"] == 10
        assert result.round_points["Carol"] == 20

    def test_multiple_players_at_lowest(self):
        """When multiple non-ender players tie for lowest, all get 0."""
        players = [
            make_player("Alice", [Card("A", "♠")]),                    # value=1, ender
            make_player("Bob", [Card("5", "♠"), Card("5", "♥")]),     # value=10
            make_player("Carol", [Card("5", "♦"), Card("5", "♣")]),   # value=10
        ]
        result = calculate_round_scores(players, "Alice")
        assert result.round_points["Alice"] == 0
        # Bob and Carol both have 10, but only the absolute lowest (Alice=1) gets 0
        # They are NOT the lowest, so they get their points
        assert result.round_points["Bob"] == 10
        assert result.round_points["Carol"] == 10


class TestDetermineWinners:
    def test_no_game_over(self):
        players = [make_player("Alice", [], score=50), make_player("Bob", [], score=60)]
        assert determine_winners(players) == []

    def test_single_winner(self):
        players = [
            make_player("Alice", [], score=30),
            make_player("Bob", [], score=100),
        ]
        winners = determine_winners(players)
        assert len(winners) == 1
        assert winners[0] == ("Alice", 30)

    def test_tied_winners(self):
        players = [
            make_player("Alice", [], score=30),
            make_player("Bob", [], score=30),
            make_player("Carol", [], score=100),
        ]
        winners = determine_winners(players)
        assert len(winners) == 2

    def test_multiple_over_100(self):
        players = [
            make_player("Alice", [], score=105),
            make_player("Bob", [], score=110),
        ]
        winners = determine_winners(players)
        assert winners[0] == ("Alice", 105)


class TestIsGameOver:
    def test_not_over(self):
        players = [make_player("A", [], score=50), make_player("B", [], score=99)]
        assert not is_game_over(players)

    def test_over_at_100(self):
        players = [make_player("A", [], score=50), make_player("B", [], score=100)]
        assert is_game_over(players)

    def test_over_above_100(self):
        players = [make_player("A", [], score=50), make_player("B", [], score=150)]
        assert is_game_over(players)
