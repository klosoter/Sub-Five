"""Match history and statistics."""
import uuid
from .database import get_db


def record_match(room_code, players_data, rounds_played):
    """Record a completed match.

    players_data: list of dicts with keys: user_id, display_name, final_score, rounds_won, penalties, is_winner
    """
    db = get_db()
    match_id = str(uuid.uuid4())

    db.execute(
        "INSERT INTO matches (id, room_code, ended_at, rounds) VALUES (?, ?, CURRENT_TIMESTAMP, ?)",
        (match_id, room_code, rounds_played)
    )

    for p in players_data:
        db.execute("""
            INSERT INTO match_players (match_id, user_id, display_name, final_score, rounds_won, penalties_received, is_winner)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            match_id,
            p.get('user_id', str(uuid.uuid4())),
            p['display_name'],
            p.get('final_score', 0),
            p.get('rounds_won', 0),
            p.get('penalties', 0),
            1 if p.get('is_winner') else 0,
        ))

    db.commit()
    return match_id


def get_match_history(user_id, limit=20):
    db = get_db()
    rows = db.execute("""
        SELECT
            m.id, m.room_code, m.ended_at, m.rounds,
            mp.final_score, mp.is_winner,
            GROUP_CONCAT(mp2.display_name, ', ') as all_players
        FROM match_players mp
        JOIN matches m ON m.id = mp.match_id
        JOIN match_players mp2 ON mp2.match_id = m.id
        WHERE mp.user_id = ?
        GROUP BY m.id
        ORDER BY m.ended_at DESC
        LIMIT ?
    """, (user_id, limit)).fetchall()
    return [dict(r) for r in rows]
