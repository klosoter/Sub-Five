import pytest
from backend.engine.card import Card, Deck, JOKER
from backend.engine.player import Player
from backend.engine.game import Game, InvalidMoveError


class TestGameInit:
    def test_creates_players(self):
        g = Game(["Alice", "Bob"])
        assert len(g.players) == 2
        assert g.players[0].name == "Alice"

    def test_deals_five_cards_each(self):
        g = Game(["Alice", "Bob"])
        for p in g.players:
            assert len(p.hand) == 5

    def test_pile_has_one_card(self):
        g = Game(["Alice", "Bob"])
        assert len(g.play_pile) == 1

    def test_deck_count_after_deal(self):
        g = Game(["Alice", "Bob"])
        # 54 - (5*2 players) - 1 pile = 43
        assert len(g.deck) == 43

    def test_three_player_deal(self):
        g = Game(["A", "B", "C"])
        # 54 - 15 - 1 = 38
        assert len(g.deck) == 38

    def test_starts_not_ended(self):
        g = Game(["Alice", "Bob"])
        assert not g.round_ended
        assert not g.game_over


class TestSerializeDeserialize:
    def test_roundtrip(self):
        g = Game(["Alice", "Bob"])
        data = g.serialize()
        g2 = Game.deserialize(data)

        assert len(g2.players) == 2
        assert g2.players[0].name == "Alice"
        assert len(g2.players[0].hand) == 5
        assert len(g2.play_pile) == len(g.play_pile)
        assert g2.current_player_index == g.current_player_index
        assert g2.round_ended == g.round_ended

    def test_deserialize_preserves_scores(self):
        g = Game(["Alice", "Bob"])
        g.players[0].score = 42
        data = g.serialize()
        g2 = Game.deserialize(data)
        assert g2.players[0].score == 42

    def test_deserialize_does_not_waste_deck(self):
        """Deserialize should not create a full deck then overwrite it."""
        data = {
            "players": [{"name": "A", "hand": ["A♠"], "score": 0}],
            "deck": ["K♥", "Q♦"],
            "play_pile": ["3♠"],
            "current_player_index": 0,
            "last_action": None,
            "round_ended": False,
            "ready_players": [],
            "game_over": False,
            "winners": [],
        }
        g = Game.deserialize(data)
        assert len(g.deck) == 2
        assert len(g.players[0].hand) == 1


class TestPlayCards:
    def _setup_game(self):
        """Create a controlled game where Alice has known cards."""
        g = Game(["Alice", "Bob"])
        # Give Alice a known hand
        g.players[0].hand = [
            Card("K", "♠"), Card("K", "♥"), Card("5", "♠"),
            Card("6", "♠"), Card("7", "♠"),
        ]
        return g

    def test_play_valid_set(self):
        g = self._setup_game()
        action = g.play_cards("Alice", [Card("K", "♠"), Card("K", "♥")])
        assert action["player"] == "Alice"
        assert len(action["played"]) == 2
        # Alice should still have 5 cards (played 2, drew 1) = 4... wait
        # Actually: played 2, drew 1 = 5 - 2 + 1 = 4
        assert len(g.players[0].hand) == 4

    def test_play_valid_series(self):
        g = self._setup_game()
        action = g.play_cards("Alice", [Card("5", "♠"), Card("6", "♠"), Card("7", "♠")])
        assert len(action["played"]) == 3
        assert len(g.players[0].hand) == 3  # 5 - 3 + 1 = 3

    def test_play_advances_turn(self):
        g = self._setup_game()
        assert g.current_player().name == "Alice"
        g.play_cards("Alice", [Card("K", "♠")])
        assert g.current_player().name == "Bob"

    def test_play_invalid_combination_rejected(self):
        g = self._setup_game()
        with pytest.raises(InvalidMoveError, match="Invalid card combination"):
            g.play_cards("Alice", [Card("K", "♠"), Card("5", "♠")])

    def test_play_card_not_in_hand_rejected(self):
        g = self._setup_game()
        with pytest.raises(InvalidMoveError, match="not in hand"):
            g.play_cards("Alice", [Card("A", "♦")])

    def test_play_wrong_turn_rejected(self):
        g = self._setup_game()
        with pytest.raises(InvalidMoveError, match="not your turn"):
            g.play_cards("Bob", [Card("K", "♠")])

    def test_play_does_not_mutate_on_invalid(self):
        """Validation failure must not change game state."""
        g = self._setup_game()
        hand_before = list(g.players[0].hand)
        pile_before = list(g.play_pile)
        turn_before = g.current_player_index

        with pytest.raises(InvalidMoveError):
            g.play_cards("Alice", [Card("K", "♠"), Card("5", "♠")])

        assert g.players[0].hand == hand_before
        assert g.play_pile == pile_before
        assert g.current_player_index == turn_before

    def test_draw_from_deck(self):
        g = self._setup_game()
        deck_count_before = len(g.deck)
        g.play_cards("Alice", [Card("K", "♠")], draw_source="deck")
        assert len(g.deck) == deck_count_before - 1

    def test_draw_from_pile(self):
        """Drawing from pile takes the OLD pile top, not the just-played card."""
        g = self._setup_game()
        old_pile_top = g.play_pile[-1]
        g.play_cards("Alice", [Card("K", "♠")], draw_source="pile")
        # Alice should have drawn the old pile top
        assert old_pile_top in g.players[0].hand


