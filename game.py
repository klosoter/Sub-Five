import random

# === Constants ===
SUITS = ['♠', '♥', '♦', '♣']
RANKS = ['A'] + [str(n) for n in range(2, 11)] + ['J', 'Q', 'K']
JOKER = 'JOKER'
JOKER_SUITS = ['♠', '♥']  # Black and Red jokers

# === Rank-to-Number Mapping for Sorting ===
RANK_TO_NUM = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5,
    '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, JOKER: 14
}

# === Card Point Values ===
CARD_VALUES = {
    **{str(n): n for n in range(2, 11)},
    "A": 1, "J": 10, "Q": 10, "K": 10,
    JOKER: 0
}

# === Card Utilities ===
def card_sort_key(card):
    if card.rank == JOKER:
        return (-1, 0 if card.suit == '♠' else 1)
    rank_val = RANK_TO_NUM[card.rank]
    suit_val = SUITS.index(card.suit)
    return (rank_val, suit_val)

def sort_hand(hand):
    return sorted(hand, key=card_sort_key)

def build_game_over_notice(winners):
    if not winners:
        return ""

    if len(winners) == 1:
        name, score = winners[0]
        winner_text = f"<strong>{name}</strong> wins with {score} points!"
    else:
        lines = [f"<strong>{name}</strong> ({score} pts)" for name, score in winners]
        winner_text = "Tie! " + ", ".join(lines)

    return f"""
    <div class="mini-popup-content">
    <h2>🏆 Game Over</h2>
    <p>{winner_text}</p>
    <button class="popup-close" id="game-over-ok">OK</button>
    </div>
    """

# === Core Classes ===
class Card:
    def __init__(self, rank, suit=None):
        self.rank = rank
        self.suit = suit

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

class Deck:
    def __init__(self):
        self.cards = [Card(rank, suit) for suit in SUITS for rank in RANKS]
        self.cards += [Card(JOKER, suit) for suit in JOKER_SUITS]
        self.shuffle()

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

class Player:
    def __init__(self, name):
        self.name = name
        self.hand = []
        self.score = 0

    def draw_card(self, card):
        if card:
            self.hand.append(card)

    def play_cards(self, selected_cards):
        for card in selected_cards:
            self.hand.remove(card)
        return selected_cards

    def hand_value(self):
        return sum(card.value() for card in self.hand)

    def can_end_game(self):
        return self.hand_value() <= 100

# === Game Logic ===
class Game:
    def __init__(self, player_names):
        self.deck = Deck()
        self.players = [Player(name) for name in player_names]
        self.play_pile = []
        self.current_player_index = 0
        self.last_action = None
        self.deal_initial_hands()
        self.round_ended = False
        self.ready_players = set()
        self.last_summary_lines = []
        self.game_over = False
        self.winners = []

    @property
    def scores(self):
        return {p.name: p.score for p in self.players}

    def deal_initial_hands(self):
        for _ in range(5):
            for player in self.players:
                player.draw_card(self.draw_card())
        self.play_pile.append(self.draw_card())

    def draw_card(self):
        if not self.deck.cards:
            self.deck.restock_from_pile(self.play_pile)
        return self.deck.draw()

    def current_player(self):
        return self.players[self.current_player_index]

    def next_turn(self):
        self.current_player_index = (self.current_player_index + 1) % len(self.players)

    def play_cards(self, player, cards, chosen_top=None):
        pile_top = self.play_pile[-1] if self.play_pile else None
        for card in cards:
            player.hand.remove(card)

        if chosen_top and chosen_top in cards:
            cards.remove(chosen_top)
            self.play_pile.extend(cards)
            self.play_pile.append(chosen_top)
        else:
            self.play_pile.extend(cards)

        drawn = pile_top if chosen_top == "pile" and pile_top else self.draw_card()
        if chosen_top == "pile" and pile_top:
            self.play_pile.remove(pile_top)

        player.draw_card(drawn)

        self.last_action = {
            "player": player.name,
            "played": [str(c) for c in cards],
            "drew": str(drawn),
            "draw_source": "pile" if chosen_top == "pile" else "deck"
        }

        return cards, drawn

    def determine_winners(self):
        if all(p.score < 100 for p in self.players):
            return []
        min_score = min(p.score for p in self.players)
        return [(p.name, p.score) for p in self.players if p.score == min_score]

    def is_game_over(self):
        return any(p.score >= 100 for p in self.players)

    def end_game(self, ending_player_name):
        ending_player = next((p for p in self.players if p.name == ending_player_name), None)
        if not ending_player:
            raise ValueError("Player not found.")
        if not ending_player.can_end_game():
            raise ValueError("You may only end the round with 5 points or fewer.")

        if self.is_game_over():
            self.game_over = True
            self.winners = self.determine_winners()

        values = {p.name: p.hand_value() for p in self.players}
        ending_value = values[ending_player_name]
        lowest_value = min(values.values())

        penalty_applied = any(v <= ending_value for p, v in values.items() if p != ending_player_name)
        if penalty_applied:
            values[ending_player_name] += 15
        else:
            values[ending_player_name] = 0

        for p in self.players:
            if values[p.name] == lowest_value:
                values[p.name] = 0
                continue
            p.score += values[p.name]

        hands = {p.name: [str(c) for c in p.hand] for p in self.players}
        hand_values = values
        scores = self.scores

        lowest_players = [p.name for p in self.players if p.score == min(scores.values())]
        lowest_player = next(p for p in self.players if p.name == lowest_players[0])
        self.current_player_index = self.players.index(lowest_player)

        return hands, hand_values, scores, penalty_applied, lowest_players

    def reset_for_next_round(self):
        self.deck = Deck()
        self.play_pile = [self.deck.draw()]
        for player in self.players:
            player.hand = []
            for _ in range(5):
                player.draw_card(self.deck.draw())

        self.current_player_index = min(
            range(len(self.players)), key=lambda i: self.players[i].score)
        self.game_over = False
        self.winners = []
        self.round_ended = False
        self.ready_players = set()

    def reset_scores(self):
        for player in self.players:
            player.score = 0
        self.game_over = False
        self.winners = []
        self.reset_for_next_round()

    def is_valid_set(self, cards):
        if not cards:
            return False
        non_jokers = [card for card in cards if not card.is_joker()]
        if not non_jokers:
            return False
        first_rank = non_jers[0].rank
        return all(card.rank == first_rank for card in non_jokers)

    def is_valid_series(self, cards):
        if len(cards) < 3:
            return False
        jokers = [card for card in cards if card.is_joker()]
        non_jokers = [card for card in cards if not card.is_joker()]
        suits = {card.suit for card in non_jokers}
        if len(suits) != 1:
            return False

        base_seq = "JQKA234567890JQKA"
        seq_variants = [base_seq, base_seq[::-1]]
        cards_string = "".join(" " if card.is_joker() else ("0" if card.rank == "10" else card.rank) for card in cards).strip()

        for seq_string in seq_variants:
            valid = True
            index = 0
            for ch in cards_string:
                if index == 0:
                    index = seq_string.find(ch)
                    continue
                if ch == " ":
                    index += 1
                    continue
                if seq_string[index + 1] != ch:
                    valid = False
                    break
                index = seq_string.find(ch)
            if valid:
                return True
        return False
