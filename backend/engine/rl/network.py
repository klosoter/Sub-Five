"""Actor-critic neural network for Sub-Five RL agent.

Architecture:
- State encoder: maps game state to embedding
- Action scorer: maps each candidate action to embedding, dot-product with state for score
- Value head: estimates expected return from state

Handles variable action counts via score-per-action with softmax masking.
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from .encoding import STATE_DIM, ACTION_DIM


class SubFiveNetwork(nn.Module):
    """Actor-critic network with action scoring for variable action spaces."""

    def __init__(self, state_dim: int = STATE_DIM, action_dim: int = ACTION_DIM,
                 hidden: int = 256, embed: int = 128):
        super().__init__()

        # State encoder: state_dim -> embed
        self.state_encoder = nn.Sequential(
            nn.Linear(state_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, embed),
            nn.ReLU(),
        )

        # Action encoder: action_dim -> embed
        self.action_encoder = nn.Sequential(
            nn.Linear(action_dim, 64),
            nn.ReLU(),
            nn.Linear(64, embed),
        )

        # Value head: embed -> 1
        self.value_head = nn.Sequential(
            nn.Linear(embed, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
        )

    def _encode_state(self, state: torch.Tensor) -> torch.Tensor:
        """Encode state(s). Input: (..., state_dim), output: (..., embed)."""
        return self.state_encoder(state)

    def _encode_actions(self, actions: torch.Tensor) -> torch.Tensor:
        """Encode action(s). Input: (..., action_dim), output: (..., embed)."""
        return self.action_encoder(actions)

    def forward(self, state: torch.Tensor, actions: torch.Tensor):
        """Compute action scores and state value.

        Args:
            state: (batch, state_dim) or (state_dim,)
            actions: (batch, num_actions, action_dim) or (num_actions, action_dim)

        Returns:
            scores: (batch, num_actions) or (num_actions,) — raw logits per action
            value: (batch, 1) or (1,) — state value estimate
        """
        single = state.dim() == 1
        if single:
            state = state.unsqueeze(0)
            actions = actions.unsqueeze(0)

        state_embed = self._encode_state(state)  # (batch, embed)
        action_embed = self._encode_actions(actions)  # (batch, num_actions, embed)

        # Score = dot product of state embedding with each action embedding
        scores = torch.bmm(
            action_embed, state_embed.unsqueeze(-1)
        ).squeeze(-1)  # (batch, num_actions)

        value = self.value_head(state_embed)  # (batch, 1)

        if single:
            scores = scores.squeeze(0)
            value = value.squeeze(0)

        return scores, value

    def get_policy(self, state: torch.Tensor, actions: torch.Tensor,
                   num_valid: int | None = None) -> tuple[torch.Tensor, torch.Tensor]:
        """Get action probabilities and value.

        Args:
            state: (state_dim,) single state
            actions: (num_actions, action_dim) candidate actions
            num_valid: if set, only first num_valid actions are valid (rest masked)

        Returns:
            probs: (num_actions,) action probabilities
            value: scalar value estimate
        """
        scores, value = self.forward(state, actions)

        if num_valid is not None and num_valid < scores.shape[-1]:
            mask = torch.full_like(scores, float('-inf'))
            mask[:num_valid] = 0.0
            scores = scores + mask

        probs = F.softmax(scores, dim=-1)
        return probs, value.squeeze(-1)

    def select_action(self, state: torch.Tensor, actions: torch.Tensor,
                      deterministic: bool = False):
        """Select an action, returning index, log_prob, and value.

        Args:
            state: (state_dim,) observation
            actions: (num_actions, action_dim) candidate action encodings
            deterministic: if True, pick argmax instead of sampling

        Returns:
            action_idx: int
            log_prob: scalar tensor
            value: scalar tensor
        """
        with torch.no_grad():
            scores, value = self.forward(state, actions)
            probs = F.softmax(scores, dim=-1)

            if deterministic:
                action_idx = probs.argmax().item()
            else:
                action_idx = torch.multinomial(probs, 1).item()

            log_prob = torch.log(probs[action_idx] + 1e-8)

        return action_idx, log_prob, value.squeeze(-1)

    def evaluate_action(self, state: torch.Tensor, actions: torch.Tensor,
                        action_idx: int) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """Evaluate a previously taken action (for PPO update).

        Args:
            state: (state_dim,)
            actions: (num_actions, action_dim)
            action_idx: which action was taken

        Returns:
            log_prob: log probability of the action under current policy
            value: state value estimate
            entropy: policy entropy (for exploration bonus)
        """
        scores, value = self.forward(state, actions)
        probs = F.softmax(scores, dim=-1)
        log_probs = torch.log(probs + 1e-8)

        log_prob = log_probs[action_idx]
        entropy = -(probs * log_probs).sum()

        return log_prob, value.squeeze(-1), entropy
