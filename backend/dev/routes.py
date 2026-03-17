"""Dev-only routes for testing without multiple browsers."""
import os
import uuid
from flask import Blueprint, request, jsonify, session
from ..rooms import manager
from ..engine.game import Game
from ..engine.card import sort_hand
from ..engine.bot import BotStrategy

dev_bp = Blueprint("dev", __name__, url_prefix="/api/dev")

# Store bot strategies per room (keyed by room code)
# Values can be BotStrategy or RLBotStrategy
_bot_strategies: dict[str, dict[str, object]] = {}

# Default RL model path
_RL_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "models", "subfive_rl.pt")
_RL_IMITATE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "models", "subfive_imitate.pt")


def _get_rl_model_path() -> str | None:
    """Return path to best available RL model, or None."""
    for p in [_RL_MODEL_PATH, _RL_IMITATE_PATH]:
        if os.path.exists(p):
            return p
    return None


def _make_bot_strategy(bot_type: str = "heuristic"):
    """Create a bot strategy instance. 'mixed' randomly picks rl or heuristic."""
    if bot_type == "mixed":
        import random
        bot_type = random.choice(["rl", "heuristic"])
    if bot_type == "rl":
        model_path = _get_rl_model_path()
        if model_path:
            from ..engine.rl.agent import RLBotStrategy
            return RLBotStrategy(model_path)
    return BotStrategy()


def _get_bot_strategy(room_code: str, bot_name: str, bot_type: str = "heuristic"):
    if room_code not in _bot_strategies:
        _bot_strategies[room_code] = {}
    if bot_name not in _bot_strategies[room_code]:
        _bot_strategies[room_code][bot_name] = _make_bot_strategy(bot_type)
    return _bot_strategies[room_code][bot_name]


@dev_bp.route("/quick-game", methods=["POST"])
def quick_game():
    """Create a room with bots and start immediately.

    JSON body:
        bots: number of bot players (default 2)
        name: human player name (default "Dev")
    """
    data = request.get_json(silent=True) or {}
    bot_count = min(data.get("bots", 2), 3)  # max 3 bots (4 player game)
    player_name = data.get("name", "Dev")
    bot_type = data.get("bot_type", "heuristic")

    code = str(uuid.uuid4())[:6].upper()
    players = [player_name]
    bot_names = []
    for i in range(bot_count):
        if bot_type == "mixed":
            import random
            t = random.choice(["rl", "heuristic"])
            prefix = "RL" if t == "rl" else "Bot"
        elif bot_type == "rl":
            prefix = "RL"
        else:
            prefix = "Bot"
        bot_name = f"{prefix}-{i + 1}"
        players.append(bot_name)
        bot_names.append(bot_name)

    game = Game(players)
    room_data = {
        "code": code,
        "host": player_name,
        "password": None,
        "max_players": len(players),
        "turn_timer": 0,
        "players": players,
        "ready": {p: True for p in players},
        "game": game.serialize(),
        "started": True,
        "bots": bot_names,
        "bot_type": bot_type,
    }
    manager.save_room(code, room_data)

    session["room"] = code
    session["player_name"] = player_name

    # Initialize bot strategies (infer type from name for mixed)
    for bot_name in bot_names:
        t = "rl" if bot_name.startswith("RL-") else "heuristic"
        _get_bot_strategy(code, bot_name, t)

    return jsonify({"code": code, "players": players}), 201


@dev_bp.route("/bot-action/<code>", methods=["POST"])
def trigger_bot_action(code):
    """Make ONE bot take its turn using smart strategy.

    Only plays a single bot turn so the frontend can show each bot's
    action with a delay between them.
    """
    game, room = manager.get_game(code)
    if not game:
        return jsonify({"error": "Game not found"}), 404

    bots = set(room.get("bots", []))
    current = game.current_player()

    if current.name not in bots:
        return jsonify({"error": "Not a bot's turn"}), 400
    if game.round_ended:
        return jsonify({"error": "Round ended"}), 400

    bot_type = "rl" if current.name.startswith("RL-") else room.get("bot_type", "heuristic")
    strategy = _get_bot_strategy(code, current.name, bot_type)

    # Feed any recent action to the strategy
    if game.last_action:
        strategy.observe_action(game.last_action)

    pile_top_card = game.play_pile[-1] if game.play_pile else None

    # Gather opponent card counts (visible information)
    opponent_counts = {
        p.name: len(p.hand)
        for p in game.players
        if p.name != current.name
    }

    cards_to_play, draw_source, should_end = strategy.choose_action(
        current, pile_top_card, len(game.deck), opponent_counts
    )

    action = None

    if should_end and current.can_end_round():
        result = game.end_round(current.name)
        action = {
            "type": "end_round",
            "player": current.name,
            "hand_value": result.hand_values[current.name],
        }
    else:
        if not cards_to_play:
            cards_to_play = [min(current.hand, key=lambda c: c.value())]

        try:
            action = game.play_cards(current.name, cards_to_play, draw_source)
            # Feed action to all bot strategies
            for bot_name in bots:
                _get_bot_strategy(code, bot_name).observe_action(action)
        except Exception:
            try:
                action = game.play_cards(current.name, [current.hand[0]], "deck")
            except Exception:
                return jsonify({"error": "Bot failed to play"}), 500

    manager.save_game(code, game, room)

    return jsonify({
        "action": action,
        "current_player": game.current_player().name,
        "round_ended": game.round_ended,
        "game_over": game.game_over,
    })


