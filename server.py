# lsof -ti tcp:5000 | xargs ps -p | grep python | awk '{print $1}' | xargs kill -9 python server.py
from flask import Flask, request, jsonify, render_template, session, redirect, url_for, g
import uuid
import redis
import json
import os
import time
import contextlib
from datetime import timedelta

from game import Game, Card, sort_hand, build_game_over_notice

from flask_login import (
    LoginManager, login_user, logout_user, login_required, current_user,
)
from db import init_db
from accounts import User, ValidationError, AVATAR_COLORS, leaderboard as get_leaderboard, record_match

from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-key")
if not os.environ.get("SECRET_KEY") and os.environ.get("FLASK_ENV") == "production":
    raise RuntimeError("SECRET_KEY must be set in production (fly secrets set SECRET_KEY=...)")
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("FLASK_ENV") == "production"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=2)

_redis_url = os.environ.get("REDIS_URL")
if not _redis_url:
    raise RuntimeError("REDIS_URL must be set (e.g. fly secrets set REDIS_URL=redis://...)")
redis_client = redis.from_url(_redis_url, decode_responses=True)

# ---------------- Auth (Flask-Login + SQLite) ----------------
init_db(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login_page"

# JSON endpoints polled by the game client — they must get a 401 JSON body on an
# expired session, not an HTML login redirect the fetch() code can't parse.
API_ENDPOINTS = {
    "room_list_json", "toggle_ready", "room_state", "leave", "end_room",
    "state", "handle_play_cards", "end_round", "ready_next_round",
}


@login_manager.user_loader
def load_user(user_id):
    return User.get_by_id(user_id)


@login_manager.unauthorized_handler
def handle_unauthorized():
    if request.endpoint in API_ENDPOINTS:
        # "Invalid session" matches what the game client already handles.
        return jsonify({"error": "Invalid session", "redirect": "/login"}), 401
    return redirect(url_for("login_page", next=request.path))


# Accounts whose username (lowercased) is in ADMIN_USERNAMES get the /admin panel.
# Set e.g. `fly secrets set ADMIN_USERNAMES=you,teammate`.
ADMIN_USERNAMES = {u.strip().lower() for u in os.environ.get("ADMIN_USERNAMES", "").split(",") if u.strip()}


def _is_admin():
    return current_user.is_authenticated and (current_user.username or "").lower() in ADMIN_USERNAMES


# ---- login brute-force protection (Redis failure counters) ----
LOGIN_MAX_ATTEMPTS = 10
LOGIN_WINDOW_SECONDS = 300  # sliding 5-minute window per IP and per username


def _client_ip():
    # Honour the proxy chain (Fly/Cloudflare) but fall back to the socket peer.
    xff = request.headers.get("X-Forwarded-For", "")
    return xff.split(",")[0].strip() if xff else (request.remote_addr or "unknown")


def _rl_over(*keys):
    # Fail OPEN: a Redis outage must never block or 500 the login page. Rate
    # limiting is best-effort, so if Redis is unavailable we simply don't limit.
    try:
        return any(int(redis_client.get(k) or 0) >= LOGIN_MAX_ATTEMPTS for k in keys)
    except Exception:
        return False


def _rl_hit(*keys):
    try:
        for k in keys:
            n = redis_client.incr(k)
            if n == 1:
                redis_client.expire(k, LOGIN_WINDOW_SECONDS)
    except Exception:
        pass

# Constants
ROOM_PREFIX = "room:"
ROOM_TTL_SECONDS = 3600
MAX_PLAYERS = 4  # the table UI seats at most 4 and the 54-card deck deals for <=4

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
    <div style="display:flex;gap:1vw;justify-content:center;flex-wrap:wrap">
      <button class="popup-close" id="game-over-ok">OK</button>
      <a class="popup-close" href="/leaderboard" target="_blank" rel="noopener">🏆 Leaderboard</a>
    </div>
    </div>
    """



def build_round_summary_popup(round_ender, hands, hand_values, scores, penalty_applied):
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


def _remove_player_from_game(game, name):
    """Remove a player who left mid-game and fix the turn pointer so the rest
    keep playing. Only touches the seat list + current-player index — the rules,
    scoring, validation and turn rotation in game.py are unchanged. Returns the
    number of players still seated."""
    idx = next((i for i, p in enumerate(game.players) if p.name == name), None)
    if idx is None:
        return len(game.players)
    game.players.pop(idx)
    game.ready_players.discard(name)
    game.seen_game_over_notice.discard(name)
    if game.players:
        # Keep current_player_index pointing at the same player; if the leaver
        # was the one on turn (or sat before them), it now lands on the next.
        if idx < game.current_player_index:
            game.current_player_index -= 1
        game.current_player_index %= len(game.players)
    return len(game.players)


def _do_leave(code, name):
    """Remove `name` from room `code` under the room lock. The rest keep playing;
    the room is deleted if fewer than 2 players remain. Shared by /leave and
    account deletion so a departing player never lingers in a game."""
    if not code or not name:
        return
    with room_lock(code):
        room = load_room(code)
        if not room or name not in room.get("players", []):
            return
        room["players"].remove(name)
        room["ready"].pop(name, None)
        room.get("user_ids", {}).pop(name, None)
        if not room["players"]:
            delete_room(code)
            redis_client.delete(_recorded_key(code))
        elif room.get("started") and room.get("game"):
            g = room["game"]
            if isinstance(g, dict):
                g = Game.deserialize(g)
            if _remove_player_from_game(g, name) < 2:
                delete_room(code)
                redis_client.delete(_recorded_key(code))
            else:
                store_game_in_room(room, g)
                save_room(code, room)
        else:
            save_room(code, room)


def _recorded_key(code):
    return f"recorded:{code}"


def _record_finished_match(code, room, game):
    """Persist a finished match to the accounts DB, exactly once per game-over.

    The once-guard is a Redis SET NX marker (not a field inside the room JSON
    blob), so concurrent end-round requests across workers can't double-record.
    The marker is cleared when a fresh game starts (toggle_ready) or a rematch
    begins (ready_next_round).
    """
    if not redis_client.set(_recorded_key(code), "1", nx=True, ex=ROOM_TTL_SECONDS):
        return  # this match was already recorded
    winner_names = {name for name, _ in (game.winners or [])}
    user_ids = room.get("user_ids", {})
    players_data = [
        {
            "user_id": user_ids.get(p.name),
            "display_name": p.name,
            "final_score": game.scores.get(p.name, 0),
            "is_winner": p.name in winner_names,
        }
        for p in game.players
    ]
    try:
        record_match(code, players_data)
    except Exception as e:
        # Release the marker so a retry can record rather than losing the match.
        redis_client.delete(_recorded_key(code))
        app.logger.warning("record_match failed: %s", e)


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


@contextlib.contextmanager
def room_lock(code, timeout=5, retries=100, delay=0.03):
    """Best-effort per-room mutex around read-modify-write of the room blob so
    concurrent joins / ready-toggles / leaves don't clobber each other. Falls
    through after ~3s of contention (rare for these tiny critical sections)
    rather than erroring the request."""
    lock_key = f"lock:{code}"
    token = uuid.uuid4().hex
    have = False
    for _ in range(retries):
        if redis_client.set(lock_key, token, nx=True, ex=timeout):
            have = True
            break
        time.sleep(delay)
    if not have:
        app.logger.warning("room_lock: proceeding without lock for %s", code)
    try:
        yield
    finally:
        if have:
            try:
                if redis_client.get(lock_key) == token:
                    redis_client.delete(lock_key)
            except Exception:
                pass

# ---------------- Auth routes ----------------


def _safe_next(nxt):
    """Only allow same-site relative redirect targets (blocks //evil.com etc.)."""
    if nxt and nxt.startswith("/") and not nxt.startswith("//") and not nxt.startswith("/\\"):
        return nxt
    return "/"


@app.route("/login", methods=["GET", "POST"])
def login_page():
    if current_user.is_authenticated:
        return redirect("/")
    if request.method == "POST":
        nxt = request.form.get("next") or request.args.get("next", "")
        uname = (request.form.get("username") or "").strip().lower()
        ip_key = f"rl:login:ip:{_client_ip()}"
        user_key = f"rl:login:user:{uname}"
        if _rl_over(ip_key, user_key):
            return render_template(
                "auth.html", mode="login",
                error="Too many attempts — please wait a few minutes and try again.",
                username=request.form.get("username", ""), next=nxt,
            ), 429
        user = User.authenticate(request.form.get("username"), request.form.get("password"))
        if not user:
            _rl_hit(ip_key, user_key)  # count the failed attempt
            return render_template(
                "auth.html", mode="login", error="Invalid username or password.",
                username=request.form.get("username", ""), next=nxt,
            ), 401
        try:
            redis_client.delete(user_key)  # clear the per-user counter on success
        except Exception:
            pass
        session.clear()  # rotate: don't carry a pre-auth session across login
        login_user(user, remember=True)
        user.touch()
        session["player_name"] = user.display_name
        return redirect(_safe_next(nxt))
    return render_template("auth.html", mode="login", next=request.args.get("next", ""))


@app.route("/register", methods=["GET", "POST"])
def register_page():
    if current_user.is_authenticated:
        return redirect("/")
    if request.method == "POST":
        pw = request.form.get("password", "")
        confirm = request.form.get("confirm_password")
        try:
            # The register form always sends confirm_password; validate it when
            # present (non-form callers that omit it are unaffected).
            if confirm is not None and pw != confirm:
                raise ValidationError("Passwords do not match.")
            user = User.register(
                request.form.get("username", ""),
                pw,
                request.form.get("display_name", ""),
            )
        except ValidationError as e:
            return render_template(
                "auth.html", mode="register", error=str(e),
                username=request.form.get("username", ""),
                display_name=request.form.get("display_name", ""),
            ), 400
        session.clear()  # rotate session on privilege change
        login_user(user, remember=True)
        session["player_name"] = user.display_name
        return redirect("/")
    return render_template("auth.html", mode="register")


@app.route("/logout", methods=["POST", "GET"])
def logout():
    # Drop our own keys first; logout_user() then clears the login session AND
    # queues the remember-me cookie for deletion. Do NOT session.clear() after
    # it — that would wipe the remember-clear flag and re-login on next request.
    session.pop("room", None)
    session.pop("player_name", None)
    logout_user()
    return redirect("/login")


@app.route("/leaderboard")
@login_required
def leaderboard_page():
    return render_template("leaderboard.html", user=current_user, rows=get_leaderboard(limit=50))


@app.route("/profile")
@login_required
def profile_page():
    return render_template(
        "profile.html", user=current_user,
        stats=current_user.stats(), history=current_user.match_history(limit=15),
    )


@app.route("/account", methods=["GET", "POST"])
@login_required
def account_page():
    message = error = None
    if request.method == "POST":
        action = request.form.get("action")
        try:
            if action == "name":
                current_user.change_display_name(request.form.get("display_name", ""))
                session["player_name"] = current_user.display_name
                message = "Display name updated."
            elif action == "password":
                new = request.form.get("new_password", "")
                if new != request.form.get("confirm_password", ""):
                    raise ValidationError("New passwords do not match.")
                current_user.change_password(request.form.get("current_password", ""), new)
                message = "Password updated."
            elif action == "color":
                current_user.change_avatar_color(request.form.get("avatar_color", ""))
                message = "Avatar colour updated."
            else:
                raise ValidationError("Unknown action.")
        except ValidationError as e:
            error = str(e)
    return render_template(
        "account.html", user=current_user, is_admin=_is_admin(),
        avatar_colors=AVATAR_COLORS, message=message, error=error,
    ), (400 if error else 200)


@app.route("/account/delete", methods=["POST"])
@login_required
def account_delete():
    # Require the password to confirm this destructive action.
    if not User.authenticate(current_user.username, request.form.get("password", "")):
        return render_template(
            "account.html", user=current_user, is_admin=_is_admin(),
            avatar_colors=AVATAR_COLORS,
            error="Password incorrect — account not deleted.",
        ), 400
    # Exit any active game first so the deleted player doesn't linger in a room.
    _do_leave(session.get("room"), session.get("player_name"))
    uid = current_user.id
    session.pop("room", None)
    session.pop("player_name", None)
    logout_user()
    User.delete_user(uid)
    return redirect("/login")


# ---------------- Admin ----------------


@app.route("/admin")
@login_required
def admin_page():
    if not _is_admin():
        return redirect("/")
    rooms = [
        {
            "code": code,
            "players": extract_player_names(room.get("players", [])),
            "started": room.get("started", False),
        }
        for code, room in list_rooms()
    ]
    return render_template("admin.html", user=current_user, rooms=rooms, users=User.all_users())


@app.route("/admin/delete-room/<code>", methods=["POST"])
@login_required
def admin_delete_room(code):
    if not _is_admin():
        return redirect("/")
    with room_lock(code):
        delete_room(code)
        redis_client.delete(_recorded_key(code))
    return redirect("/admin")


@app.route("/admin/clear-rooms", methods=["POST"])
@login_required
def admin_clear_rooms():
    if not _is_admin():
        return redirect("/")
    for code, _room in list_rooms():
        with room_lock(code):
            delete_room(code)
            redis_client.delete(_recorded_key(code))
    return redirect("/admin")


@app.route("/admin/delete-user/<user_id>", methods=["POST"])
@login_required
def admin_delete_user(user_id):
    if not _is_admin():
        return redirect("/")
    if user_id != current_user.id:  # can't delete yourself from the admin panel
        User.delete_user(user_id)
    return redirect("/admin")


# ---------------- Lobby routes ----------------


@app.route("/")
@login_required
def home():
    rooms = []
    for code, room in list_rooms():
        if not room.get("players"):
            continue  # hide empty rooms (creator not seated yet / abandoned)
        rooms.append({
            "code": code,
            "players": extract_player_names(room.get("players", [])),
            "started": room.get("started", False),
            "is_host": room.get("host") == current_user.id,
        })
    return render_template(
        "home.html", room_list=rooms, user=current_user, is_admin=_is_admin(),
        stats=current_user.stats(), leaders=get_leaderboard(limit=10),
    )


@app.route("/room-list")
@login_required
def room_list_json():
    return jsonify([
        {
            "code": code,
            "players": extract_player_names(room.get("players", [])),
            "started": room.get("started", False),
            "is_host": room.get("host") == current_user.id,
        }
        for code, room in list_rooms()
        if room.get("players")
    ])


@app.route("/create")
@login_required
def create_room():
    """Create a new room and redirect to its join page."""
    session.pop("room", None)
    session.pop("player_name", None)
    code = str(uuid.uuid4())[:6].upper()
    room_data = {
        "players": [],
        "ready": {},
        "game": None,
        "started": False,
        "host": current_user.id,
        "user_ids": {},
    }
    save_room(code, room_data)
    return redirect(url_for("join_room", code=code))


@app.route("/join/<code>")
@login_required
def join_room(code):
    # Identity comes from the authenticated account, never from client input.
    name = current_user.display_name
    with room_lock(code):
        room = load_room(code)
        if not room:
            return redirect("/")
        if name not in room.get("players", []):
            if room.get("started"):
                return redirect("/")  # cannot join a game already in progress
            if len(room.get("players", [])) >= MAX_PLAYERS:
                return redirect("/")  # room is full
            room.setdefault("players", []).append(name)
            room.setdefault("ready", {})[name] = False
            room.setdefault("user_ids", {})[name] = current_user.id
            save_room(code, room)

    session["room"] = code
    session["player_name"] = name
    return render_template("join.html", room_code=code, player_name=name)


@app.route("/toggle-ready/<code>", methods=["POST"])
@login_required
def toggle_ready(code):
    """Toggle player ready state; if all ready, start game."""
    name = session.get("player_name")
    with room_lock(code):
        room = load_room(code)
        if not room or not name or name not in room["players"]:
            return jsonify({"error": "Invalid session"})

        # Toggle readiness
        room["ready"][name] = not room["ready"].get(name, False)

        # Start game if everyone is ready (exactly one request wins this inside
        # the lock, so two concurrent toggles can't build two games).
        all_ready = all(room["ready"].values()) and len(room["players"]) >= 2
        if all_ready and not room.get("started"):
            player_names = [p["name"] if isinstance(p, dict) else p for p in room["players"]]
            game = Game(player_names)
            store_game_in_room(room, game)
            room["started"] = True
            redis_client.delete(_recorded_key(code))  # fresh match can be recorded
            save_room(code, room)
            return jsonify({"status": "started"})

        save_room(code, room)
        return jsonify({"ready": room["ready"][name]})


@app.route("/room-state/<code>")
@login_required
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
@login_required
def delete_room_route(code):
    """Delete a room and redirect to the lobby.

    Used both by the lobby Delete button and the in-game Quit (script.js), so the
    redirect contract is preserved. Only the host may delete from the lobby.
    """
    with room_lock(code):
        room = load_room(code)
        if room:
            is_host = room.get("host") == current_user.id
            is_member = current_user.display_name in room.get("players", [])
            if not (is_host or is_member):
                return redirect("/")  # only the host or a current member may delete
        delete_room(code)
        redis_client.delete(_recorded_key(code))
    return redirect("/")


@app.route("/leave", methods=["POST"])
@login_required
def leave():
    _do_leave(session.get("room"), session.get("player_name"))
    # Leave the room but keep the account logged in.
    session.pop("room", None)
    session.pop("player_name", None)
    return jsonify({"redirect": "/"})


@app.route("/end-room", methods=["POST"])
@login_required
def end_room():
    code = session.get("room")
    player_name = session.get("player_name")

    if not code or not player_name:
        return jsonify({"error": "Not in a room"}), 400

    with room_lock(code):
        room = load_room(code)
        if not room:
            return jsonify({"error": "Room not found"}), 400
        delete_room(code)
        redis_client.delete(_recorded_key(code))

    session.pop("room", None)
    session.pop("player_name", None)
    return jsonify({"status": "Room closed", "redirect": "/"})


@app.route("/game")
@login_required
def game():
    if "player_name" not in session or "room" not in session:
        return redirect("/")
    return render_template("index.html", room_code=session["room"])


@app.route("/state")
@login_required
def state():
    code = session.get("room")
    player_name = session.get("player_name")
    if not code or not player_name:
        return jsonify({"error": "Invalid session"}), 400

    with room_lock(code):
        room = load_room(code)

        if not room or player_name not in room.get("players", []):
            # Drop only room scope — never the login session (polled every 500ms).
            session.pop("room", None)
            session.pop("player_name", None)
            return jsonify({"error": "Invalid session"}), 400

        game = room.get("game")
        if not game:
            return jsonify({"error": "Game not started"}), 400

        if isinstance(game, dict):
            game = Game.deserialize(game)
            room["game"] = game

        changed = False

        # Show the game-over popup once per player, then clear it.
        if game.game_over_notice and player_name not in game.seen_game_over_notice:
            gameOverNotice = game.game_over_notice
            game.seen_game_over_notice.add(player_name)
            changed = True
        else:
            gameOverNotice = None

        # Once everyone still seated has seen it, clear the notice.
        if game.game_over_notice is not None and set(p.name for p in game.players) == game.seen_game_over_notice:
            game.game_over_notice = None
            game.seen_game_over_notice = set()
            changed = True

        # Start next round once everyone still seated has readied. Normally the last
        # /ready-next-round does this in one locked write; this fallback also covers
        # a mid-game leave that completes the remaining players' ready set. Uses
        # reset_for_next_round (the method that exists on game.py) and mirrors the
        # /ready-next-round game-over handling.
        if game.round_ended and game.players and set(p.name for p in game.players) == game.ready_players:
            if game.game_over:
                game.reset_scores()
                redis_client.delete(_recorded_key(code))
            game.reset_for_next_round()
            game.ready_players = set()
            game.round_ended = False
            game.last_action = None
            changed = True

        # Only rewrite the room blob when this poll actually changed state; the
        # common read-only poll just refreshes the TTL. This keeps the lock hold
        # tiny even though /state is polled ~2x/sec per player.
        if changed:
            room["game"] = game.serialize()
            save_room(code, room)
        else:
            redis_client.expire(room_key(code), ROOM_TTL_SECONDS)

    # Build the (larger) JSON response OUTSIDE the lock — `game` is this request's
    # own object, so nothing else mutates it once the lock is released.
    action = getattr(game, "last_action", None)
    if action:
        draw_source = action["draw_source"]
        drew_card = (
            str(action["drawn_card"])
            if draw_source == "pile" or action["player"] == player_name else None
        )
        last_action = {
            "player": action["player"],
            "played": action["played"],
            "drawn_card": drew_card,
            "draw_source": draw_source,
        }
    else:
        last_action = None

    return jsonify({
        "players": [
            {
                "name": p.name,
                "hand": [str(c) for c in sort_hand(p.hand)] if p.name == player_name else len(p.hand),
                "hand_value": p.hand_value() if p.name == player_name else None,
                "score": game.scores.get(p.name, 0),
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
        "gameOver": game.game_over,
        "gameOverNotice": gameOverNotice,
    })


@app.route("/play", methods=["POST"])
@login_required
def handle_play_cards():
    code = session.get("room")
    player_name = session.get("player_name")
    if not code or not player_name:
        return jsonify({"error": "Invalid session", "redirect": "/"}), 400

    data = request.json or {}
    cards_raw = data.get("cards", [])
    draw = data.get("draw")

    # Build Card objects defensively so a malformed payload is a clean 400.
    if not isinstance(cards_raw, list):
        return jsonify({"error": "Invalid cards."}), 400
    try:
        cards = [
            Card("JOKER", s[-1]) if isinstance(s, str) and s.startswith("JOKER")
            else Card(s[:-1], s[-1])
            for s in cards_raw
        ]
    except Exception:
        return jsonify({"error": "Invalid cards."}), 400

    with room_lock(code):
        room = load_room(code)
        if not room or not room.get("game") or player_name not in room.get("players", []):
            return jsonify({"error": "Invalid session", "redirect": "/"}), 400

        game = room["game"]
        if isinstance(game, dict):
            game = Game.deserialize(game)
        room["game"] = game

        # Server-side turn enforcement — the client's enforceTurnLock() is advisory
        # only, so a member could otherwise POST /play out of turn.
        if game.current_player().name != player_name:
            return jsonify({"error": "It's not your turn."}), 400

        try:
            player = next(p for p in game.players if p.name == player_name)
            played, drawn = game.play_cards(player, cards, draw)
            if not (game.is_valid_series(cards) or game.is_valid_set(cards)):
                return jsonify({"error": "Invalid move."}), 400

            game.next_turn()
            game.last_action = {
                "player": player.name,
                "played": [str(c) for c in played],
                "drawn_card": str(drawn),
                "draw_source": draw,
            }
            store_game_in_room(room, game)
            save_room(code, room)
            return jsonify({"status": "OK"})

        except Exception as e:
            return jsonify({"error": str(e)}), 400


@app.route("/end-round", methods=["POST"])
@login_required
def end_round():
    code = session.get("room")
    player = session.get("player_name")
    if not code or not player:
        return jsonify({"error": "Invalid session", "redirect": "/"}), 400

    with room_lock(code):
        room = load_room(code)
        if not room or not room.get("game") or player not in room.get("players", []):
            return jsonify({"error": "Invalid session", "redirect": "/"}), 400

        game = room["game"]
        if isinstance(game, dict):
            game = Game.deserialize(game)
        room["game"] = game  # keep deserialized for now

        # A round may only be ended once — blocks a re-submitted /end-round from
        # re-scoring or double-recording an already-finished game.
        if game.round_ended:
            return jsonify({"error": "Round already ended."}), 400

        # Ending the round is a your-turn action (mirrors the Finish button gate).
        if game.current_player().name != player:
            return jsonify({"error": "It's not your turn."}), 400

        # Enforce the ≤5 Finish rule server-side too, so a hacked/desynced client
        # can't end with a big hand. This reads the engine's own hand_value() —
        # game.py's rules are unchanged, and a legitimate client (whose Finish
        # button is disabled above 5) never trips this.
        if game.current_player().hand_value() > 5:
            return jsonify({"error": "You can only Finish with 5 points or fewer."}), 400

        try:
            hands, hand_values, scores, penalty_applied = game.end_game(player)
            game.round_ended = True
            game.ready_players = set()

            if game.is_game_over():
                game.game_over = True
                game.winners = game.determine_winners()
                game.game_over_notice = build_game_over_notice(game.winners)
                _record_finished_match(code, room, game)
            else:
                game.game_over_notice = None

            game.round_summary_html = build_round_summary_popup(
                round_ender=player,
                hands={p.name: [str(c) for c in sort_hand(p.hand)]
                       for p in game.players},
                hand_values=hand_values,
                scores=scores,
                penalty_applied=penalty_applied,
            )

            room["players"] = [p.name for p in game.players]
            room["game"] = game.serialize()
            save_room(code, room)
            return '', 204

        except Exception as e:
            return jsonify({"error": str(e)}), 400


@app.route("/ready-next-round", methods=["POST"])
@login_required
def ready_next_round():
    code = session.get("room")
    player = session.get("player_name")
    if not code or not player:
        return jsonify({"error": "Missing session"}), 400

    with room_lock(code):
        room = load_room(code)
        if not room or not room.get("game") or player not in room.get("players", []):
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
                redis_client.delete(_recorded_key(code))  # rematch can be recorded
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
