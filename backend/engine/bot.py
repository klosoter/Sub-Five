"""Smart bot AI for Sub-Five.

The bot uses available information to make strategic decisions:
- Its own hand
- The current pile top
- The action log (what other players played and drew from pile)
- Card counting: tracks which cards have been seen to infer what's left
- Opponent card counts: fewer cards = likely lower hand value

Strategy priorities:
1. End the round if hand value <= 5 and likely lowest
2. Play moves that reduce hand value the most
3. Prefer series (removes more cards) over sets
4. Draw from pile when the top card is useful (completes a set/series)
5. Avoid leaving high-value cards on pile that help opponents
6. Factor in opponent card counts when deciding to end the round
"""
from itertools import combinations
from .card import Card, JOKER, SUITS, RANKS, JOKER_SUITS, CARD_VALUES
from .validation import is_valid_set, is_valid_series
from .player import Player


class CardTracker:
    """Tracks cards that have been seen during the game.

    Builds a picture of what's in play, what's been discarded,
    and what opponents might be holding.
    """

    def __init__(self):
        # All cards in the game
        self.all_cards = set()
        for suit in SUITS:
            for rank in RANKS:
                self.all_cards.add(f"{rank}{suit}")
        for suit in JOKER_SUITS:
            self.all_cards.add(f"{JOKER}{suit}")

        # Cards we've seen (played to pile, drawn from pile by others, in our hand)
        self.seen_cards: set[str] = set()
        # Cards opponents drew from pile (we know what they have)
        self.opponent_known_cards: dict[str, set[str]] = {}
        # Count of pile draws per player (strategic interest tracking)
        self.pile_draws: dict[str, int] = {}
        # Opponent card counts (updated each time we get game state)
        self.opponent_card_counts: dict[str, int] = {}

    def observe_action(self, action: dict):
        """Process an action from the log."""
        player = action.get("player", "")

        # Cards played are now in the pile / seen
        for card_str in action.get("played", []):
            self.seen_cards.add(card_str)

        # If they drew from pile, we know what card they got
        if action.get("draw_source") == "pile" and action.get("drawn_card"):
            drawn = action["drawn_card"]
            self.seen_cards.add(drawn)
            if player not in self.opponent_known_cards:
                self.opponent_known_cards[player] = set()
            self.opponent_known_cards[player].add(drawn)
            self.pile_draws[player] = self.pile_draws.get(player, 0) + 1

    def observe_hand(self, hand: list[Card]):
        """Mark our own hand cards as seen."""
        for card in hand:
            self.seen_cards.add(str(card))

    def update_opponent_counts(self, counts: dict[str, int]):
        """Update how many cards each opponent holds."""
        self.opponent_card_counts.update(counts)

    def unseen_cards(self) -> set[str]:
        """Cards we haven't seen — could be in deck or opponent hands."""
        return self.all_cards - self.seen_cards

    def opponent_might_want(self, card_str: str) -> bool:
        """Heuristic: might an opponent want this card?

        If an opponent drew from pile recently, they're building something.
        Check if the card we'd leave on top is in a rank/suit they seem to collect.
        """
        card = Card.from_str(card_str)
        for player, known in self.opponent_known_cards.items():
            for known_str in known:
                known_card = Card.from_str(known_str)
                # Same rank = they might be collecting sets
                if known_card.rank == card.rank:
                    return True
                # Same suit and adjacent = they might be collecting series
                if known_card.suit == card.suit and not card.is_joker():
                    from .card import RANK_TO_NUM
                    if known_card.rank in RANK_TO_NUM and card.rank in RANK_TO_NUM:
                        diff = abs(RANK_TO_NUM[known_card.rank] - RANK_TO_NUM[card.rank])
                        if diff <= 2:
                            return True
        return False


