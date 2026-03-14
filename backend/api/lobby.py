"""REST API for lobby operations: room list, create, join, leave, and game actions."""
import uuid
from flask import Blueprint, request, jsonify, session
from ..rooms import manager
from ..engine.card import Card
from ..engine.game import InvalidMoveError

lobby_bp = Blueprint("lobby", __name__, url_prefix="/api/lobby")


@lobby_bp.route("/rooms", methods=["GET"])
def list_rooms():
    rooms = manager.list_rooms()
    return jsonify([
        {
            "code": code,
            "players": room.get("players", []),
            "started": room.get("started", False),
            "max_players": room.get("max_players", 4),
            "has_password": bool(room.get("password")),
        }
        for code, room in rooms
    ])


@lobby_bp.route("/rooms", methods=["POST"])
def create_room():
    data = request.get_json(silent=True) or {}
    code = str(uuid.uuid4())[:6].upper()
    room = manager.create_room(
        code,
        host_name=session.get("player_name"),
        max_players=data.get("max_players", 4),
        turn_timer=data.get("turn_timer", 0),
    )
    return jsonify({"code": code, "room": room}), 201


@lobby_bp.route("/rooms/<code>", methods=["DELETE"])
def delete_room(code):
    manager.delete_room(code)
    session.clear()
    return jsonify({"status": "deleted"})


@lobby_bp.route("/rooms/<code>/join", methods=["POST"])
def join_room(code):
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name required"}), 400

    room, error = manager.add_player(code, name)
    if error:
        return jsonify({"error": error}), 400

    session["room"] = code
    session["player_name"] = name
    return jsonify({"status": "joined", "room": room})


@lobby_bp.route("/rooms/<code>/leave", methods=["POST"])
def leave_room(code):
    name = session.get("player_name")
    if not name:
        return jsonify({"error": "Not in room"}), 400

    manager.remove_player(code, name)
    session.clear()
    return jsonify({"status": "left"})


@lobby_bp.route("/rooms/<code>/state", methods=["GET"])
def room_state(code):
    room = manager.load_room(code)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    return jsonify({
        "players": room.get("players", []),
        "ready": room.get("ready", {}),
        "started": room.get("started", False),
    })


@lobby_bp.route("/rooms/<code>/game-state", methods=["GET"])
def game_state(code):
    """Return full game state personalized for the current player."""
    player_name = session.get("player_name")
    if not player_name:
        return jsonify({"error": "Not in a game"}), 401

    game, room = manager.get_game(code)
    if not game:
        return jsonify({"error": "Game not found"}), 404

    state = game.get_state_for_player(player_name)
    return jsonify(state)


@lobby_bp.route("/rooms/<code>/play", methods=["POST"])
def play_cards(code):
    """Play cards via REST (used by dev mode and as Socket.IO fallback)."""
    player_name = session.get("player_name")
    if not player_name:
        return jsonify({"error": "Not in a game"}), 401

    data = request.get_json(silent=True) or {}
    cards_raw = data.get("cards", [])
    draw_source = data.get("draw_source", "deck")

    cards = [
        Card("JOKER", s[-1]) if s.startswith("JOKER") else Card(s[:-1], s[-1])
        for s in cards_raw
    ]

    try:
        game, room = manager.get_game(code)
        if not game:
            return jsonify({"error": "Game not found"}), 404

        game.play_cards(player_name, cards, draw_source)
        manager.save_game(code, game, room)

        state = game.get_state_for_player(player_name)
        return jsonify(state)

    except InvalidMoveError as e:
        return jsonify({"error": str(e)}), 400


@lobby_bp.route("/rooms/<code>/end-round", methods=["POST"])
def end_round(code):
    """End the round via REST."""
    player_name = session.get("player_name")
    if not player_name:
        return jsonify({"error": "Not in a game"}), 401

    try:
        game, room = manager.get_game(code)
        if not game:
            return jsonify({"error": "Game not found"}), 404

        result = game.end_round(player_name)
        manager.save_game(code, game, room)

        round_data = {
            "ender": result.ender_name,
            "hands": result.hands,
            "hand_values": result.hand_values,
            "round_points": result.round_points,
            "total_scores": result.total_scores,
            "penalty_applied": result.penalty_applied,
            "game_over": game.game_over,
            "winners": game.winners,
        }
        state = game.get_state_for_player(player_name)
        return jsonify({"round_data": round_data, "state": state})

    except InvalidMoveError as e:
        return jsonify({"error": str(e)}), 400


@lobby_bp.route("/rooms/<code>/ready", methods=["POST"])
def ready_next_round(code):
    """Mark player ready for next round via REST."""
    player_name = session.get("player_name")
    if not player_name:
        return jsonify({"error": "Not in a game"}), 401

    game, room = manager.get_game(code)
    if not game:
        return jsonify({"error": "Game not found"}), 404

    is_ready, all_ready = game.mark_ready(player_name)
    if all_ready:
        game.start_next_round()

    manager.save_game(code, game, room)

    state = game.get_state_for_player(player_name)
    return jsonify({"state": state, "all_ready": all_ready})
