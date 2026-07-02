"""User accounts, authentication, match recording and stats.

Backed by SQLite (see db.py). Passwords are hashed with bcrypt. The User class
implements Flask-Login's UserMixin so it plugs straight into login_user /
current_user / @login_required.
"""
import re
import sqlite3
import uuid
import bcrypt
from flask_login import UserMixin

from db import get_db

USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,20}$")
DISPLAY_NAME_RE = re.compile(r"^[a-zA-Z0-9 _\-]{2,20}$")
PASSWORD_MIN_LENGTH = 8

# Selectable avatar colours (account setting).
AVATAR_COLORS = ["#2fd98b", "#8fd4ff", "#ffadad", "#ffe083", "#d1aaff", "#f4c75a", "#ff9f68", "#c792ea"]
DEFAULT_AVATAR_COLOR = AVATAR_COLORS[0]

# Precomputed once so authenticate() does equal bcrypt work whether or not the
# username exists — avoids a timing oracle for account enumeration.
_DUMMY_HASH = bcrypt.hashpw(b"timing-equalizer", bcrypt.gensalt()).decode()


class ValidationError(Exception):
    """Raised for user-facing registration/login validation problems."""


class User(UserMixin):
    def __init__(self, id, username, display_name, avatar_color=DEFAULT_AVATAR_COLOR):
        self.id = id
        self.username = username
        self.display_name = display_name
        self.avatar_color = avatar_color or DEFAULT_AVATAR_COLOR

    def get_id(self):
        return self.id

    # ---- lookups -------------------------------------------------------
    @staticmethod
    def _from_row(row):
        if not row:
            return None
        color = row["avatar_color"] if "avatar_color" in row.keys() else DEFAULT_AVATAR_COLOR
        return User(row["id"], row["username"], row["display_name"], color)

    @staticmethod
    def get_by_id(user_id):
        row = get_db().execute(
            "SELECT id, username, display_name, avatar_color FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        return User._from_row(row)

    @staticmethod
    def get_by_username(username):
        row = get_db().execute(
            "SELECT id, username, display_name, avatar_color FROM users WHERE username = ?",
            (username.lower(),),
        ).fetchone()
        return User._from_row(row)

    # ---- registration / login -----------------------------------------
    @staticmethod
    def register(username, password, display_name=None):
        """Create a new account. Raises ValidationError on bad input or clashes."""
        username = (username or "").strip()
        display_name = (display_name or "").strip() or username

        if not USERNAME_RE.match(username):
            raise ValidationError("Username must be 3-20 letters, numbers or underscores.")
        if len(password or "") < PASSWORD_MIN_LENGTH:
            raise ValidationError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters.")
        if not DISPLAY_NAME_RE.match(display_name):
            raise ValidationError("Display name must be 2-20 letters, numbers, spaces, - or _.")

        db = get_db()
        if db.execute("SELECT 1 FROM users WHERE username = ?", (username.lower(),)).fetchone():
            raise ValidationError("That username is already taken.")
        # Display name must be unique so in-room seats never collide.
        if db.execute(
            "SELECT 1 FROM users WHERE display_name = ? COLLATE NOCASE", (display_name,)
        ).fetchone():
            raise ValidationError("That display name is already in use.")

        user_id = str(uuid.uuid4())
        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        try:
            db.execute(
                "INSERT INTO users (id, username, display_name, password_hash) VALUES (?, ?, ?, ?)",
                (user_id, username.lower(), display_name, pw_hash),
            )
            db.commit()
        except sqlite3.IntegrityError:
            # Loser of a concurrent same-name registration (the DB UNIQUE
            # constraints are the real guard; the SELECTs above are best-effort).
            db.rollback()
            raise ValidationError("That username or display name is already in use.")
        return User(user_id, username.lower(), display_name)

    @staticmethod
    def authenticate(username, password):
        """Return the User on valid credentials, else None."""
        row = get_db().execute(
            "SELECT id, username, display_name, password_hash, avatar_color FROM users WHERE username = ?",
            ((username or "").strip().lower(),),
        ).fetchone()
        if not row:
            # Do equal work on the miss path so response time doesn't reveal
            # whether the username exists.
            bcrypt.checkpw((password or "").encode(), _DUMMY_HASH.encode())
            return None
        try:
            ok = bcrypt.checkpw((password or "").encode(), row["password_hash"].encode())
        except (ValueError, AttributeError):
            return None
        return User._from_row(row) if ok else None

    def touch(self):
        db = get_db()
        db.execute("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?", (self.id,))
        db.commit()

    # ---- self-service account changes -------------------------------
    def change_display_name(self, new_name):
        new_name = (new_name or "").strip()
        if not DISPLAY_NAME_RE.match(new_name):
            raise ValidationError("Display name must be 2-20 letters, numbers, spaces, - or _.")
        if new_name == self.display_name:
            return
        db = get_db()
        if db.execute(
            "SELECT 1 FROM users WHERE display_name = ? COLLATE NOCASE AND id != ?",
            (new_name, self.id),
        ).fetchone():
            raise ValidationError("That display name is already in use.")
        try:
            db.execute("UPDATE users SET display_name = ? WHERE id = ?", (new_name, self.id))
            db.commit()
        except sqlite3.IntegrityError:
            db.rollback()
            raise ValidationError("That display name is already in use.")
        self.display_name = new_name

    def change_password(self, current_password, new_password):
        if len(new_password or "") < PASSWORD_MIN_LENGTH:
            raise ValidationError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters.")
        db = get_db()
        row = db.execute("SELECT password_hash FROM users WHERE id = ?", (self.id,)).fetchone()
        try:
            ok = row and bcrypt.checkpw((current_password or "").encode(), row["password_hash"].encode())
        except (ValueError, AttributeError):
            ok = False
        if not ok:
            raise ValidationError("Current password is incorrect.")
        new_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, self.id))
        db.commit()

    def change_avatar_color(self, color):
        if color not in AVATAR_COLORS:
            raise ValidationError("Please pick one of the available colours.")
        db = get_db()
        db.execute("UPDATE users SET avatar_color = ? WHERE id = ?", (color, self.id))
        db.commit()
        self.avatar_color = color

    # ---- admin helpers ----------------------------------------------
    @staticmethod
    def all_users(limit=500):
        rows = get_db().execute(
            """
            SELECT u.id, u.username, u.display_name, u.created_at, u.last_seen,
                   COUNT(mp.match_id) AS games, COALESCE(SUM(mp.is_winner), 0) AS wins
            FROM users u
            LEFT JOIN match_players mp ON mp.user_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]

    @staticmethod
    def delete_user(user_id):
        db = get_db()
        # match_players cascade via ON DELETE CASCADE (foreign_keys=ON per connection)
        db.execute("DELETE FROM users WHERE id = ?", (user_id,))
        db.commit()

    # ---- stats ---------------------------------------------------------
    def stats(self):
        row = get_db().execute(
            """
            SELECT COUNT(*)                                  AS games_played,
                   COALESCE(SUM(is_winner), 0)               AS games_won,
                   MIN(final_score)                          AS best_score
            FROM match_players WHERE user_id = ?
            """,
            (self.id,),
        ).fetchone()
        games = row["games_played"] or 0
        wins = row["games_won"] or 0
        return {
            "games_played": games,
            "games_won": wins,
            "win_rate": round(100.0 * wins / games, 1) if games else 0.0,
            "best_score": row["best_score"],  # None until they finish a game
        }

    def match_history(self, limit=10):
        rows = get_db().execute(
            """
            SELECT m.room_code, m.ended_at, m.rounds,
                   mp.final_score, mp.is_winner,
                   (SELECT GROUP_CONCAT(o.display_name || ' (' || o.final_score || ')', ', ')
                    FROM match_players o WHERE o.match_id = m.id AND o.user_id != ?) AS opponents,
                   (SELECT w.display_name FROM match_players w
                    WHERE w.match_id = m.id AND w.is_winner = 1 LIMIT 1) AS winner
            FROM match_players mp
            JOIN matches m ON m.id = mp.match_id
            WHERE mp.user_id = ?
            ORDER BY m.ended_at DESC, m.rowid DESC
            LIMIT ?
            """,
            (self.id, self.id, limit),
        ).fetchall()
        return [dict(r) for r in rows]


def leaderboard(limit=20, min_games=1):
    """Top players by wins then win-rate. Only counts users with >= min_games."""
    rows = get_db().execute(
        """
        SELECT u.display_name,
               COUNT(mp.match_id)                                          AS games_played,
               COALESCE(SUM(mp.is_winner), 0)                              AS wins,
               ROUND(100.0 * COALESCE(SUM(mp.is_winner), 0)
                     / COUNT(mp.match_id), 1)                              AS win_rate,
               MIN(mp.final_score)                                         AS best_score
        FROM users u
        JOIN match_players mp ON mp.user_id = u.id
        GROUP BY u.id
        HAVING games_played >= ?
        ORDER BY wins DESC, win_rate DESC, best_score ASC
        LIMIT ?
        """,
        (min_games, limit),
    ).fetchall()
    return [dict(r) for r in rows]


def record_match(room_code, players, rounds_played=0):
    """Persist a finished match.

    players: list of dicts {user_id, display_name, final_score, is_winner}.
    Entries without a user_id (e.g. any non-account seat) are skipped so match
    stats only ever attribute to real accounts.
    """
    accounted = [p for p in players if p.get("user_id")]
    if not accounted:
        return None

    db = get_db()
    match_id = str(uuid.uuid4())
    db.execute(
        "INSERT INTO matches (id, room_code, rounds) VALUES (?, ?, ?)",
        (match_id, room_code, rounds_played),
    )
    for p in accounted:
        db.execute(
            """
            INSERT OR IGNORE INTO match_players
                (match_id, user_id, display_name, final_score, is_winner)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                match_id,
                p["user_id"],
                p.get("display_name", ""),
                int(p.get("final_score", 0)),
                1 if p.get("is_winner") else 0,
            ),
        )
    db.commit()
    return match_id


