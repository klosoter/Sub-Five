"""CLI entry point for training the Sub-Five RL agent.

Usage:
    python -m backend.engine.rl.train --phase imitate --games 10000 --save models/subfive_imitate.pt
    python -m backend.engine.rl.train --phase selfplay --games 100000 --resume models/subfive_imitate.pt --save models/subfive_rl.pt
    python -m backend.engine.rl.train --phase eval --model models/subfive_rl.pt --games 500
"""
import argparse
import os
import torch
from .network import SubFiveNetwork
from .trainer import ImitationTrainer, PPOTrainer, evaluate_vs_heuristic


def main():
    parser = argparse.ArgumentParser(description="Train Sub-Five RL agent")
    parser.add_argument("--phase", choices=["imitate", "selfplay", "eval"],
                        required=True, help="Training phase")
    parser.add_argument("--games", type=int, default=10000,
                        help="Number of games to train/evaluate")
    parser.add_argument("--save", type=str, default=None,
                        help="Path to save model")
    parser.add_argument("--resume", type=str, default=None,
                        help="Path to resume from existing model")
    parser.add_argument("--model", type=str, default=None,
                        help="Path to model for evaluation")
    parser.add_argument("--players", type=int, default=3,
                        help="Number of players (2-4)")
    parser.add_argument("--lr", type=float, default=None,
                        help="Learning rate")
    args = parser.parse_args()

    # Create or load network
    network = SubFiveNetwork()
    model_path = args.resume or args.model
    if model_path and os.path.exists(model_path):
        network.load_state_dict(torch.load(model_path, weights_only=True))
        print(f"Loaded model from {model_path}")

    if args.phase == "imitate":
        lr = args.lr or 1e-3
        print(f"=== Imitation Training: {args.games} games, lr={lr} ===")
        trainer = ImitationTrainer(network, lr=lr)

        print("Collecting heuristic bot data...")
        samples = trainer.collect_data(num_games=args.games, num_players=args.players)
        print(f"Collected {len(samples)} training samples")

        save_path = args.save or "models/subfive_imitate.pt"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        print("Training...")
        trainer.train(samples, save_path=save_path)

        # Quick eval
        win_rate = evaluate_vs_heuristic(network, num_games=100, num_players=args.players)
        print(f"Win rate vs heuristic: {win_rate:.1%}")

    elif args.phase == "selfplay":
        lr = args.lr or 3e-4
        print(f"=== PPO Self-Play: {args.games} games, lr={lr} ===")
        trainer = PPOTrainer(network, lr=lr)

        save_path = args.save or "models/subfive_rl.pt"
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        trainer.train(
            total_games=args.games,
            games_per_iter=64,
            eval_interval=50,
            num_players=args.players,
            save_path=save_path,
        )

        print(f"Training complete. Model saved to {save_path}")

    elif args.phase == "eval":
        print(f"=== Evaluation: {args.games} games ===")
        win_rate = evaluate_vs_heuristic(
            network, num_games=args.games, num_players=args.players
        )
        print(f"Win rate vs heuristic: {win_rate:.1%}")


if __name__ == "__main__":
    main()