@dev_bp.route("/bot-ready/<code>", methods=["POST"])
def bot_ready(code):
    """Make all bots ready for next round."""
    game, room = manager.get_game(code)
    if not game or not game.round_ended:
        return jsonify({"error": "Round not ended"}), 400

    bots = room.get("bots", [])
    for bot_name in bots:
        game.mark_ready(bot_name)

    # Check if all ready (including human)
    all_ready = set(p.name for p in game.players) == game.ready_players
    if all_ready:
        game.start_next_round()
        # Reset bot strategies for new round
        bot_type = room.get("bot_type", "heuristic")
        if code in _bot_strategies:
            for bot_name in bots:
                _bot_strategies[code][bot_name] = _make_bot_strategy(bot_type)

    manager.save_game(code, game, room)

    return jsonify({
        "all_ready": all_ready,
        "ready_players": list(game.ready_players),
    })


@dev_bp.route("/bot-game", methods=["POST"])
def bot_game():
    """Create a bot-only game (no human player) for spectating.

    JSON body:
        bots: number of bots (default 3, min 2, max 4)
        bot_type: "heuristic" (default) or "rl"
    """
    data = request.get_json(silent=True) or {}
    bot_count = max(2, min(data.get("bots", 3), 4))

    code = str(uuid.uuid4())[:6].upper()
    bot_type = data.get("bot_type", "heuristic")

    if bot_type == "mixed":
        import random
        bot_names = []
        for i in range(bot_count):
            t = random.choice(["rl", "heuristic"])
            prefix = "RL" if t == "rl" else "Bot"
            bot_names.append(f"{prefix}-{i + 1}")
    elif bot_type == "rl":
        bot_names = [f"RL-{i + 1}" for i in range(bot_count)]
    else:
        bot_names = [f"Bot-{i + 1}" for i in range(bot_count)]

    game = Game(bot_names)
    room_data = {
        "code": code,
        "host": bot_names[0],
        "password": None,
        "max_players": bot_count,
        "turn_timer": 0,
        "players": bot_names,
        "ready": {p: True for p in bot_names},
        "game": game.serialize(),
        "started": True,
        "bots": bot_names,
        "spectator_only": True,
        "bot_type": bot_type,
    }
    manager.save_room(code, room_data)

    # Initialize bot strategies (for mixed, infer type from name)
    for bot_name in bot_names:
        t = "rl" if bot_name.startswith("RL-") else "heuristic"
        _get_bot_strategy(code, bot_name, t)

    return jsonify({"code": code, "players": bot_names}), 201


@dev_bp.route("/spectate/<code>", methods=["GET"])
def spectate(code):
    """Get full game state with ALL hands visible for spectating."""
    game, room = manager.get_game(code)
    if not game:
        return jsonify({"error": "Game not found"}), 404

    players = []
    for p in game.players:
        players.append({
            "name": p.name,
            "hand": [str(c) for c in sort_hand(p.hand)],
            "hand_value": p.hand_value(),
            "score": p.score,
        })

    last_action = game.last_action

    result = {
        "players": players,
        "pileTop": str(game.play_pile[-1]) if game.play_pile else None,
        "deckCount": len(game.deck),
        "currentPlayer": game.current_player().name,
        "roundEnded": game.round_ended,
        "gameOver": game.game_over,
        "scores": {p.name: p.score for p in game.players},
        "lastAction": last_action,
        "round": game.round_number,
    }

    if game.round_ended and game.last_round_data:
        result["roundData"] = {
            **game.last_round_data,
            "game_over": game.game_over,
            "winners": game.winners,
        }

    if game.game_over:
        result["winners"] = game.winners

    return jsonify(result)


@dev_bp.route("/spectate-ready/<code>", methods=["POST"])
def spectate_ready(code):
    """Make all bots ready and start next round (spectator control)."""
    game, room = manager.get_game(code)
    if not game or not game.round_ended:
        return jsonify({"error": "Round not ended"}), 400

    bots = room.get("bots", [])
    for bot_name in bots:
        game.mark_ready(bot_name)

    game.start_next_round()

    # Reset bot strategies for new round
    bot_type = room.get("bot_type", "heuristic")
    if code in _bot_strategies:
        for bot_name in bots:
            _bot_strategies[code][bot_name] = _make_bot_strategy(bot_type)

    manager.save_game(code, game, room)

    return jsonify({"ok": True})
