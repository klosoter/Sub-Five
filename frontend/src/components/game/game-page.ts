import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gameStore } from '../../state/game-store.js';
import { audio } from '../../services/audio.js';
import { animateShake } from '../../services/animations.js';
import './card-element.js';
import './card-hand.js';
import './opponent-hand.js';
import './deck-pile.js';
import './action-log.js';
import './round-summary.js';
import './turn-timer.js';

const SEAT_POSITIONS: ('left' | 'right' | 'top')[] = ['left', 'right', 'top'];

@customElement('game-page')
export class GamePage extends LitElement {
  @state() private _tick = 0;
  @state() private errorMsg = '';
  @state() private botThinking = false;
  private failCount = 0;
  private unsubscribe?: () => void;
  private errorTimer?: number;
  private botTimer?: number;
  private pollTimer?: number;
  private prevIsMyTurn = false;
  private prevRoundEnded = false;

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

    /* === Game wrapper — maintains aspect ratio like original === */
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

    /* === Table — exact original styling === */
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

    /* === Player area at bottom of table === */
    .player-area {
      position: absolute;
      bottom: 2%;
      left: 50%;
      transform: translateX(-50%);
    }

    /* === Base Button Styling (matches original) === */
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

    /* === Main game buttons — matching original sizes and positions === */
    #play-selected,
    #end-round,
    #end-game,
    #fullscreen-btn {
      position: absolute;
      z-index: 10;
      font-size: 2.5vw !important;
      padding: 1vw 2vw !important;
      border-radius: 0.4vw;
      color: white;
      cursor: pointer;
    }

    #play-selected {
      bottom: 2%;
      left: 2%;
      background-color: #4caf50;
      border: 0.1vw solid #2e7d32;
    }

    #end-round {
      bottom: 2%;
      right: 22%;
      background-color: #333;
      border: 0.1vw solid #666;
    }

    #end-game {
      top: 2%;
      right: 22%;
      background-color: rgb(150 22 22);
      border: 0.1vw solid #700;
    }

    #fullscreen-btn {
      top: 2%;
      left: 2%;
      font-size: 1.8vw !important;
      padding: 0.6vw 1vw !important;
      background-color: #444;
      border: 0.1vw solid #888;
    }

    /* === Error toast — positioned over everything === */
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
      backdrop-filter: blur(4px);
      box-shadow: 0 0.3vw 1vw rgba(0, 0, 0, 0.5);
      animation: slideDown 0.3s ease;
      white-space: nowrap;
    }
    @keyframes slideDown {
      from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
      to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }

    /* === Bot thinking indicator === */
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

    /* === Turn timer positioned top-center of table === */
    turn-timer {
      position: absolute;
      top: 8%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 5;
    }

    /* === Portrait orientation hint === */
    .rotate-hint {
      display: none;
      position: fixed;
      inset: 0;
      background: #003d1f;
      z-index: 99999;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 5vw;
      gap: 3vw;
    }
    .rotate-hint .icon {
      font-size: 15vw;
      animation: rotatePhone 2s ease-in-out infinite;
    }
    @keyframes rotatePhone {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(90deg); }
    }
    @media (orientation: portrait) and (max-width: 1024px) {
      .rotate-hint { display: flex; }
      .game-wrapper { display: none; }
    }

    /* === Sound toggle button === */
    .sound-btn {
      position: absolute;
      top: 2%;
      left: calc(2% + 4.5vw);
      z-index: 10;
      font-size: 1.8vw !important;
      padding: 0.6vw 1vw !important;
      background-color: #444;
      border: 0.1vw solid #888;
    }
  `;

  connectedCallback() {
    super.connectedCallback();

    this.unsubscribe = gameStore.subscribe(() => {
      this._tick++;
      this.playStateChangeSounds();
      this.checkBotTurn();
    });
    // Poll for game state via REST (reliable fallback for dev mode)
    this.startPolling();
  }

  private async startPolling() {
    if (!gameStore.roomCode) {
      this.pollTimer = window.setTimeout(() => this.startPolling(), 500);
      return;
    }
    try {
      const res = await fetch(`/api/lobby/rooms/${gameStore.roomCode}/game-state`, { credentials: 'include' });
      if (res.ok) {
        this.failCount = 0;
        const data = await res.json();
        gameStore.updateFromServer(data);
      } else {
        this.failCount++;
        if (this.failCount >= 5) {
          window.location.hash = '#/';
          return;
        }
      }
    } catch {
      this.failCount++;
      if (this.failCount >= 5) {
        window.location.hash = '#/';
        return;
      }
    }
    this.pollTimer = window.setTimeout(() => this.startPolling(), 1000);
  }

  private playStateChangeSounds() {
    const s = gameStore;
    if (s.isMyTurn && !this.prevIsMyTurn) {
      audio.play('your-turn');
    }
    if (s.roundEnded && !this.prevRoundEnded) {
      audio.play(s.gameOver ? 'game-over' : 'round-end');
    }
    this.prevIsMyTurn = s.isMyTurn;
    this.prevRoundEnded = s.roundEnded;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
    if (this.errorTimer) clearTimeout(this.errorTimer);
    if (this.botTimer) clearTimeout(this.botTimer);
    if (this.pollTimer) clearTimeout(this.pollTimer);
  }

  private showError(msg: string) {
    this.errorMsg = msg;
    audio.play('error');
    if (this.errorTimer) clearTimeout(this.errorTimer);
    this.errorTimer = window.setTimeout(() => { this.errorMsg = ''; }, 3000);
    const playBtn = this.shadowRoot?.querySelector('#play-selected');
    if (playBtn) animateShake(playBtn);
  }

  private checkBotTurn() {
    const s = gameStore;
    if (!s.isMyTurn && !s.roundEnded && (s.currentPlayer.startsWith('Bot-') || s.currentPlayer.startsWith('RL-'))) {
      // Only start a new timer if one isn't already pending
      // (polling calls this every second — don't reset the 1200ms timer!)
      if (!this.botTimer) {
        this.botThinking = true;
        this.botTimer = window.setTimeout(() => {
          this.botTimer = undefined;
          this.triggerBotAction();
        }, 1200);
      }
    } else {
      // Not a bot's turn — cancel any pending timer
      if (this.botTimer) {
        clearTimeout(this.botTimer);
        this.botTimer = undefined;
      }
      this.botThinking = false;
    }
  }

  private async triggerBotAction() {
    try {
      const res = await fetch(`/api/dev/bot-action/${gameStore.roomCode}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        // Reload game state (includes roundData if bot ended the round)
        const stateRes = await fetch(`/api/lobby/rooms/${gameStore.roomCode}/game-state`, { credentials: 'include' });
        if (stateRes.ok) {
          const data = await stateRes.json();
          gameStore.updateFromServer(data);
        }
      }
    } catch { /* ignore */ }
    this.botThinking = false;
  }

  private async handlePlay() {
    if (!gameStore.drawSource) {
      this.showError('Choose draw source (click deck or pile)');
      return;
    }
    if (gameStore.selectedOrder.length === 0) {
      this.showError('Select cards to play');
      return;
    }
    audio.play('card-play');
    const error = await gameStore.playCards();
    if (error) {
      this.showError(error);
    }
  }

  private async handleEndRound() {
    const error = await gameStore.endRound();
    if (error) {
      this.showError(error);
    }
  }

  private handleTimeout() {
    if (gameStore.isMyTurn) {
      if (gameStore.selectedOrder.length === 0 && gameStore.hand.length > 0) {
        gameStore.toggleCardSelection(0);
      }
      if (!gameStore.drawSource) {
        gameStore.setDrawSource('deck');
      }
      gameStore.playCards();
    }
  }

  private handleQuit() {
    if (!confirm('End the game for everyone?')) return;
    fetch(`/api/lobby/rooms/${gameStore.roomCode}`, { method: 'DELETE', credentials: 'include' })
      .then(() => { window.location.hash = '#/'; });
  }

  private toggleSound() {
    audio.muted = !audio.muted;
    this.requestUpdate();
  }

  private toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  render() {
    const s = gameStore;
    const isMyTurn = s.isMyTurn;
    const lastPlayed = s.actionLog.length > 0
      ? s.actionLog[s.actionLog.length - 1]?.items.find(i => i.type === 'played')?.cards ?? []
      : [];

    const opponents = s.opponents;

    return html`
      <div class="rotate-hint">
        <div class="icon">📱</div>
        <div>Rotate to landscape</div>
      </div>
      <div class="game-wrapper">
        <div class="game-container">
          <div class="game-table">
            ${opponents.map((opp, i) =>
              i < 3
                ? html`
                    <opponent-hand
                      position=${SEAT_POSITIONS[i]}
                      .name=${opp.name}
                      .cardCount=${opp.cardCount}
                      .score=${opp.score}
                      .isCurrentTurn=${opp.name === s.currentPlayer}
                    ></opponent-hand>
                  `
                : nothing
            )}

            <!-- Deck and pile positioned inside the table -->
            <deck-pile
              .pileTop=${s.pileTop}
              .deckCount=${s.deckCount}
              .drawSource=${s.drawSource}
              .lastPlayed=${lastPlayed}
              .interactive=${isMyTurn}
            ></deck-pile>

            <!-- Player hand at bottom of table -->
            <div class="player-area">
              <card-hand
                .cards=${s.hand}
                .selectedOrder=${s.selectedOrder}
                .interactive=${isMyTurn}
                .handValue=${s.handValue}
                .playerName=${s.playerName}
                .score=${s.scores[s.playerName] ?? 0}
                .isCurrentTurn=${s.playerName === s.currentPlayer}
              ></card-hand>
            </div>

            ${this.botThinking ? html`
              <div class="bot-thinking">${s.currentPlayer} is thinking...</div>
            ` : nothing}

            ${s.turnTimer > 0 ? html`
              <turn-timer
                .duration=${s.turnTimer}
                .active=${!s.roundEnded}
                .isMyTurn=${isMyTurn}
                @timeout=${this.handleTimeout}
              ></turn-timer>
            ` : nothing}
          </div>

          <!-- Log panel to the right of the table -->
          <action-log .entries=${s.actionLog}></action-log>

          <!-- Buttons -->
          <button id="play-selected" ?disabled=${!isMyTurn || s.roundEnded} @click=${this.handlePlay}>
            Play
          </button>
          <button id="end-round" ?disabled=${!s.canEndRound} @click=${this.handleEndRound}>
            Finish
          </button>
          <button id="end-game" @click=${this.handleQuit}>Quit</button>
          <button id="fullscreen-btn" @click=${this.toggleFullscreen}>⛶</button>
          <button class="sound-btn" @click=${this.toggleSound}>
            ${audio.muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      ${s.roundData
        ? html`
            <round-summary
              .data=${s.roundData}
              .isReady=${s.readyPlayers.includes(s.playerName)}
            ></round-summary>
          `
        : nothing}

      ${this.errorMsg ? html`<div class="error-toast">${this.errorMsg}</div>` : nothing}
    `;
  }
}
