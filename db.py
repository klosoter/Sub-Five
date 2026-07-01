"""SQLite persistence for accounts, match history and stats.

Rooms/live game state stay in Redis (unchanged). This database only holds
durable account and results data. On Fly it lives on a mounted volume so it
survives deploys/restarts — see DATABASE_PATH.
"""
import os
import sqlite3
from flask import g

# Default to a repo-local file for development; production overrides this with a
# path on the mounted Fly volume (e.g. /data/sub_five.db).
DATABASE_PATH = os.environ.get("DATABASE_PATH", "accounts.db")


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    display_name  TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_color  TEXT NOT NULL DEFAULT '#2fd98b',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
    id         TEXT PRIMARY KEY,
    room_code  TEXT NOT NULL,
    ended_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rounds     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS match_players (
    match_id     TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    final_score  INTEGER DEFAULT 0,
    is_winner    INTEGER DEFAULT 0,
    PRIMARY KEY (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_players_user  ON match_players(user_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);

-- Enforce case-insensitive uniqueness of display names atomically at the DB
-- (the column's plain UNIQUE is case-sensitive, so the app-level NOCASE check
-- alone is racy across workers).
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_display_name_nocase ON users(display_name COLLATE NOCASE);
"""


def get_db():
    """Return the request-scoped SQLite connection, opening it if needed."""
    if "db" not in g:
        conn = sqlite3.connect(DATABASE_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        # Wait/retry up to 5s instead of failing instantly if another worker holds
        # a write lock (2 gunicorn workers share this file).
        conn.execute("PRAGMA busy_timeout=5000")
        conn.execute("PRAGMA foreign_keys=ON")
        g.db = conn
    return g.db


def close_db(exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(app):
    """Create tables if they don't exist. Safe to call on every boot."""
    # Ensure the parent directory (e.g. the mounted volume) exists.
    parent = os.path.dirname(os.path.abspath(DATABASE_PATH))
    os.makedirs(parent, exist_ok=True)
    with app.app_context():
        db = get_db()
        db.executescript(SCHEMA)
        # Lightweight migration for DBs created before a column was added.
        cols = {r[1] for r in db.execute("PRAGMA table_info(users)").fetchall()}
        if "avatar_color" not in cols:
            db.execute("ALTER TABLE users ADD COLUMN avatar_color TEXT NOT NULL DEFAULT '#2fd98b'")
        db.commit()
        close_db()
    app.teardown_appcontext(close_db)