class BotStrategy:
    """Decision engine for bot players."""

    def __init__(self):
        self.tracker = CardTracker()

    def observe_action(self, action: dict):
        """Feed an action from the game log to the card tracker."""
        self.tracker.observe_action(action)

    def choose_action(self, player: Player, pile_top: Card | None, deck_count: int,
                       opponent_card_counts: dict[str, int] | None = None):
        """Decide what to play and where to draw from.

        Args:
            player: The bot's Player object
            pile_top: Current top card of the pile (or None)
            deck_count: Number of cards remaining in the deck
            opponent_card_counts: {name: card_count} for each opponent

        Returns: (cards_to_play: list[Card], draw_source: str, should_end_round: bool)
        """
        hand = list(player.hand)
        self.tracker.observe_hand(hand)
        if opponent_card_counts:
            self.tracker.update_opponent_counts(opponent_card_counts)

        # Check if we should end the round
        if player.can_end_round():
            if self._should_end_round(player):
                return [], "deck", True

        # Find all valid plays
        plays = self._find_all_plays(hand)
        if not plays:
            # Shouldn't happen (can always play 1 card as a set), but fallback
            return [hand[0]], "deck", False

        # Score each play, considering pile top for draw strategy
        best_play = max(plays, key=lambda p: self._score_play(p, hand, pile_top))

        # Decide draw source
        draw_source = self._choose_draw_source(hand, best_play, pile_top)

        # If pile has a card matching something in our hand but we're about to
        # play that matching card away, consider playing something else instead
        # so we can take from pile and have a pair for next turn.
        # BUT don't do this if opponents are close to winning (few cards).
        opp_counts = self.tracker.opponent_card_counts
        min_opp_cards = min(opp_counts.values()) if opp_counts else 5
        if pile_top and draw_source == "deck" and not pile_top.is_joker() and min_opp_cards > 2:
            matching_in_hand = [c for c in hand if c.rank == pile_top.rank]
            if matching_in_hand and any(c in best_play for c in matching_in_hand):
                # Try plays that keep the matching card in hand
                alt_plays = [p for p in plays if not any(c in p for c in matching_in_hand)]
                if alt_plays:
                    alt_best = max(alt_plays, key=lambda p: self._score_play(p, hand, pile_top))
                    alt_draw = self._choose_draw_source(hand, alt_best, pile_top)
                    if alt_draw == "pile":
                        # Taking pile card + keeping match = pair next turn (play 2 cards)
                        best_play = alt_best
                        draw_source = alt_draw

        # Optimize series card order: last card ends up on pile top.
        # Never put joker on top. Prefer high-value card on top (less useful to opponents).
        if len(best_play) >= 3:
            best_play = self._order_series(best_play)

        return best_play, draw_source, False

    def _should_end_round(self, player: Player) -> bool:
        """Should we end the round? Only if we're likely to have the lowest hand.

        Uses opponent card counts as a signal: fewer cards generally means
        a lower hand value. If an opponent has very few cards, they might
        end the round themselves — or have a low value we can't beat.
        """
        hv = player.hand_value()
        if hv == 0:
            return True  # Can't lose with 0
        if hv <= 2:
            return True  # Very unlikely anyone is lower

        # Check if any opponent has dangerously few cards
        opp_counts = self.tracker.opponent_card_counts
        min_opp_cards = min(opp_counts.values()) if opp_counts else 5
        # An opponent with 1-2 cards is very threatening (likely low value)
        opponent_threatening = min_opp_cards <= 2

        if hv <= 5:
            if hv <= 3:
                # At 3, end unless an opponent has even fewer cards
                if not opponent_threatening:
                    return True
                # Even with a threatening opponent, 0-1 is safe enough
                if hv <= 1:
                    return True
            # At 4-5, factor in both unseen low cards and opponent card counts
            unseen = self.tracker.unseen_cards()
            low_unseen = sum(1 for c in unseen if Card.from_str(c).value() <= 2)
            if low_unseen <= 3 and not opponent_threatening:
                return True
            # If we have 4-5 but opponents all have 4+ cards, they likely have higher values
            if min_opp_cards >= 4 and hv <= 4:
                return True
        return False

    def _find_all_plays(self, hand: list[Card]) -> list[list[Card]]:
        """Find all valid plays from the hand."""
        plays: list[list[Card]] = []

        # Single cards (always valid as a set of 1)
        for card in hand:
            plays.append([card])

        # Pairs, triples, quads (sets) — never waste jokers in sets (0 pts, save for series)
        non_jokers = [c for c in hand if not c.is_joker()]
        for size in range(2, len(non_jokers) + 1):
            for combo in combinations(non_jokers, size):
                cards = list(combo)
                if is_valid_set(cards):
                    plays.append(cards)

        # Series (3+ same suit sequential)
        for size in range(3, len(hand) + 1):
            for combo in combinations(hand, size):
                cards = list(combo)
                if is_valid_series(cards):
                    plays.append(cards)
                # Also check reverse order
                rev = list(reversed(cards))
                if is_valid_series(rev) and rev != cards:
                    plays.append(rev)

        return plays

    def _score_play(self, play: list[Card], hand: list[Card], pile_top: Card | None) -> float:
        """Score a play. Higher is better.

        Priorities (in order):
        1. Remove as many cards as possible (fewer cards = closer to ending round)
        2. Remove high-value cards (lower remaining hand value)
        3. Keep low-value cards (A, 2 — help end round with value <= 5)
        4. Don't help opponents with what we leave on pile
        """
        points_removed = sum(c.value() for c in play)
        cards_removed = len(play)

        # Primary: removing more cards is most important
        score = cards_removed * 25

        # Secondary: prefer removing high-value cards
        score += points_removed * 5

        # Bonus for multi-card plays (series/sets remove multiple cards at once)
        if cards_removed >= 3:
            score += 20
        elif cards_removed >= 2:
            score += 10

        # Penalty if the card we leave on top might help an opponent
        top_card = play[-1]
        if self.tracker.opponent_might_want(str(top_card)):
            score -= 8

        # Penalty for leaving low-value cards on pile when opponents have few cards
        # (they could pick it up and end the round)
        opp_counts = self.tracker.opponent_card_counts
        if opp_counts:
            min_opp = min(opp_counts.values())
            if min_opp <= 2 and top_card.value() <= 3:
                score -= 20

        return score

    def _order_series(self, play: list[Card]) -> list[Card]:
        """Reorder a series so highest value ends up on pile top (last position).

        Jokers go first, then ascending by value. Last card = pile top = highest.
        Both forward and reverse are valid series orders, so just pick the
        direction that puts the highest value on top.
        """
        from .validation import is_valid_series

        # Sort: jokers first, then by value ascending → highest on top
        jokers = [c for c in play if c.is_joker()]
        non_jokers = sorted([c for c in play if not c.is_joker()], key=lambda c: c.value())
        ordered = jokers + non_jokers

        # Check if this order is a valid series
        if is_valid_series(ordered):
            return ordered

        # Try reverse
        rev = list(reversed(ordered))
        if is_valid_series(rev):
            return rev

        # Fallback: return original play order
        return play

    def _choose_draw_source(self, hand: list[Card], play: list[Card], pile_top: Card | None) -> str:
        """Decide whether to draw from deck or pile.

        Only draw from pile when it's clearly useful:
        - Jokers (free wildcard)
        - Very low cards (A, 2 — always good to have)
        - Creates a pair/set with remaining hand (playable next turn)
        - Completes a series with remaining hand

        Otherwise draw from deck — the unknown is often better than a mediocre known card.
        """
        if pile_top is None:
            return "deck"

        remaining = [c for c in hand if c not in play]

        # Always take jokers (0 points, wildcard utility)
        if pile_top.is_joker():
            return "pile"

        # Take very low cards (A=1, 2=2) — always good to hold
        if pile_top.value() <= 2:
            return "pile"

        # Take if it creates a pair/set with remaining hand (playable next turn)
        matching_rank = sum(1 for c in remaining if c.rank == pile_top.rank)
        if matching_rank >= 1:
            return "pile"

        # Take if it could complete a series (need 2+ same-suit cards in remaining)
        if not pile_top.is_joker():
            same_suit = [c for c in remaining if c.suit == pile_top.suit and not c.is_joker()]
            if len(same_suit) >= 2:
                # Check if the pile card is actually adjacent to form a sequence
                from .card import RANK_TO_NUM
                if pile_top.rank in RANK_TO_NUM:
                    pile_num = RANK_TO_NUM[pile_top.rank]
                    suit_nums = sorted(RANK_TO_NUM[c.rank] for c in same_suit if c.rank in RANK_TO_NUM)
                    # Check if pile card fits into or extends a sequence
                    for num in suit_nums:
                        if abs(pile_num - num) <= 2:
                            return "pile"

        return "deck"


def create_bot_strategy() -> BotStrategy:
    """Create a new bot strategy instance."""
    return BotStrategy()
