import pytest
from backend.engine.card import Card, Deck, sort_hand, JOKER, SUITS, RANKS, JOKER_SUITS


class TestCard:
    def test_create_regular_card(self):
        c = Card("A", "♠")
        assert c.rank == "A"
        assert c.suit == "♠"
        assert str(c) == "A♠"

    def test_create_joker(self):
        c = Card(JOKER, "♠")
        assert c.is_joker()
        assert str(c) == "JOKER♠"

    def test_from_str_regular(self):
        c = Card.from_str("A♠")
        assert c.rank == "A"
        assert c.suit == "♠"

    def test_from_str_ten(self):
        c = Card.from_str("10♥")
        assert c.rank == "10"
        assert c.suit == "♥"

    def test_from_str_joker(self):
        c = Card.from_str("JOKER♠")
        assert c.rank == JOKER
        assert c.suit == "♠"

    def test_equality(self):
        assert Card("A", "♠") == Card("A", "♠")
        assert Card("A", "♠") != Card("A", "♥")
        assert Card(JOKER, "♠") == Card(JOKER, "♠")

    def test_hash(self):
        s = {Card("A", "♠"), Card("A", "♠"), Card("A", "♥")}
        assert len(s) == 2

    def test_value_ace(self):
        assert Card("A", "♠").value() == 1

    def test_value_number(self):
        assert Card("5", "♠").value() == 5
        assert Card("10", "♠").value() == 10

    def test_value_face(self):
        assert Card("J", "♠").value() == 10
        assert Card("Q", "♠").value() == 10
        assert Card("K", "♠").value() == 10

    def test_value_joker(self):
        assert Card(JOKER, "♠").value() == 0

    def test_is_joker(self):
        assert Card(JOKER, "♠").is_joker()
        assert not Card("A", "♠").is_joker()

    def test_roundtrip_str(self):
        for suit in SUITS:
            for rank in RANKS:
                c = Card(rank, suit)
                assert Card.from_str(str(c)) == c
        for suit in JOKER_SUITS:
            c = Card(JOKER, suit)
            assert Card.from_str(str(c)) == c


class TestDeck:
    def test_deck_has_54_cards(self):
        d = Deck()
        assert len(d) == 54

    def test_deck_has_2_jokers(self):
        d = Deck()
        jokers = [c for c in d.cards if c.is_joker()]
        assert len(jokers) == 2

    def test_draw_reduces_count(self):
        d = Deck()
        d.draw()
        assert len(d) == 53

    def test_draw_returns_card(self):
        d = Deck()
        c = d.draw()
        assert isinstance(c, Card)

    def test_draw_empty_returns_none(self):
        d = Deck()
        for _ in range(54):
            d.draw()
        assert d.draw() is None

    def test_top_card(self):
        d = Deck()
        top = d.top_card()
        assert top == d.cards[-1]

    def test_restock_from_pile(self):
        d = Deck()
        # Draw all cards into a pile
        pile = []
        while d.cards:
            pile.append(d.draw())

        assert len(d) == 0
        assert len(pile) == 54

        d.restock_from_pile(pile)
        # Pile should keep only the last card (top)
        assert len(pile) == 1
        # Deck should have 53 cards (54 - 1 kept in pile)
        assert len(d) == 53

    def test_restock_preserves_pile_top(self):
        d = Deck()
        pile = []
        for _ in range(10):
            pile.append(d.draw())
        top_before = pile[-1]

        d.restock_from_pile(pile)
        assert pile[-1] == top_before
        assert len(pile) == 1

    def test_restock_noop_if_pile_too_small(self):
        d = Deck()
        pile = [d.draw()]
        d.restock_from_pile(pile)
        assert len(pile) == 1  # unchanged

    def test_serialize_deserialize(self):
        d = Deck()
        data = d.serialize()
        d2 = Deck.deserialize(data)
        assert len(d2) == len(d)
        for c1, c2 in zip(d.cards, d2.cards):
            assert c1 == c2

    def test_deserialize_skips_init(self):
        """Deserialize should not create and shuffle a full deck first."""
        data = ["A♠", "K♥"]
        d = Deck.deserialize(data)
        assert len(d) == 2
        assert d.cards[0] == Card("A", "♠")
        assert d.cards[1] == Card("K", "♥")


class TestSortHand:
    def test_jokers_first(self):
        hand = [Card("A", "♠"), Card(JOKER, "♥"), Card(JOKER, "♠")]
        sorted_h = sort_hand(hand)
        assert sorted_h[0] == Card(JOKER, "♠")
        assert sorted_h[1] == Card(JOKER, "♥")

    def test_rank_order(self):
        hand = [Card("K", "♠"), Card("A", "♠"), Card("5", "♠")]
        sorted_h = sort_hand(hand)
        assert sorted_h[0].rank == "A"
        assert sorted_h[1].rank == "5"
        assert sorted_h[2].rank == "K"

    def test_suit_order_within_rank(self):
        hand = [Card("A", "♣"), Card("A", "♠"), Card("A", "♥")]
        sorted_h = sort_hand(hand)
        assert [c.suit for c in sorted_h] == ["♠", "♥", "♣"]
