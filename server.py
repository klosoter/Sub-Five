from flask import Flask, request, jsonify, render_template, session, redirect, url_for, g
import uuid
import redis
import json
import os
from datetime import timedelta

from game import Game, Card, sort_hand, build_game_over_notice

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-key")
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=2)

redis_client = redis.from_url(os.environ["REDIS_URL"], decode_responses=True)

# Constants
ROOM_PREFIX = "room:"
ROOM_TTL_SECONDS = 3600

# ---------------- Utility functions ----------------


def build_game_over_notice(winners):
    if not winners:
        return ""
    
    if len(winners) == 1:
        name, score = winners[0]
        winner_text = f"<strong>{name}</strong> wins with {score} points!"
    
    else:
        lines = [
            f"<strong>{name}</strong> ({score} pts)" for name, score in winners]
        winner_text = "Tie! " + ", ".join(lines)

    return f"""
    <div class="mini-popup-content">
    <h2>🏆 Game Over</h2>
    <p>{winner_text}</p>
    <button class="popup-close" id="game-over-ok">OK</button>
    </div>
    """



def build_round_summary_popup(round_ender, hands, hand_values, scores, penalty_applied, lowest_players):
    def card_html(card_str):
        if card_str.startswith("JOKER"):
            suit = card_str[-1]
            return f'<div class="joker-card" data-joker="{suit}"><div class="joker-face">{card_str}</div></div>'
        rank = card_str[:-1]
        suit = card_str[-1]
        rank_map = {"A": "Ace", "K": "King", "Q": "Queen", "J": "Jack", "10": "10", "9": "9", "8": "8",
                    "7": "7", "6": "6", "5": "5", "4": "4", "3": "3", "2": "2"}
        suit_map = {"♠": "Spades", "♥": "Hearts",
                    "♦": "Diamonds", "♣": "Clubs"}
        r = rank_map.get(rank, rank)
        s = suit_map.get(suit, suit)
        return f'<playing-card rank="{r}" suit="{s}"></playing-card>'

    rows = []

    for name, hand in hands.items():
        round_pts = hand_values[name]
        total_score = scores[name]
        cards_html = f'''
            <div class="card-scale-container">
                <div class="card-row">
                {''.join(card_html(c) for c in hand)}
                </div>
            </div>
        '''

        row_class = ""
        if round_pts == 0:
            row_class = "winner"
        if name == round_ender and penalty_applied:
            row_class = "loser"
        round_pts_display = f"{round_pts} (+15)" if row_class == "loser" else round_pts

        # if name == round_ender and not penalty_applied:
        #     row_class = "winner"

        row = f"""
        <tr class="{row_class}">
            <td>{name}</td>
            <td>{cards_html}</td>
            <td>{round_pts_display}</td>
            <td>{total_score}</td>
        </tr>
        """
        rows.append(row)

    return f"""
    <table class="round-summary-table">
        <tr><th>Name</th><th>Hand</th><th>Round Points</th><th>Total Score</th></tr>
        {''.join(rows)}
    </table>
    """


def extract_player_names(players):
    return [p if isinstance(p, str) else p.get("name", "") for p in players]


def store_game_in_room(room, game):
    room["game"] = game.serialize()
    room["players"] = [p.name for p in game.players]


