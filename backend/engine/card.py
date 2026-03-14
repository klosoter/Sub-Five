import random

# === Constants ===
SUITS = ['♠', '♥', '♦', '♣']
RANKS = ['A'] + [str(n) for n in range(2, 11)] + ['J', 'Q', 'K']
JOKER = 'JOKER'
JOKER_SUITS = ['♠', '♥']  # Black and Red jokers

RANK_TO_NUM = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, JOKER: 14
}

CARD_VALUES = {
    **{str(n): n for n in range(2, 11)},
    "A": 1, "J": 10, "Q": 10, "K": 10,
    JOKER: 0
}


# === Card Class ===
class Card:
    __slots__ = ('rank', 'suit')

    def __init__(self, rank, suit=None):
        self.rank = rank
        self.suit = suit

    @classmethod
    def from_str(cls, s):
        if s.startswith("JOKER") and len(s) == 7:
            return cls(JOKER, s[-1])
        return cls(s[:-1], s[-1])

    def __str__(self):
        return f"{self.rank}{self.suit}" if self.rank != JOKER else f"{JOKER}{self.suit}"

    def __repr__(self):
        return str(self)

    def __eq__(self, other):
        return isinstance(other, Card) and self.rank == other.rank and self.suit == other.suit

    def __hash__(self):
        return hash((self.rank, self.suit))

    def value(self):
        return CARD_VALUES[self.rank]

    def is_joker(self):
        return self.rank == JOKER


# === Sorting ===
def card_sort_key(card):
    if card.rank == JOKER:
        return (-1, 0 if card.suit == '♠' else 1)
    rank_val = RANK_TO_NUM[card.rank]
    suit_val = SUITS.index(card.suit)
    return (rank_val, suit_val)


def sort_hand(hand):
    return sorted(hand, key=card_sort_key)


# === Deck Class ===
class Deck:
    def __init__(self):
        self.cards = [Card(rank, suit) for suit in SUITS for rank in RANKS]
        self.cards += [Card(JOKER, suit) for suit in JOKER_SUITS]
        self.shuffle()

    def serialize(self):
        return [str(c) for c in self.cards]

    @classmethod
    def deserialize(cls, data):
        d = object.__new__(cls)
        d.cards = [Card.from_str(s) for s in data]
        return d

    def shuffle(self):
        random.shuffle(self.cards)

    def draw(self):
        return self.cards.pop() if self.cards else None

    def top_card(self):
        return self.cards[-1] if self.cards else None

    def restock_from_pile(self, pile):
        if len(pile) <= 1:
            return
        top = pile.pop()
        self.cards = pile[:]
        self.shuffle()
        pile.clear()
        pile.append(top)

    def __len__(self):
        return len(self.cards)
