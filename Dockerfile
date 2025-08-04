# Stage 1: Build environment with dependencies
FROM python:3.11.13-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements.txt ./
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Stage 2: Minimal runtime image
FROM python:3.11.13-slim

ENV PATH="/opt/venv/bin:$PATH"
WORKDIR /app

# Copy virtual environment and app files
COPY --from=builder /opt/venv /opt/venv
COPY . .

# Optional: expose port (for local dev)
EXPOSE 8080

# Launch with Gunicorn (server:app = server.py with app = Flask(...))
CMD ["gunicorn", "-b", "0.0.0.0:8080", "server:app"]
