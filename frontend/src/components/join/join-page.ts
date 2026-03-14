import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { authStore } from '../../state/auth-store.js';
import { socketService } from '../../state/socket.js';

@customElement('join-page')
export class JoinPage extends LitElement {
  @property() roomCode = '';
  @state() joined = false;
  @state() players: string[] = [];
  @state() ready: Record<string, boolean> = {};
  @state() error = '';
  private pollTimer?: number;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 3rem;
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .back-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.7);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .back-btn:hover { border-color: rgba(255,255,255,0.4); color: white; }

    .logo {
      font-size: 1.4rem;
      font-weight: 800;
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 1.25rem;
      padding: 2.5rem 3rem;
      width: 440px;
      max-width: 90vw;
    }

    h2 {
      text-align: center;
      font-size: 1.6rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
    }

    .room-code {
      text-align: center;
      font-family: monospace;
      font-size: 2rem;
      font-weight: 800;
      color: #fbbf24;
      text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
      margin-bottom: 2rem;
      letter-spacing: 0.2em;
    }

    /* Player list */
    .player-list {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem;
    }

    .player-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 0.3rem;
      background: rgba(255, 255, 255, 0.03);
      transition: background 0.2s;
    }

    .player-name { font-weight: 600; font-size: 1.05rem; }

    .ready-badge {
      font-size: 0.8rem;
      padding: 0.2rem 0.7rem;
      border-radius: 999px;
    }
    .ready-badge.yes {
      background: rgba(74, 222, 128, 0.15);
      color: #4ade80;
    }
    .ready-badge.no {
      background: rgba(255, 255, 255, 0.06);
      color: rgba(255, 255, 255, 0.4);
    }

    /* Buttons */
    .buttons {
      display: flex;
      gap: 0.75rem;
    }

    button {
      padding: 0.7rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      flex: 1;
    }
    button:hover { transform: translateY(-1px); filter: brightness(1.1); }

    .btn-ready {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #052e16;
    }
    .btn-ready.active {
      background: linear-gradient(135deg, #fb923c, #f97316);
      color: white;
    }

    .btn-leave {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      flex: 0;
      padding: 0.7rem 1.2rem;
    }

    /* Join form */
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    input {
      padding: 0.75rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      color: white;
      font-size: 1.1rem;
      text-align: center;
    }
    input:focus { outline: none; border-color: #4ade80; }
    input::placeholder { color: rgba(255, 255, 255, 0.3); }

    .btn-join-submit {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #052e16;
    }

    .error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      text-align: center;
    }

    .waiting-msg {
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .waiting-msg .dots::after {
      content: '';
      animation: dots 1.5s infinite;
    }
    @keyframes dots {
      0% { content: '.'; }
      33% { content: '..'; }
      66% { content: '...'; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    // Auto-join if we already have a display name from auth
    if (authStore.isLoggedIn) {
      this.autoJoin();
    }
    this.startPolling();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.pollTimer) clearTimeout(this.pollTimer);
  }

  private async autoJoin() {
    const name = authStore.displayName;
    if (!name) return;

    const res = await fetch(`/api/lobby/rooms/${this.roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      credentials: 'include',
    });

    if (res.ok) {
      this.joined = true;
    }
  }

  private async startPolling() {
    try {
      const res = await fetch(`/api/lobby/rooms/${this.roomCode}/state`, { credentials: 'include' });
      if (!res.ok) {
        window.location.hash = '#/';
        return;
      }
      const data = await res.json();
      this.players = data.players || [];
      this.ready = data.ready || {};

      if (data.started) {
        window.location.hash = `#/game/${this.roomCode}`;
        return;
      }
    } catch { /* retry */ }
    this.pollTimer = window.setTimeout(() => this.startPolling(), 1000);
  }

  private async handleJoin(e: Event) {
    e.preventDefault();
    const input = this.shadowRoot!.querySelector('input') as HTMLInputElement;
    const name = input?.value.trim();
    if (!name) return;

    const res = await fetch(`/api/lobby/rooms/${this.roomCode}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json();
      this.error = data.error || 'Could not join';
      return;
    }
    this.joined = true;
    this.error = '';
  }

  private handleReady() {
    socketService.connect({
      onRoomUpdate: (data) => {
        this.players = data.players;
        this.ready = data.ready;
        if (data.started) {
          window.location.hash = `#/game/${this.roomCode}`;
        }
      },
    });
    socketService.joinRoom(this.roomCode);
    socketService.toggleReady(this.roomCode);
  }

  private async handleLeave() {
    await fetch(`/api/lobby/rooms/${this.roomCode}/leave`, {
      method: 'POST',
      credentials: 'include',
    });
    window.location.hash = '#/';
  }

  render() {
    const myName = authStore.displayName;
    const isReady = this.ready[myName] ?? false;
    const allReady = this.players.length >= 2 && this.players.every(p => this.ready[p]);

    return html`
      <header>
        <button class="back-btn" @click=${() => window.location.hash = '#/'}>← Back</button>
        <span class="logo">Sub-Five</span>
        <span></span>
      </header>

      <main>
        <div class="card">
          <h2>Game Room</h2>
          <div class="room-code">${this.roomCode}</div>

          ${!this.joined && !myName ? html`
            <form @submit=${this.handleJoin}>
              <input type="text" placeholder="Your display name" maxlength="20" autofocus />
              <button type="submit" class="btn-join-submit">Join Room</button>
              ${this.error ? html`<div class="error">${this.error}</div>` : ''}
            </form>
          ` : html`
            <ul class="player-list">
              ${this.players.map(p => html`
                <li>
                  <span class="player-name">${p}${p === myName ? ' (you)' : ''}</span>
                  <span class="ready-badge ${this.ready[p] ? 'yes' : 'no'}">
                    ${this.ready[p] ? '✓ Ready' : 'Waiting'}
                  </span>
                </li>
              `)}
            </ul>

            <div class="buttons">
              <button
                class="btn-ready ${isReady ? 'active' : ''}"
                @click=${this.handleReady}
              >
                ${isReady ? 'Cancel Ready' : "I'm Ready"}
              </button>
              <button class="btn-leave" @click=${this.handleLeave}>Leave</button>
            </div>

            ${this.players.length < 2 ? html`
              <p class="waiting-msg">Waiting for more players<span class="dots"></span></p>
            ` : allReady ? html`
              <p class="waiting-msg">Starting game...</p>
            ` : html`
              <p class="waiting-msg">Waiting for everyone to ready up<span class="dots"></span></p>
            `}
          `}
        </div>
      </main>
    `;
  }
}
