import pytest
from backend.engine.card import Card, JOKER
from backend.engine.validation import is_valid_set, is_valid_series, is_valid_play


class TestIsValidSet:
    def test_single_card(self):
        assert is_valid_set([Card("A", "♠")])

    def test_pair(self):
        assert is_valid_set([Card("K", "♠"), Card("K", "♥")])

    def test_triple(self):
        assert is_valid_set([Card("5", "♠"), Card("5", "♥"), Card("5", "♦")])

    def test_quad(self):
        cards = [Card("Q", s) for s in ["♠", "♥", "♦", "♣"]]
        assert is_valid_set(cards)

    def test_different_ranks_invalid(self):
        assert not is_valid_set([Card("A", "♠"), Card("K", "♠")])

    def test_joker_with_rank(self):
        assert is_valid_set([Card("K", "♠"), Card(JOKER, "♠")])

    def test_only_jokers_invalid(self):
        assert not is_valid_set([Card(JOKER, "♠"), Card(JOKER, "♥")])

    def test_empty_invalid(self):
        assert not is_valid_set([])


class TestIsValidSeries:
    # --- Basic sequences ---
    def test_three_card_sequence(self):
        cards = [Card("3", "♠"), Card("4", "♠"), Card("5", "♠")]
        assert is_valid_series(cards)

    def test_four_card_sequence(self):
        cards = [Card("5", "♥"), Card("6", "♥"), Card("7", "♥"), Card("8", "♥")]
        assert is_valid_series(cards)

    def test_five_card_sequence(self):
        cards = [Card("A", "♦"), Card("2", "♦"), Card("3", "♦"), Card("4", "♦"), Card("5", "♦")]
        assert is_valid_series(cards)

    def test_sequence_with_ten(self):
        cards = [Card("9", "♠"), Card("10", "♠"), Card("J", "♠")]
        assert is_valid_series(cards)

    def test_sequence_ten_jack_queen(self):
        cards = [Card("10", "♥"), Card("J", "♥"), Card("Q", "♥")]
        assert is_valid_series(cards)

    def test_jack_queen_king(self):
        cards = [Card("J", "♠"), Card("Q", "♠"), Card("K", "♠")]
        assert is_valid_series(cards)

    # --- Wraparound ---
    def test_wraparound_queen_king_ace(self):
        cards = [Card("Q", "♠"), Card("K", "♠"), Card("A", "♠")]
        assert is_valid_series(cards)

    def test_wraparound_king_ace_two(self):
        cards = [Card("K", "♠"), Card("A", "♠"), Card("2", "♠")]
        assert is_valid_series(cards)

    def test_wraparound_jack_queen_king_ace_two(self):
        cards = [Card("J", "♠"), Card("Q", "♠"), Card("K", "♠"), Card("A", "♠"), Card("2", "♠")]
        assert is_valid_series(cards)

    # --- Reverse order ---
    def test_reverse_five_four_three(self):
        cards = [Card("5", "♠"), Card("4", "♠"), Card("3", "♠")]
        assert is_valid_series(cards)

    def test_reverse_wraparound_two_ace_king(self):
        cards = [Card("2", "♠"), Card("A", "♠"), Card("K", "♠")]
        assert is_valid_series(cards)

    def test_reverse_ace_king_queen(self):
        cards = [Card("A", "♠"), Card("K", "♠"), Card("Q", "♠")]
        assert is_valid_series(cards)

    # --- Jokers as wildcards ---
    def test_joker_in_middle(self):
        cards = [Card("3", "♠"), Card(JOKER, "♠"), Card("5", "♠")]
        assert is_valid_series(cards)

    def test_joker_at_end(self):
        cards = [Card("3", "♠"), Card("4", "♠"), Card(JOKER, "♠")]
        assert is_valid_series(cards)

    def test_joker_at_start(self):
        cards = [Card(JOKER, "♠"), Card("4", "♠"), Card("5", "♠")]
        assert is_valid_series(cards)

    def test_two_jokers(self):
        cards = [Card(JOKER, "♠"), Card("4", "♠"), Card(JOKER, "♥")]
        assert is_valid_series(cards)

    # --- Invalid cases ---
    def test_too_few_cards(self):
        assert not is_valid_series([Card("A", "♠"), Card("2", "♠")])

    def test_mixed_suits(self):
        cards = [Card("3", "♠"), Card("4", "♥"), Card("5", "♠")]
        assert not is_valid_series(cards)

    def test_non_sequential(self):
        cards = [Card("3", "♠"), Card("5", "♠"), Card("7", "♠")]
        assert not is_valid_series(cards)

    def test_gap_too_large_for_joker(self):
        # 3-joker-6: joker fills one gap (position 4), but 5 is still missing
        cards = [Card("3", "♠"), Card(JOKER, "♠"), Card("6", "♠")]
        assert not is_valid_series(cards)

    def test_empty(self):
        assert not is_valid_series([])

    def test_only_jokers(self):
        assert not is_valid_series([Card(JOKER, "♠"), Card(JOKER, "♥"), Card(JOKER, "♠")])


class TestIsValidPlay:
    def test_valid_set(self):
        assert is_valid_play([Card("K", "♠"), Card("K", "♥")])

    def test_valid_series(self):
        assert is_valid_play([Card("3", "♠"), Card("4", "♠"), Card("5", "♠")])

    def test_single_card_is_set(self):
        assert is_valid_play([Card("A", "♠")])

    def test_invalid(self):
        assert not is_valid_play([Card("A", "♠"), Card("3", "♥")])
