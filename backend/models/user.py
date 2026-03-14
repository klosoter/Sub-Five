"""User model for auth and stats."""
import uuid
import bcrypt
from flask_login import UserMixin
from .database import get_db


class User(UserMixin):
    def __init__(self, id, username, display_name, is_guest=False):
        self.id = id
        self.username = username
        self.display_name = display_name
        self.is_guest = is_guest

    def get_id(self):
        return self.id

    @staticmethod
    def create(username, password, display_name):
        db = get_db()
        user_id = str(uuid.uuid4())
        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        try:
            db.execute(
                "INSERT INTO users (id, username, password_hash, display_name, is_guest) VALUES (?, ?, ?, ?, 0)",
                (user_id, username.lower(), pw_hash, display_name)
            )
            db.commit()
            return User(user_id, username.lower(), display_name, False)
        except Exception:
            return None

    @staticmethod
    def create_guest(display_name):
        db = get_db()
        user_id = str(uuid.uuid4())
        try:
            db.execute(
                "INSERT INTO users (id, username, display_name, is_guest) VALUES (?, ?, ?, 1)",
                (user_id, None, display_name)
            )
            db.commit()
            return User(user_id, None, display_name, True)
        except Exception:
            return None

    @staticmethod
    def authenticate(username, password):
        db = get_db()
        row = db.execute(
            "SELECT id, username, password_hash, display_name, is_guest FROM users WHERE username = ?",
            (username.lower(),)
        ).fetchone()
        if not row or not row['password_hash']:
            return None
        if bcrypt.checkpw(password.encode(), row['password_hash'].encode()):
            return User(row['id'], row['username'], row['display_name'], bool(row['is_guest']))
        return None

    @staticmethod
    def get_by_id(user_id):
        db = get_db()
        row = db.execute(
            "SELECT id, username, display_name, is_guest FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()
        if row:
            return User(row['id'], row['username'], row['display_name'], bool(row['is_guest']))
        return None

    def get_stats(self):
        db = get_db()
        rows = db.execute("""
            SELECT
                COUNT(*) as games_played,
                SUM(is_winner) as games_won,
                SUM(penalties_received) as total_penalties,
                MIN(final_score) as best_score
            FROM match_players WHERE user_id = ?
        """, (self.id,)).fetchone()
        return dict(rows) if rows else {}

    @staticmethod
    def leaderboard(limit=20):
        db = get_db()
        rows = db.execute("""
            SELECT
                u.display_name,
                COUNT(mp.match_id) as games_played,
                SUM(mp.is_winner) as wins,
                ROUND(100.0 * SUM(mp.is_winner) / MAX(COUNT(mp.match_id), 1), 1) as win_rate
            FROM users u
            JOIN match_players mp ON u.id = mp.user_id
            WHERE u.is_guest = 0
            GROUP BY u.id
            HAVING games_played >= 3
            ORDER BY win_rate DESC, wins DESC
            LIMIT ?
        """, (limit,)).fetchall()
        return [dict(r) for r in rows]

    def update_last_seen(self):
        db = get_db()
        db.execute("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?", (self.id,))
        db.commit()
