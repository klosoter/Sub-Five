from .card import Card, sort_hand


class Player:
    def __init__(self, name):
        self.name = name
        self.hand = []
        self.score = 0

    def serialize(self):
        return {
            "name": self.name,
            "hand": [str(c) for c in self.hand],
            "score": self.score
        }

    @classmethod
    def deserialize(cls, data):
        p = object.__new__(cls)
        p.name = data["name"]
        p.hand = [Card.from_str(s) for s in data["hand"]]
        p.score = data.get("score", 0)
        return p

    def draw_card(self, card):
        if card:
            self.hand.append(card)

    def remove_cards(self, cards):
        for card in cards:
            self.hand.remove(card)

    def hand_value(self):
        return sum(card.value() for card in self.hand)

    def can_end_round(self):
        return self.hand_value() <= 5

    def sorted_hand(self):
        return sort_hand(self.hand)
