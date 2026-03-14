import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RoundEndedData } from '../../state/socket.js';
import { gameStore } from '../../state/game-store.js';
import './card-element.js';

@customElement('round-summary')
export class RoundSummary extends LitElement {
  @property({ type: Object }) data: RoundEndedData | null = null;
  @property({ type: Boolean }) isReady = false;

  static styles = css`
    :host { display: block; }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      animation: overlayFade 0.3s ease;
    }
    @keyframes overlayFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .popup {
      background: #1a2332;
      border-radius: 1vw;
      padding: 2vw 3vw;
      min-width: 40vw;
      max-width: 70vw;
      box-shadow: 0 0 3vw rgba(0, 0, 0, 0.5);
      color: white;
      animation: popupSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes popupSlide {
      from { transform: scale(0.8) translateY(2vw); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }

    h2 {
      text-align: center;
      font-size: 1.8vw;
      margin: 0 0 1.5vw;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 1.1vw;
    }

    th, td {
      padding: 0.5vw 1vw;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    th { color: rgba(255, 255, 255, 0.6); font-weight: 600; }

    .winner td { color: #4ade80; }
    .penalized td { color: #f87171; }

    .hand-cards {
      display: flex;
      gap: 0.2vw;
      --card-width: 2.5vw;
    }
    .hand-cards card-element {
      animation: revealCard 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    }
    .hand-cards card-element:nth-child(1) { animation-delay: 200ms; }
    .hand-cards card-element:nth-child(2) { animation-delay: 260ms; }
    .hand-cards card-element:nth-child(3) { animation-delay: 320ms; }
    .hand-cards card-element:nth-child(4) { animation-delay: 380ms; }
    .hand-cards card-element:nth-child(5) { animation-delay: 440ms; }
    .hand-cards card-element:nth-child(6) { animation-delay: 500ms; }
    @keyframes revealCard {
      from { transform: scale(0.5) rotateY(180deg); opacity: 0; }
      to { transform: scale(1) rotateY(0deg); opacity: 1; }
    }

    .buttons {
      display: flex;
      justify-content: center;
      gap: 2vw;
      margin-top: 1.5vw;
    }

    button {
      padding: 0.6vw 2vw;
      border: none;
      border-radius: 0.4vw;
      font-size: 1.1vw;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-ready {
      background: #4caf50;
      color: white;
    }
    .btn-ready:hover { background: #43a047; }
    .btn-ready.active {
      background: #f97316;
    }

    .btn-quit {
      background: #991b1b;
      color: white;
    }
    .btn-quit:hover { background: #7f1d1d; }

    .game-over-banner {
      text-align: center;
      font-size: 1.5vw;
      color: #fbbf24;
      margin-bottom: 1vw;
    }
  `;

  private async handleReady() {
    await gameStore.readyNextRound();
    // In dev mode, also make bots ready
    try {
      await fetch(`/api/dev/bot-ready/${gameStore.roomCode}`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* dev endpoint may not exist in prod */ }
  }

  private handleQuit() {
    fetch(`/api/lobby/rooms/${gameStore.roomCode}`, { method: 'DELETE', credentials: 'include' })
      .then(() => { window.location.hash = '#/'; });
  }

  render() {
    if (!this.data) return nothing;

    const d = this.data;
    const players = Object.keys(d.hands);

    return html`
      <div class="overlay">
        <div class="popup">
          ${d.game_over ? html`
            <div class="game-over-banner">
              🏆 Game Over!
              ${d.winners.map(([name, score]) => html`<strong>${name}</strong> (${score})`)}
            </div>
          ` : ''}

          <h2>Round Summary</h2>
          <table>
            <tr><th>Player</th><th>Hand</th><th>Round Pts</th><th>Total</th></tr>
            ${players.map((name) => {
              const isWinner = d.round_points[name] === 0;
              const isPenalized = name === d.ender && d.penalty_applied;
              const rowClass = isPenalized ? 'penalized' : isWinner ? 'winner' : '';
              const pts = d.round_points[name];
              const ptsDisplay = isPenalized ? `${pts} (+15)` : `${pts}`;
              return html`
                <tr class=${rowClass}>
                  <td>${name}</td>
                  <td>
                    <div class="hand-cards">
                      ${d.hands[name].map((c) => html`<card-element mini .card=${c}></card-element>`)}
                    </div>
                  </td>
                  <td>${ptsDisplay}</td>
                  <td>${d.total_scores[name]}</td>
                </tr>
              `;
            })}
          </table>

          <div class="buttons">
            <button
              class="btn-ready ${this.isReady ? 'active' : ''}"
              @click=${this.handleReady}
            >
              ${d.game_over
                ? (this.isReady ? 'Cancel New Game' : 'Ready for New Game')
                : (this.isReady ? 'Cancel Ready' : "I'm Ready")}
            </button>
            <button class="btn-quit" @click=${this.handleQuit}>Quit</button>
          </div>
        </div>
      </div>
    `;
  }
}
