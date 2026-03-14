"""Socket.IO event handlers for game actions."""
from flask import session
from flask_socketio import emit, join_room, leave_room
from ..extensions import socketio
from ..rooms import manager
from ..rooms.redis_lock import RoomBusyError
from ..engine.card import Card
from ..engine.game import InvalidMoveError


def emit_game_state(code, game):
    """Emit personalized game state to each player in the room."""
    for p in game.players:
        state = game.get_state_for_player(p.name)
        emit("game_state", state, room=f"player:{code}:{p.name}", namespace="/")


def emit_room_update(code):
    """Emit room lobby state to all players in room."""
    room = manager.load_room(code)
    if room:
        emit("room_update", {
            "players": room.get("players", []),
            "ready": room.get("ready", {}),
            "started": room.get("started", False),
        }, room=code, namespace="/")


@socketio.on("join_room")
def handle_join_room(data):
    code = data.get("room_code")
    player_name = session.get("player_name")
    if not code or not player_name:
        emit("error", {"message": "Invalid session"})
        return

    # Join the SocketIO room for broadcasts
    join_room(code)
    # Join a personal room for targeted messages
    join_room(f"player:{code}:{player_name}")

    # If game is running, send current state
    game, room = manager.get_game(code)
    if game:
        state = game.get_state_for_player(player_name)
        emit("game_state", state)
    else:
        emit_room_update(code)


@socketio.on("leave_room")
def handle_leave_room(data):
    code = data.get("room_code")
    player_name = session.get("player_name")
    if code and player_name:
        leave_room(code)
        leave_room(f"player:{code}:{player_name}")


@socketio.on("toggle_ready")
def handle_toggle_ready(data):
    code = data.get("room_code")
    player_name = session.get("player_name")
    if not code or not player_name:
        emit("error", {"message": "Invalid session"})
        return

    try:
        room, started = manager.toggle_ready(code, player_name)
        if room is None:
            emit("error", {"message": started})  # started is error msg
            return

        if started:
            game, room = manager.get_game(code)
            if game:
                emit_game_state(code, game)
        else:
            emit_room_update(code)
    except RoomBusyError:
        emit("error", {"message": "Room busy, try again"})


@socketio.on("play_cards")
def handle_play_cards(data):
    code = data.get("room_code")
    player_name = session.get("player_name")
    cards_raw = data.get("cards", [])
    draw_source = data.get("draw_source", "deck")

    if not code or not player_name:
        emit("error", {"message": "Invalid session"})
        return

    cards = [
        Card("JOKER", s[-1]) if s.startswith("JOKER") else Card(s[:-1], s[-1])
        for s in cards_raw
    ]

    try:
        with manager.with_room_lock(code):
            game, room = manager.get_game(code)
            if not game:
                emit("error", {"message": "Game not found"})
                return

            game.play_cards(player_name, cards, draw_source)
            manager.save_game(code, game, room)

        emit_game_state(code, game)

    except InvalidMoveError as e:
        emit("error", {"message": str(e)})
    except RoomBusyError:
        emit("error", {"message": "Room busy, try again"})


@socketio.on("end_round")
def handle_end_round(data):
    code = data.get("room_code")
    player_name = session.get("player_name")

    if not code or not player_name:
        emit("error", {"message": "Invalid session"})
        return

    try:
        with manager.with_room_lock(code):
            game, room = manager.get_game(code)
            if not game:
                emit("error", {"message": "Game not found"})
                return

            result = game.end_round(player_name)
            manager.save_game(code, game, room)

        # Emit round result data to all players (they build their own UI)
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
        emit("round_ended", round_data, room=code)
        emit_game_state(code, game)

    except InvalidMoveError as e:
        emit("error", {"message": str(e)})
    except RoomBusyError:
        emit("error", {"message": "Room busy, try again"})


@socketio.on("ready_next_round")
def handle_ready_next_round(data):
    code = data.get("room_code")
    player_name = session.get("player_name")

    if not code or not player_name:
        emit("error", {"message": "Invalid session"})
        return

    try:
        with manager.with_room_lock(code):
            game, room = manager.get_game(code)
            if not game:
                emit("error", {"message": "Game not found"})
                return

            is_ready, all_ready = game.mark_ready(player_name)

            if all_ready:
                game.start_next_round()

            manager.save_game(code, game, room)

        emit_game_state(code, game)

    except RoomBusyError:
        emit("error", {"message": "Room busy, try again"})
