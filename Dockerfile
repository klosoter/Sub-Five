# Stage 1: Build frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Python dependencies
FROM python:3.11-slim AS backend-builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app
COPY requirements.txt ./
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip && pip install -r requirements.txt

# Stage 3: Minimal runtime
FROM python:3.11-slim

ENV PATH="/opt/venv/bin:$PATH"
WORKDIR /app

COPY --from=backend-builder /opt/venv /opt/venv
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080

# Eventlet worker for WebSocket support (single worker required)
CMD ["gunicorn", "-b", "0.0.0.0:8080", "-k", "eventlet", "-w", "1", "backend.wsgi:app"]
