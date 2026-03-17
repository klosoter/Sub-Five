"""Game state machine for Sub-Five.

The Game class manages the full lifecycle: dealing, turns, rounds, game end.
It delegates validation to validation.py and scoring to scoring.py.
It never generates HTML — it returns pure data.
"""
from .card import Card, Deck, sort_hand
from .player import Player
from .validation import is_valid_play
from .scoring import calculate_round_scores, determine_winners, is_game_over


class InvalidMoveError(Exception):
    pass


class Game:
    def __init__(self, player_names):
        self.deck = Deck()
        self.players = [Player(name) for name in player_names]
        self.play_pile = []
        self.current_player_index = 0
        self.last_action = None
        self.round_ended = False
        self.ready_players = set()
        self.game_over = False
        self.winners = []
        self.last_round_data = None  # Stored so refresh during round-end works
        self.round_number = 1
        self.deal_initial_hands()

    def serialize(self):
        return {
            "players": [p.serialize() for p in self.players],
            "deck": self.deck.serialize(),
            "play_pile": [str(c) for c in self.play_pile],
            "current_player_index": self.current_player_index,
            "last_action": self.last_action,
            "round_ended": self.round_ended,
            "ready_players": list(self.ready_players),
            "game_over": self.game_over,
            "winners": self.winners,
            "last_round_data": self.last_round_data,
            "round_number": self.round_number,
        }

    @classmethod
    def deserialize(cls, data):
        game = object.__new__(cls)
        game.players = [Player.deserialize(pd) for pd in data["players"]]
        game.deck = Deck.deserialize(data["deck"])
        game.play_pile = [Card.from_str(s) for s in data["play_pile"]]
        game.current_player_index = data["current_player_index"]
        game.last_action = data["last_action"]
        game.round_ended = data["round_ended"]
        game.ready_players = set(data["ready_players"])
        game.game_over = data["game_over"]
        game.winners = data["winners"]
        game.last_round_data = data.get("last_round_data")
        game.round_number = data.get("round_number", 1)
        return game

    @property
    def scores(self):
        return {p.name: p.score for p in self.players}

    def deal_initial_hands(self):
        for _ in range(5):
            for player in self.players:
                player.draw_card(self._draw_card())
        self.play_pile.append(self._draw_card())

    def _draw_card(self):
        """Draw from deck, restocking from pile if empty."""
        if not self.deck.cards:
            self.deck.restock_from_pile(self.play_pile)
        return self.deck.draw()

    def current_player(self):
        return self.players[self.current_player_index]

    def next_turn(self):
        self.current_player_index = (self.current_player_index + 1) % len(self.players)

    def play_cards(self, player_name, cards, draw_source="deck"):
        """Execute a play: validate, remove cards, add to pile, draw replacement.

        Args:
            player_name: Name of the player making the move
            cards: List of Card objects to play
            draw_source: "deck" or "pile"

        Returns:
            dict with played cards and drawn card info

        Raises:
            InvalidMoveError: If the play is not valid
        """
        player = self._get_player(player_name)

        if player.name != self.current_player().name:
            raise InvalidMoveError("It's not your turn.")

        if self.round_ended:
            raise InvalidMoveError("Round has ended.")

        if not cards:
            raise InvalidMoveError("Must play at least one card.")

        # Validate BEFORE mutating state
        if not is_valid_play(cards):
            raise InvalidMoveError("Invalid card combination.")

        # Verify player actually has these cards
        hand_copy = list(player.hand)
        for card in cards:
            if card not in hand_copy:
                raise InvalidMoveError(f"Card {card} not in hand.")
            hand_copy.remove(card)

        # Save old pile top before playing (for pile draw)
        old_pile_top = self.play_pile[-1] if self.play_pile else None

        # Remove cards from hand and add to pile
        player.remove_cards(cards)
        self.play_pile.extend(cards)

        # Draw replacement card
        if draw_source == "pile" and old_pile_top:
            drawn = old_pile_top
            self.play_pile.remove(old_pile_top)
        else:
            drawn = self._draw_card()

        player.draw_card(drawn)

        # Record action
        self.last_action = {
            "player": player.name,
            "played": [str(c) for c in cards],
            "drawn_card": str(drawn),
            "draw_source": draw_source,
        }

        self.next_turn()
        return self.last_action

    def end_round(self, player_name):
        """End the current round. Returns a RoundResult.

        Raises:
            InvalidMoveError: If player can't end the round
        """
        player = self._get_player(player_name)

        if not player.can_end_round():
            raise InvalidMoveError("You may only end the round with 5 points or fewer.")

        result = calculate_round_scores(self.players, player_name)
        self.round_ended = True
        self.ready_players = set()

        # Store round data for refresh recovery
        self.last_round_data = {
            "ender": result.ender_name,
            "hands": result.hands,
            "hand_values": result.hand_values,
            "round_points": result.round_points,
            "total_scores": result.total_scores,
            "penalty_applied": result.penalty_applied,
        }

        # Set next round starter to the round winner (whoever scored 0 points)
        zero_scorers = [p for p in self.players if result.round_points[p.name] == 0]
        if zero_scorers:
            self.current_player_index = self.players.index(zero_scorers[0])
        # else: keep current index (shouldn't happen with normal rules)

        # Check game over
        if is_game_over(self.players):
            self.game_over = True
            self.winners = determine_winners(self.players)

        return result

    def mark_ready(self, player_name):
        """Toggle a player's ready state for next round. Returns (is_ready, all_ready)."""
        if player_name in self.ready_players:
            self.ready_players.remove(player_name)
            is_ready = False
        else:
            self.ready_players.add(player_name)
            is_ready = True

        all_ready = set(p.name for p in self.players) == self.ready_players
        return is_ready, all_ready

    def start_next_round(self):
        """Reset for a new round. If game was over, reset scores too."""
        if self.game_over:
            self._reset_scores()

        self.deck = Deck()
        self.play_pile = [self.deck.draw()]
        for player in self.players:
            player.hand = []
            for _ in range(5):
                player.draw_card(self.deck.draw())

        self.round_ended = False
        self.ready_players = set()
        self.game_over = False
        self.winners = []
        self.last_action = None
        self.last_round_data = None
        self.round_number += 1

    def get_state_for_player(self, player_name):
        """Return game state personalized for a specific player.

        The player sees their own hand; opponents show only card count.
        """
        players_data = []
        for p in self.players:
            if p.name == player_name:
                players_data.append({
                    "name": p.name,
                    "hand": [str(c) for c in sort_hand(p.hand)],
                    "hand_value": p.hand_value(),
                    "score": p.score,
                })
            else:
                players_data.append({
                    "name": p.name,
                    "hand": len(p.hand),
                    "hand_value": None,
                    "score": p.score,
                })

        # Personalize last_action: hide drawn card from other players unless pile draw
        last_action = None
        if self.last_action:
            drawn_card = self.last_action["drawn_card"]
            draw_source = self.last_action["draw_source"]
            visible_drawn = (
                drawn_card
                if draw_source == "pile" or self.last_action["player"] == player_name
                else None
            )
            last_action = {
                "player": self.last_action["player"],
                "played": self.last_action["played"],
                "drawn_card": visible_drawn,
                "draw_source": draw_source,
            }

        state = {
            "players": players_data,
            "pileTop": str(self.play_pile[-1]) if self.play_pile else "",
            "deckCount": len(self.deck),
            "currentPlayer": self.current_player().name,
            "lastAction": last_action,
            "scores": self.scores,
            "roundEnded": self.round_ended,
            "readyPlayers": list(self.ready_players),
            "gameOver": self.game_over,
            "winners": self.winners,
        }

        # Include round data when round has ended (needed for refresh recovery)
        if self.round_ended and self.last_round_data:
            state["roundData"] = {
                **self.last_round_data,
                "game_over": self.game_over,
                "winners": self.winners,
            }

        return state

    def _get_player(self, name):
        player = next((p for p in self.players if p.name == name), None)
        if not player:
            raise InvalidMoveError(f"Player '{name}' not found.")
        return player

    def _reset_scores(self):
        for player in self.players:
            player.score = 0
