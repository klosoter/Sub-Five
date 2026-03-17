import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './card-element.js';
import './card-hand.js';
import './opponent-hand.js';
import './deck-pile.js';
import './action-log.js';

type SpectatorPlayer = {
  name: string;
  hand: string[];
  hand_value: number;
  score: number;
};

type SpectatorState = {
  players: SpectatorPlayer[];
  pileTop: string | null;
  deckCount: number;
  currentPlayer: string;
  roundEnded: boolean;
  gameOver: boolean;
  scores: Record<string, number>;
  lastAction: any;
  round: number;
  roundData?: any;
  winners?: [string, number][];
};

type LogEntry = {
  player: string;
  score: number;
  color: string;
  items: { type: string; cards: string[] }[];
};

const PLAYER_COLORS = ['#8fd4ff', '#ffadad', '#ffe083', '#afffaf', '#d1aaff'];
const SEAT_POSITIONS: ('bottom' | 'left' | 'right' | 'top')[] = ['bottom', 'left', 'right', 'top'];

@customElement('spectator-page')
export class SpectatorPage extends LitElement {
  @property() roomCode = '';

  @state() private gameState: SpectatorState | null = null;
  @state() private actionLog: LogEntry[] = [];
  @state() private speed = 1.0; // seconds between turns
  @state() private paused = false;
  @state() private botThinking = false;
  @state() private error = '';

  private pollTimer?: number;
  private botTimer?: number;
  private lastActionId = '';
  private started = false;

  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background: radial-gradient(circle, #065c2f 60%, #003d1f 100%);
      background-color: #003d1f;
    }

    .game-wrapper {
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      aspect-ratio: 20 / 9;
      max-width: calc(100vh * (20 / 9));
      max-height: calc(100vw / (20 / 9));
      overflow: hidden;
    }

    .game-container {
      width: 100%;
      height: 100%;
      display: flex;
      position: relative;
      align-items: center;
      justify-content: center;
    }

    .game-table {
      aspect-ratio: 2 / 1;
      margin: 0 auto;
      width: 77vw;
      background: radial-gradient(ellipse at center, #155d25 60%, #0f3c17 100%);
      border: 0.8vw solid #3b1e0d;
      border-radius: 20vw;
      box-shadow: inset 0 0 4vw rgb(0 0 0 / 60%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin-right: 19.5vw;
    }

    /* Bottom player uses card-hand component, same as regular game */
    .player-area {
      position: absolute;
      bottom: 2%;
      left: 50%;
      transform: translateX(-50%);
    }

    /* Controls bar at top */
    .controls {
      position: absolute;
      top: 2%;
      left: 2%;
      z-index: 10;
      display: flex;
      gap: 0.5vw;
      align-items: center;
    }

    button {
      padding: 0.6vw 1.2vw;
      font-size: 1vw;
      cursor: pointer;
      background: #333;
      color: white;
      border: 0.1vw solid #666;
      border-radius: 0.4vw;
      transition: background 0.2s;
    }
    button:hover { filter: brightness(1.1); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    .speed-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 1vw;
      margin-left: 0.5vw;
    }

    .round-label {
      position: absolute;
      top: 2%;
      right: 22%;
      z-index: 10;
      color: rgba(255, 255, 255, 0.7);
      font-size: 1.2vw;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.4vw 1vw;
      border-radius: 0.4vw;
    }

    .bot-thinking {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.2vw;
      color: rgba(255, 255, 255, 0.5);
      z-index: 5;
      animation: pulse 1s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.8; }
    }

    /* Round ended overlay */
    .round-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .round-panel {
      background: #1a1a2e;
      border: 1px solid #444;
      border-radius: 1vw;
      padding: 2vw 3vw;
      color: white;
      text-align: center;
      min-width: 25vw;
    }

    .round-panel h2 {
      margin: 0 0 1vw;
      font-size: 2vw;
    }

    .round-results {
      text-align: left;
      font-size: 1.2vw;
      margin-bottom: 1.5vw;
    }

    .round-results .player-row {
      display: flex;
      justify-content: space-between;
      padding: 0.3vw 0;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .round-results .player-row.ender {
      color: #fbbf24;
    }

    .round-results .penalty {
      color: #ef4444;
    }

    .btn-next {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #052e16;
      font-size: 1.3vw;
      padding: 0.8vw 2vw;
      border: none;
      border-radius: 0.4vw;
      cursor: pointer;
      font-weight: 600;
    }

    .game-over-panel h2 {
      color: #fbbf24;
    }

    .error-toast {
      position: fixed;
      top: 2vw;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(239, 68, 68, 0.95);
      color: white;
      padding: 1vw 3vw;
      border-radius: 0.5vw;
      font-size: 1.8vw;
      font-weight: bold;
      z-index: 9999;
    }

    .back-btn {
      position: absolute;
      top: 2%;
      right: 2%;
      z-index: 10;
      background: rgba(150, 22, 22, 0.8);
      border: 0.1vw solid #700;
      font-size: 1.2vw;
      padding: 0.6vw 1.2vw;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (this.roomCode) {
      this.startFetching();
    }
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has('roomCode') && this.roomCode && !this.started) {
      this.startFetching();
    }
  }

  private startFetching() {
    this.started = true;
    this.fetchState();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.botTimer) clearTimeout(this.botTimer);
  }

