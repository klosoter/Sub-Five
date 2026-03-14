"""Pure validation functions for card plays.

These are stateless — they take a list of Card objects and return bool.
"""


def is_valid_set(cards):
    """Check if cards form a valid set (1+ cards of same rank, jokers wild)."""
    if not cards:
        return False
    non_jokers = [c for c in cards if not c.is_joker()]
    if not non_jokers:
        return False
    first_rank = non_jokers[0].rank
    return all(c.rank == first_rank for c in non_jokers)


def is_valid_series(cards):
    """Check if cards form a valid series (3+ same-suit sequential, jokers wild).

    The sequence wraps around: K-A-2 is valid.
    Reverse order is valid: 2-A-K (player chooses pile top).
    Jokers fill gaps as wildcards.

    Algorithm: The base sequence "JQKA234567890JQKA" (where 0 = 10) is
    duplicated at both ends to handle wraparound. We check if the cards
    match a contiguous subsequence in either forward or reverse direction.
    """
    if len(cards) < 3:
        return False

    non_jokers = [c for c in cards if not c.is_joker()]
    if not non_jokers:
        return False

    # All non-joker cards must share the same suit
    suits = {c.suit for c in non_jokers}
    if len(suits) != 1:
        return False

    # Build a character representation: jokers become spaces, 10 becomes "0"
    base_seq = "JQKA234567890JQKA"
    seq_variants = [base_seq, base_seq[::-1]]

    cards_string = "".join(
        " " if c.is_joker() else ("0" if c.rank == "10" else c.rank)
        for c in cards
    ).strip()

    for seq_string in seq_variants:
        valid = True
        index = None
        for ch in cards_string:
            if index is None:
                index = seq_string.find(ch)
                if index == -1:
                    valid = False
                    break
                continue
            if ch == " ":
                index += 1
                continue
            if index + 1 >= len(seq_string) or seq_string[index + 1] != ch:
                valid = False
                break
            index = seq_string.find(ch)
        if valid:
            return True

    return False


def is_valid_play(cards):
    """Check if a set of cards constitutes a valid play (set or series)."""
    return is_valid_set(cards) or is_valid_series(cards)