@app.after_request
def add_no_cache_headers(response):
    """Prevent caching of static assets like CSS/JS during development."""
    if response.content_type in ("text/css", "application/javascript"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.before_request
def setup_session_and_context():
    """Set session permanence and load player/room info into `g`."""
    session.permanent = True  # Enables session lifetime control (optional)

    # Extract from session
    g.room_code = session.get("room")
    g.player_name = session.get("player_name")

    # Load room from Redis (or None if not set)
    g.room = load_room(g.room_code) if g.room_code else None


def room_key(code):
    return f"{ROOM_PREFIX}{code}"


def save_room(code, data, ttl=ROOM_TTL_SECONDS):
    """Store a room in Redis with TTL (default 1 hour)."""
    redis_client.setex(room_key(code), ttl, json.dumps(data))


def load_room(code):
    """Load a room by code, or return None if not found."""
    val = redis_client.get(room_key(code))
    try:
        return json.loads(val) if val else None
    except json.JSONDecodeError:
        return None


def delete_room(code):
    """Remove a room from Redis."""
    redis_client.delete(room_key(code))


def list_rooms():
    """Return a list of (code, data) tuples for all rooms."""
    keys = redis_client.keys(f"{ROOM_PREFIX}*")
    rooms = []
    for key in keys:
        code = key[len(ROOM_PREFIX):]
        data = load_room(code)
        if data:
            rooms.append((code, data))
    return rooms

# ---------------- Routes ----------------


@app.route("/")
def home():
    return render_template("home.html", room_list=[
        {
            "code": code,
            "players": extract_player_names(room.get("players", [])),
            "started": room.get("started", False)
        }
        for code, room in list_rooms()
    ])


@app.route("/room-list")
def room_list_json():
    return jsonify([
        {
            "code": code,
            "players": extract_player_names(room.get("players", [])),
            "started": room.get("started", False)
        }
        for code, room in list_rooms()
    ])


@app.route("/create")
def create_room():
    """Create a new room and redirect to join page."""
    session.clear()
    code = str(uuid.uuid4())[:6].upper()
    room_data = {
        "players": [],
        "ready": {},
        "game": None,
        "started": False
    }
    save_room(code, room_data)
    return redirect(url_for("join_room", code=code))


@app.route("/join/<code>")
def join_room(code):
    room = load_room(code)
    if not room:
        return redirect("/")

    name = session.get("player_name")

    # If session has a player name, but they're not in the room → clear it
    if name and name not in room.get("players", []):
        session.pop("player_name", None)

    return render_template("join.html", room_code=code, player_name=session.get("player_name"))


@app.route("/join-room", methods=["POST"])
def post_join_room():
    """Handle name submission and join room."""
    code = request.form.get("room")
    name = request.form.get("name", "").strip()

    room = load_room(code)
    if not room or not name:
        return redirect("/")

    session["room"] = code
    session["player_name"] = name

    if name not in room["players"]:
        room["players"].append(name)
        room["ready"][name] = False
        save_room(code, room)

    return redirect(url_for("join_room", code=code))


@app.route("/toggle-ready/<code>", methods=["POST"])
def toggle_ready(code):
    """Toggle player ready state; if all ready, start game."""
    room = load_room(code)
    name = session.get("player_name")

    if not room or not name or name not in room["players"]:
        return jsonify({"error": "Invalid session"})

    # Toggle readiness
    room["ready"][name] = not room["ready"].get(name, False)

    # Start game if everyone is ready
    all_ready = all(room["ready"].values()) and len(room["players"]) >= 2
    if all_ready and not room.get("started"):
        player_names = [p["name"] if isinstance(
            p, dict) else p for p in room["players"]]
        game = Game(player_names)

        store_game_in_room(room, game)

        room["started"] = True
        save_room(code, room)
        return jsonify({"status": "started"})

    # Save updated readiness
    save_room(code, room)
    return jsonify({"ready": room["ready"][name]})


@app.route("/room-state/<code>")
def room_state(code):
    """Return room state for polling (players + readiness)."""
    room = load_room(code)
    if not room:
        return jsonify({"error": "Room closed"})

    if session.get("player_name") not in room["players"]:
        session.pop("player_name", None)

    return jsonify({
        "players": room.get("players", []),
        "ready": room.get("ready", {}),
        "started": room.get("started", False)
    })


@app.route("/delete-room/<code>", methods=["POST"])
def delete_room_route(code):
    """Delete room and redirect to lobby."""
    delete_room(code)
    return redirect("/")


@app.route("/leave", methods=["POST"])
def leave():
    code = session.get("room")
    name = session.get("player_name")

    if not code or not name:
        session.clear()
        return jsonify({"redirect": "/"})

    room = load_room(code)
    if room and name in room.get("players", []):
        room["players"].remove(name)
        room["ready"].pop(name, None)

        # Optional: Clear game state if active
        if not room["players"]:
            delete_room(code)
        else:
            room["game"] = None if room.get("started") else room.get("game")
            room["started"] = False
            save_room(code, room)

    session.clear()
    return jsonify({"redirect": "/"})


@app.route("/end-room", methods=["POST"])
def end_room():
    code = session.get("room")
    player_name = session.get("player_name")

    if not code or not player_name:
        return jsonify({"error": "Not in a room"}), 400

    room = load_room(code)
    if not room:
        return jsonify({"error": "Room not found"}), 400

    # Optional: Mark room as terminated for any future polling logic
    room["terminated"] = True
    save_room(code, room)

    # Actually remove the room from Redis
    delete_room(code)
    session.clear()

    return jsonify({"status": "Room closed", "redirect": "/"})


@app.route("/game")
def game():
    if "player_name" not in session or "room" not in session:
        return redirect("/")
    return render_template("index.html", room_code=session["room"])


@app.route("/state")
def state():
    code = session.get("room")
    player_name = session.get("player_name")
    room = load_room(code)

    if not room or not code or not player_name or player_name not in room["players"]:
        session.clear()
        return jsonify({"error": "Invalid session"}), 400

    game = room.get("game")
    if not game:
        return jsonify({"error": "Game not started"}), 400

    if isinstance(game, dict):
        game = Game.deserialize(game)
        room["game"] = game

    # Show game-over popup once, then clear
    # Only send popup if player hasn't seen it yet

    gameOver = game.game_over
    
    if game.game_over_notice and player_name not in game.seen_game_over_notice:
        gameOverNotice = game.game_over_notice
        game.seen_game_over_notice.add(player_name)
    else:
        gameOverNotice = None
    
    if set(p.name for p in game.players) == game.seen_game_over_notice:
        game.game_over_notice = None
        game.seen_game_over_notice = set()
 
    # If all players have seen it, clear it
    if set(p.name for p in game.players) == game.seen_game_over_notice:
        game.game_over_notice = None
        game.seen_game_over_notice = set()


    # Start next round if all players ready
    if set(p.name for p in game.players) == game.ready_players:
        game.start_next_round()
        game.ready_players = set()
        game.round_ended = False

    action = getattr(game, "last_action", None)
    if action:
        draw_source = action["draw_source"]
        drew_card = (
            str(action["drawn_card"]
                ) if draw_source == "pile" or action["player"] == player_name else None
        )
        last_action = {
            "player": action["player"],
            "played": action["played"],
            "drawn_card": drew_card,
            "draw_source": draw_source
        }
    else:
        last_action = None

    room["game"] = game.serialize()
    save_room(code, room)
    
    gameOver = game.game_over

    return jsonify({
        "players": [
            {
                "name": p.name,
                "hand": [str(c) for c in sort_hand(p.hand)] if p.name == player_name else len(p.hand),
                "hand_value": p.hand_value() if p.name == player_name else None,
                "score": game.scores.get(p.name, 0)
            }
            for p in game.players
        ],
        "pileTop": str(game.play_pile[-1]) if game.play_pile else "",
        "deckCount": len(game.deck.cards),
        "currentPlayer": game.current_player().name,
        "lastAction": last_action,
        "scores": game.scores,
        "roundEnded": game.round_ended,
        "readyPlayers": list(game.ready_players),
        "roundSummaryPopup": getattr(game, "round_summary_html", ""),
        "gameOver": gameOver,
        "gameOverNotice": gameOverNotice
    })


@app.route("/play", methods=["POST"])
def handle_play_cards():
    code = session.get("room")
    player_name = session.get("player_name")
    room = load_room(code)

    if not room or not room.get("game"):
        return redirect("/")

    game = room["game"]
    if isinstance(game, dict):
        game = Game.deserialize(game)
    room["game"] = game  # safe temporarily

    data = request.json
    cards_raw = data.get("cards", [])
    draw = data.get("draw")

    cards = [
        Card("JOKER", s[-1]) if s.startswith("JOKER") else Card(s[:-1], s[-1])
        for s in cards_raw
    ]

    try:
        player = next(p for p in game.players if p.name == player_name)
        played, drawn = game.play_cards(player, cards, draw)
        game.next_turn()
        game.last_action = {
            "player": player.name,
            "played": [str(c) for c in played],
            "drawn_card": str(drawn),
            "draw_source": draw
        }
        store_game_in_room(room, game)
        save_room(code, room)
        return jsonify({"status": "OK"})

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/end-round", methods=["POST"])
def end_round():
    code = session.get("room")
    player = session.get("player_name")
    room = load_room(code)

    if not room or not room.get("game"):
        return redirect("/")

    try:
        game = room["game"]
        if isinstance(game, dict):
            game = Game.deserialize(game)
        room["game"] = game  # keep deserialized for now

        hands, hand_values, scores, penalty_applied, lowest_players = game.end_game(
            player)
        game.round_ended = True
        game.ready_players = set()

        if game.is_game_over():
            game.game_over = True
            game.winners = game.determine_winners()
            game.game_over_notice = build_game_over_notice(game.winners)
        else:
            game.game_over_notice = None

        game.round_summary_html = build_round_summary_popup(
            round_ender=player,
            hands={p.name: [str(c) for c in sort_hand(p.hand)]
                   for p in game.players},
            hand_values=hand_values,
            scores=scores,
            penalty_applied=penalty_applied,
            lowest_players=lowest_players,
            # game_over=game.game_over
        )

        room["players"] = [p.name for p in game.players]
        room["game"] = game.serialize()
        save_room(code, room)

        print(game.winners)
        print(game.game_over_notice)
        return jsonify({
            "hands": hands,
            "hand_values": hand_values,
            "scores": scores,
            "penalty_applied": penalty_applied,
            "lowest_player": lowest_players,
            "round_ender": player,
            "roundSummaryPopup": game.round_summary_html,
            "gameOverNotice": game.game_over_notice,
            "gameOver": game.game_over,
            "readyPlayers": list(room["ready"]),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/ready-next-round", methods=["POST"])
def ready_next_round():
    code = session.get("room")
    player = session.get("player_name")

    if not code or not player:
        return jsonify({"error": "Missing session"}), 400

    room = load_room(code)
    if not room or "game" not in room:
        return jsonify({"error": "Room/game not found"}), 400

    game = room["game"]
    if isinstance(game, dict):
        game = Game.deserialize(game)
    room["game"] = game  # allow mutation

    if not game.round_ended:
        return jsonify({"error": "Round not ended"}), 400

    if player in game.ready_players:
        game.ready_players.remove(player)
    else:
        game.ready_players.add(player)

    all_ready = set(p.name for p in game.players) == game.ready_players

    if all_ready and game.round_ended:
        if game.game_over:
            game.reset_scores()
        game.reset_for_next_round()
        game.round_ended = False
        game.last_action = None
    store_game_in_room(room, game)
    save_room(code, room)

    return jsonify({
        "ready": list(game.ready_players),
        "all_ready": all_ready,
        "pileTop": str(game.play_pile),
        "scores": game.scores,
        "gameOver": game.game_over,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
