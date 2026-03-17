#!/bin/bash
# Sub-Five RL Bot Training
# Usage:
#   ./train.sh              — full pipeline (imitate then selfplay)
#   ./train.sh imitate      — imitation learning only
#   ./train.sh selfplay     — self-play PPO only (requires imitate model)
#   ./train.sh eval         — evaluate current model vs heuristic
#   ./train.sh resume       — resume interrupted selfplay

set -e
cd "$(dirname "$0")"

# Use project venv
source .venv/bin/activate

MODELS_DIR="models"
IMITATE_MODEL="$MODELS_DIR/subfive_imitate.pt"
RL_MODEL="$MODELS_DIR/subfive_rl.pt"

mkdir -p "$MODELS_DIR"

phase="${1:-full}"

imitate() {
    echo "=== Phase 1: Imitation Learning ==="
    echo "Learning from heuristic bot (10,000 games)..."
    python3 -m backend.engine.rl.train \
        --phase imitate \
        --games 10000 \
        --save "$IMITATE_MODEL"
    echo "Saved to $IMITATE_MODEL"
}

selfplay() {
    local resume_from="$IMITATE_MODEL"
    if [ -f "$RL_MODEL" ]; then
        resume_from="$RL_MODEL"
        echo "Resuming from existing $RL_MODEL"
    elif [ ! -f "$IMITATE_MODEL" ]; then
        echo "Error: No model to resume from. Run './train.sh imitate' first."
        exit 1
    fi

    echo "=== Phase 2: Self-Play PPO ==="
    echo "Training via self-play (100,000 games)..."
    python3 -m backend.engine.rl.train \
        --phase selfplay \
        --games 100000 \
        --resume "$resume_from" \
        --save "$RL_MODEL"
    echo "Saved to $RL_MODEL"
}

evaluate() {
    local model="$RL_MODEL"
    if [ ! -f "$model" ]; then
        model="$IMITATE_MODEL"
    fi
    if [ ! -f "$model" ]; then
        echo "Error: No model found. Train first."
        exit 1
    fi

    echo "=== Evaluating $model ==="
    python3 -m backend.engine.rl.train \
        --phase eval \
        --model "$model" \
        --games 500
}

case "$phase" in
    imitate)
        imitate
        ;;
    selfplay)
        selfplay
        ;;
    resume)
        selfplay
        ;;
    eval)
        evaluate
        ;;
    full)
        imitate
        selfplay
        evaluate
        ;;
    *)
        echo "Usage: ./train.sh [imitate|selfplay|resume|eval|full]"
        exit 1
        ;;
esac