# ---- admin match-history management --------------------------------------
# Stats, wins, the leaderboard and profile history are all derived from the
# matches / match_players tables, so deleting match rows resets those records.

def recent_matches(limit=100):
    """Recent finished matches for the admin panel, newest first."""
    rows = get_db().execute(
        """
        SELECT m.id, m.room_code, m.ended_at, m.rounds,
               (SELECT GROUP_CONCAT(mp.display_name || ' (' || mp.final_score || ')', ', ')
                FROM match_players mp WHERE mp.match_id = m.id) AS players,
               (SELECT w.display_name FROM match_players w
                WHERE w.match_id = m.id AND w.is_winner = 1 LIMIT 1) AS winner
        FROM matches m
        ORDER BY m.ended_at DESC, m.rowid DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    return [dict(r) for r in rows]


def delete_match(match_id):
    """Delete a single match; its match_players rows cascade away."""
    db = get_db()
    db.execute("DELETE FROM matches WHERE id = ?", (match_id,))
    db.commit()


def clear_all_matches():
    """Wipe ALL match history — resets every player's stats and the leaderboard.
    Accounts themselves are untouched. Returns the number of matches removed."""
    db = get_db()
    n = db.execute("SELECT COUNT(*) AS c FROM matches").fetchone()["c"]
    # Delete both tables explicitly so it works even if FK cascade were ever off.
    db.execute("DELETE FROM match_players")
    db.execute("DELETE FROM matches")
    db.commit()
    return n
