"""Dev-only routes for testing without multiple browsers."""
import uuid
from flask import Blueprint, request, jsonify, session
from ..rooms import manager
from ..engine.game import Game
from ..engine.bot import BotStrategy

dev_bp = Blueprint("dev", __name__, url_prefix="/api/dev")

# Store bot strategies per room (keyed by room code)
_bot_strategies: dict[str, dict[str, BotStrategy]] = {}


def _get_bot_strategy(room_code: str, bot_name: str) -> BotStrategy:
    if room_code not in _bot_strategies:
        _bot_strategies[room_code] = {}
    if bot_name not in _bot_strategies[room_code]:
        _bot_strategies[room_code][bot_name] = BotStrategy()
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

    code = str(uuid.uuid4())[:6].upper()
    players = [player_name]
    bot_names = []
    for i in range(bot_count):
        bot_name = f"Bot-{i + 1}"
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
    }
    manager.save_room(code, room_data)

    session["room"] = code
    session["player_name"] = player_name

    # Initialize bot strategies
    for bot_name in bot_names:
        _get_bot_strategy(code, bot_name)

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

    strategy = _get_bot_strategy(code, current.name)

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
        if code in _bot_strategies:
            for bot_name in bots:
                _bot_strategies[code][bot_name] = BotStrategy()

    manager.save_game(code, game, room)

    return jsonify({
        "all_ready": all_ready,
        "ready_players": list(game.ready_players),
    })