class TestEndRound:
    def _setup_low_hand(self):
        g = Game(["Alice", "Bob"])
        g.players[0].hand = [Card("A", "♠"), Card("2", "♠")]  # value=3
        g.players[1].hand = [Card("K", "♠"), Card("Q", "♠")]  # value=20
        return g

    def test_end_round_succeeds(self):
        g = self._setup_low_hand()
        result = g.end_round("Alice")
        assert g.round_ended
        assert result.ender_name == "Alice"

    def test_end_round_scores_correctly(self):
        g = self._setup_low_hand()
        result = g.end_round("Alice")
        assert result.round_points["Alice"] == 0  # lowest
        assert result.round_points["Bob"] == 20

    def test_end_round_rejects_high_hand(self):
        g = Game(["Alice", "Bob"])
        g.players[0].hand = [Card("K", "♠"), Card("Q", "♠")]  # value=20
        with pytest.raises(InvalidMoveError, match="5 points or fewer"):
            g.end_round("Alice")

    def test_game_over_detection(self):
        g = Game(["Alice", "Bob"])
        g.players[0].hand = [Card("A", "♠")]  # value=1
        g.players[1].hand = [Card("K", "♠")]  # value=10
        g.players[1].score = 95  # Will push to 105
        result = g.end_round("Alice")
        assert g.game_over
        assert len(g.winners) > 0


class TestReadyAndNextRound:
    def test_mark_ready_toggles(self):
        g = Game(["Alice", "Bob"])
        is_ready, all_ready = g.mark_ready("Alice")
        assert is_ready
        assert not all_ready

        is_ready, all_ready = g.mark_ready("Alice")
        assert not is_ready

    def test_all_ready(self):
        g = Game(["Alice", "Bob"])
        g.mark_ready("Alice")
        _, all_ready = g.mark_ready("Bob")
        assert all_ready

    def test_start_next_round(self):
        g = Game(["Alice", "Bob"])
        # End a round
        g.players[0].hand = [Card("A", "♠")]
        g.players[1].hand = [Card("K", "♠")]
        g.end_round("Alice")
        assert g.round_ended

        g.start_next_round()
        assert not g.round_ended
        assert not g.game_over
        assert g.last_action is None
        for p in g.players:
            assert len(p.hand) == 5

    def test_next_round_after_game_over_resets_scores(self):
        g = Game(["Alice", "Bob"])
        g.players[0].hand = [Card("A", "♠")]
        g.players[1].hand = [Card("K", "♠")]
        g.players[1].score = 95
        g.end_round("Alice")
        assert g.game_over

        g.start_next_round()
        assert not g.game_over
        for p in g.players:
            assert p.score == 0


class TestGetStateForPlayer:
    def test_own_hand_visible(self):
        g = Game(["Alice", "Bob"])
        state = g.get_state_for_player("Alice")
        alice_data = next(p for p in state["players"] if p["name"] == "Alice")
        assert isinstance(alice_data["hand"], list)
        assert isinstance(alice_data["hand"][0], str)

    def test_opponent_hand_hidden(self):
        g = Game(["Alice", "Bob"])
        state = g.get_state_for_player("Alice")
        bob_data = next(p for p in state["players"] if p["name"] == "Bob")
        assert isinstance(bob_data["hand"], int)  # count only
        assert bob_data["hand"] == 5

    def test_includes_scores(self):
        g = Game(["Alice", "Bob"])
        g.players[0].score = 15
        state = g.get_state_for_player("Alice")
        assert state["scores"]["Alice"] == 15

    def test_drawn_card_hidden_from_others_on_deck_draw(self):
        g = Game(["Alice", "Bob"])
        g.players[0].hand = [Card("K", "♠"), Card("K", "♥"), Card("5", "♠"), Card("6", "♠"), Card("7", "♠")]
        g.play_cards("Alice", [Card("K", "♠")], draw_source="deck")

        # Alice sees what she drew
        alice_state = g.get_state_for_player("Alice")
        assert alice_state["lastAction"]["drawn_card"] is not None

        # Bob does not see Alice's deck draw
        bob_state = g.get_state_for_player("Bob")
        assert bob_state["lastAction"]["drawn_card"] is None

    def test_drawn_card_visible_on_pile_draw(self):
        g = Game(["Alice", "Bob"])
        g.players[0].hand = [Card("K", "♠"), Card("K", "♥"), Card("5", "♠"), Card("6", "♠"), Card("7", "♠")]
        g.play_cards("Alice", [Card("K", "♠")], draw_source="pile")

        # Everyone sees pile draws
        bob_state = g.get_state_for_player("Bob")
        assert bob_state["lastAction"]["drawn_card"] is not None