  private retryCount = 0;

  private async fetchState() {
    try {
      const url = `/api/dev/spectate/${this.roomCode}`;
      console.log('[spectator] fetching:', url);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.text();
        console.error('[spectator] error:', res.status, body);
        this.retryCount++;
        if (this.retryCount > 5) {
          window.location.hash = '#/';
          return;
        }
        // Retry — room may still be saving
        this.pollTimer = window.setTimeout(() => this.fetchState(), 1000);
        return;
      }
      this.retryCount = 0;
      this.error = '';
      const data: SpectatorState = await res.json();
      this.gameState = data;

      // Log new actions
      if (data.lastAction) {
        const actionId = JSON.stringify(data.lastAction);
        if (actionId !== this.lastActionId) {
          this.lastActionId = actionId;
          this.addLogEntry(data.lastAction, data);
        }
      }

      // Auto-advance if it's a bot's turn and not paused
      if (!data.roundEnded && !data.gameOver && !this.paused) {
        this.scheduleBotAction();
      }
    } catch (e) {
      console.error('[spectator] fetch error:', e);
      this.retryCount++;
      if (this.retryCount > 5) {
        window.location.hash = '#/';
        return;
      }
    }

    // Keep polling for state updates
    this.pollTimer = window.setTimeout(() => this.fetchState(), 1500);
  }

  private scheduleBotAction() {
    if (this.botTimer) return; // already scheduled
    this.botThinking = true;
    this.botTimer = window.setTimeout(() => {
      this.botTimer = undefined;
      this.triggerBotAction();
    }, this.speed * 1000);
  }

  private async triggerBotAction() {
    try {
      const res = await fetch(`/api/dev/bot-action/${this.roomCode}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        // Immediately fetch updated state
        const stateRes = await fetch(`/api/dev/spectate/${this.roomCode}`, { credentials: 'include' });
        if (stateRes.ok) {
          const data: SpectatorState = await stateRes.json();
          this.gameState = data;

          if (data.lastAction) {
            const actionId = JSON.stringify(data.lastAction);
            if (actionId !== this.lastActionId) {
              this.lastActionId = actionId;
              this.addLogEntry(data.lastAction, data);
            }
          }
        }
      }
    } catch { /* ignore */ }
    this.botThinking = false;
  }

  private addLogEntry(action: any, data: SpectatorState) {
    const entry: LogEntry = {
      player: action.player,
      score: data.scores[action.player] ?? 0,
      color: this.getPlayerColor(action.player),
      items: [],
    };

    if (action.played?.length) {
      entry.items.push({ type: 'played', cards: action.played });
    }
    if (action.draw_source === 'pile' && action.drawn_card) {
      entry.items.push({ type: 'drew from pile', cards: [action.drawn_card] });
    } else if (action.draw_source === 'deck' && action.drawn_card) {
      entry.items.push({ type: 'drew from deck', cards: [action.drawn_card] });
    }

    const maxEntries = Math.max((data.players?.length ?? 3) * 2, 6);
    this.actionLog = [...this.actionLog, entry];
    if (this.actionLog.length > maxEntries) {
      this.actionLog = this.actionLog.slice(this.actionLog.length - maxEntries);
    }
  }

  private getPlayerColor(name: string): string {
    const idx = this.gameState?.players.findIndex(p => p.name === name) ?? 0;
    return PLAYER_COLORS[idx % PLAYER_COLORS.length];
  }

  private setSpeed(s: number) {
    this.speed = s;
  }

  private togglePause() {
    this.paused = !this.paused;
    if (!this.paused && this.gameState && !this.gameState.roundEnded && !this.gameState.gameOver) {
      this.scheduleBotAction();
    } else if (this.paused && this.botTimer) {
      clearTimeout(this.botTimer);
      this.botTimer = undefined;
      this.botThinking = false;
    }
  }

  private async nextRound() {
    try {
      await fetch(`/api/dev/spectate-ready/${this.roomCode}`, {
        method: 'POST',
        credentials: 'include',
      });
      this.actionLog = [];
      this.lastActionId = '';
    } catch { /* ignore */ }
  }

  private goBack() {
    window.location.hash = '#/';
  }

  render() {
    if (this.error) {
      return html`
        <div style="color: white; font-size: 2vw; text-align: center; padding-top: 20vh;">
          <div style="font-size: 3vw; margin-bottom: 1vw;">${this.error}</div>
          <div style="font-size: 1.2vw; color: rgba(255,255,255,0.5); margin-bottom: 2vw;">
            Room: ${this.roomCode || '(none)'}
          </div>
          <button @click=${this.goBack} style="padding: 0.8vw 2vw; font-size: 1.3vw; background: #333; color: white; border: 1px solid #666; border-radius: 0.4vw; cursor: pointer;">
            Back to Lobby
          </button>
        </div>
      `;
    }
    if (!this.gameState) {
      return html`<div style="color: white; font-size: 2vw; text-align: center;">Loading...</div>`;
    }

    const gs = this.gameState;
    const players = gs.players;

    // Position players: first at bottom, rest at left/right/top
    const bottomPlayer = players[0];
    const otherPlayers = players.slice(1);

    const lastPlayed = this.actionLog.length > 0
      ? this.actionLog[this.actionLog.length - 1]?.items.find(i => i.type === 'played')?.cards ?? []
      : [];

    return html`
      <div class="game-wrapper">
        <div class="game-container">
          <div class="game-table">
            <!-- Other players at left/right/top -->
            ${otherPlayers.map((p, i) => i < 3 ? html`
              <opponent-hand
                position=${SEAT_POSITIONS[i + 1]}
                .name=${p.name}
                .cardCount=${p.hand.length}
                .score=${p.score}
                .isCurrentTurn=${p.name === gs.currentPlayer}
                .cards=${p.hand}
                .handValue=${p.hand_value}
              ></opponent-hand>
            ` : nothing)}

            <!-- Deck and pile -->
            <deck-pile
              .pileTop=${gs.pileTop}
              .deckCount=${gs.deckCount}
              .drawSource=${null}
              .lastPlayed=${lastPlayed}
              .interactive=${false}
            ></deck-pile>

            <!-- Bottom player — same card-hand as regular game -->
            <div class="player-area">
              <card-hand
                .cards=${bottomPlayer.hand}
                .selectedOrder=${[]}
                .interactive=${false}
                .handValue=${bottomPlayer.hand_value}
                .playerName=${bottomPlayer.name}
                .score=${bottomPlayer.score}
                .isCurrentTurn=${bottomPlayer.name === gs.currentPlayer}
              ></card-hand>
            </div>

            ${this.botThinking ? html`
              <div class="bot-thinking">${gs.currentPlayer} is thinking...</div>
            ` : nothing}
          </div>

          <!-- Action log -->
          <action-log .entries=${this.actionLog}></action-log>

          <!-- Controls -->
          <div class="controls">
            <button @click=${this.togglePause}>
              ${this.paused ? '▶' : '⏸'}
            </button>
            <button @click=${() => this.setSpeed(0.5)}
                    style=${this.speed === 0.5 ? 'background: #4ade80; color: black;' : ''}>Fast</button>
            <button @click=${() => this.setSpeed(1.0)}
                    style=${this.speed === 1.0 ? 'background: #4ade80; color: black;' : ''}>Normal</button>
            <button @click=${() => this.setSpeed(2.0)}
                    style=${this.speed === 2.0 ? 'background: #4ade80; color: black;' : ''}>Slow</button>
            <span class="speed-label">Round ${gs.round}</span>
          </div>

          <button class="back-btn" @click=${this.goBack}>Exit</button>
        </div>
      </div>

      ${gs.roundEnded && gs.roundData ? this.renderRoundOverlay(gs) : nothing}
      ${gs.gameOver && !gs.roundData ? this.renderGameOver(gs) : nothing}
    `;
  }

  private renderRoundOverlay(gs: SpectatorState) {
    const rd = gs.roundData;
    return html`
      <div class="round-overlay">
        <div class="round-panel ${gs.gameOver ? 'game-over-panel' : ''}">
          <h2>${gs.gameOver ? 'Game Over!' : `Round ${gs.round} Results`}</h2>
          <div class="round-results">
            ${gs.players.map(p => {
              const isEnder = p.name === rd.ender;
              const points = rd.round_points?.[p.name] ?? 0;
              const isPenalty = rd.penalty_applied && isEnder;
              return html`
                <div class="player-row ${isEnder ? 'ender' : ''}">
                  <span>${p.name} ${isEnder ? '(ended)' : ''}</span>
                  <span class=${isPenalty ? 'penalty' : ''}>
                    ${points > 0 ? '+' : ''}${points} pts
                    ${isPenalty ? ' (penalty!)' : ''}
                    → ${rd.total_scores?.[p.name] ?? p.score}
                  </span>
                </div>
              `;
            })}
          </div>
          ${gs.gameOver && gs.winners
            ? html`<p style="font-size: 1.5vw; color: #4ade80; margin-bottom: 1vw;">
                Winner: ${gs.winners.map(w => w[0]).join(', ')}
              </p>`
            : nothing}
          <button class="btn-next" @click=${gs.gameOver ? this.goBack : this.nextRound}>
            ${gs.gameOver ? 'Back to Lobby' : 'Next Round'}
          </button>
        </div>
      </div>
    `;
  }

  private renderGameOver(gs: SpectatorState) {
    return html`
      <div class="round-overlay">
        <div class="round-panel game-over-panel">
          <h2>Game Over!</h2>
          ${gs.winners
            ? html`<p style="font-size: 1.5vw; color: #4ade80;">
                Winner: ${gs.winners.map(w => `${w[0]} (${w[1]})`).join(', ')}
              </p>`
            : nothing}
          <button class="btn-next" @click=${this.goBack}>Back to Lobby</button>
        </div>
      </div>
    `;
  }
}
