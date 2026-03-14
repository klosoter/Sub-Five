"""Room management with Redis storage and locking."""
import json
from ..extensions import get_redis
from .redis_lock import RedisRoomLock
from ..engine.game import Game

ROOM_PREFIX = "room:"


def room_key(code):
    return f"{ROOM_PREFIX}{code}"


def save_room(code, data, ttl=3600):
    r = get_redis()
    r.setex(room_key(code), ttl, json.dumps(data))


def load_room(code):
    r = get_redis()
    val = r.get(room_key(code))
    try:
        return json.loads(val) if val else None
    except json.JSONDecodeError:
        return None


def delete_room(code):
    r = get_redis()
    r.delete(room_key(code))


def list_rooms():
    r = get_redis()
    keys = r.keys(f"{ROOM_PREFIX}*")
    rooms = []
    for key in keys:
        code = key[len(ROOM_PREFIX):]
        data = load_room(code)
        if data:
            rooms.append((code, data))
    return rooms


def with_room_lock(code):
    """Return a context manager for room-level locking."""
    return RedisRoomLock(get_redis(), code)


def create_room(code, host_name=None, password=None, max_players=4, turn_timer=0):
    room_data = {
        "code": code,
        "host": host_name,
        "password": password,
        "max_players": max_players,
        "turn_timer": turn_timer,
        "players": [],
        "ready": {},
        "game": None,
        "started": False,
    }
    save_room(code, room_data)
    return room_data


def add_player(code, player_name):
    with with_room_lock(code):
        room = load_room(code)
        if not room:
            return None, "Room not found"
        if player_name in room["players"]:
            return None, "Name already taken"
        if len(room["players"]) >= room.get("max_players", 4):
            return None, "Room is full"
        room["players"].append(player_name)
        room["ready"][player_name] = False
        save_room(code, room)
        return room, None


def remove_player(code, player_name):
    with with_room_lock(code):
        room = load_room(code)
        if not room:
            return None
        if player_name in room["players"]:
            room["players"].remove(player_name)
            room["ready"].pop(player_name, None)
        if not room["players"]:
            delete_room(code)
            return None
        room["game"] = None if room.get("started") else room.get("game")
        room["started"] = False
        save_room(code, room)
        return room


def toggle_ready(code, player_name):
    """Toggle ready state. Returns (room, started) or (None, error_msg)."""
    with with_room_lock(code):
        room = load_room(code)
        if not room or player_name not in room["players"]:
            return None, "Invalid session"

        room["ready"][player_name] = not room["ready"].get(player_name, False)

        all_ready = (
            all(room["ready"].values())
            and len(room["players"]) >= 2
        )

        if all_ready and not room.get("started"):
            game = Game(room["players"])
            room["game"] = game.serialize()
            room["started"] = True
            save_room(code, room)
            return room, True

        save_room(code, room)
        return room, False


def get_game(code):
    """Load and deserialize the game from a room. Returns (Game, room) or (None, None)."""
    room = load_room(code)
    if not room or not room.get("game"):
        return None, None
    game = Game.deserialize(room["game"])
    return game, room


def save_game(code, game, room):
    """Serialize game back into room and save."""
    room["game"] = game.serialize()
    room["players"] = [p.name for p in game.players]
    save_room(code, room)
