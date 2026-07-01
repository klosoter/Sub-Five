# Sub-Five monolith (Flask + Redis, polling-based game).
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_ENV=production

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Application code
COPY server.py game.py db.py accounts.py ./
COPY templates/ ./templates/
COPY static/ ./static/

EXPOSE 8080

# Rooms/game state live in Redis (shared), so multiple workers are safe.
CMD ["gunicorn", "server:app", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "120"]
