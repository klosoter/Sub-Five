import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authStore } from '../../state/auth-store.js';
import '../auth/auth-modal.js';

type RoomInfo = {
  code: string;
  players: string[];
  started: boolean;
  max_players: number;
  has_password: boolean;
};

@customElement('lobby-page')
export class LobbyPage extends LitElement {
  @state() rooms: RoomInfo[] = [];
  @state() showAuth = false;
  @state() showCreate = false;
  @state() _tick = 0;
  private refreshTimer?: number;
  private unsubAuth?: () => void;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      color: white;
    }

    /* Header bar */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 3rem;
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .logo {
      font-size: 1.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-name {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.8);
    }

    .user-badge {
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.5);
    }

    /* Main content */
    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 2rem;
      max-width: 900px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .hero {
      text-align: center;
      margin-bottom: 3rem;
    }

    .hero h1 {
      font-size: 3.5rem;
      font-weight: 900;
      margin: 0;
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero p {
      color: rgba(255, 255, 255, 0.5);
      font-size: 1.1rem;
      margin: 0.5rem 0 0;
    }

    /* Action buttons */
    .actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 2.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    button {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 0.6rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover { transform: translateY(-1px); filter: brightness(1.1); }

    .btn-create {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #052e16;
      font-size: 1.1rem;
      padding: 0.85rem 2.5rem;
    }

    .btn-dev {
      background: linear-gradient(135deg, #818cf8, #6366f1);
      color: white;
    }

    .btn-logout {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.6);
      padding: 0.5rem 1.2rem;
      font-size: 0.85rem;
    }
    .btn-logout:hover { border-color: rgba(255, 255, 255, 0.4); color: white; }

    /* Room list */
    .rooms-section {
      width: 100%;
    }

    .rooms-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .rooms-header h2 {
      font-size: 1.3rem;
      font-weight: 700;
      margin: 0;
      color: rgba(255, 255, 255, 0.8);
    }

    .room-count {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.4);
    }

    /* Room cards */
    .room-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .room-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0.75rem;
      padding: 1.25rem;
      transition: all 0.2s;
      cursor: pointer;
    }
    .room-card:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(74, 222, 128, 0.3);
      transform: translateY(-2px);
    }

    .room-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .room-code {
      font-family: monospace;
      font-size: 1.1rem;
      font-weight: 700;
      color: #fbbf24;
    }

    .room-status {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
    }
    .room-status.waiting {
      background: rgba(74, 222, 128, 0.15);
      color: #4ade80;
    }
    .room-status.in-progress {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
    }

    .room-players {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
    }

    .room-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .btn-join {
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
      color: white;
      padding: 0.4rem 1.2rem;
      font-size: 0.85rem;
      flex: 1;
    }

    .btn-delete {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      padding: 0.4rem 0.75rem;
      font-size: 0.85rem;
    }
    .btn-delete:hover { background: rgba(239, 68, 68, 0.3); }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: rgba(255, 255, 255, 0.4);
    }
    .empty-state .icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state p { font-size: 1.1rem; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.unsubAuth = authStore.subscribe(() => this._tick++);
    authStore.checkSession().then(() => {
      if (!authStore.isLoggedIn) this.showAuth = true;
    });
    this.loadRooms();
    this.refreshTimer = window.setInterval(() => this.loadRooms(), 3000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.unsubAuth?.();
  }

  private async loadRooms() {
    try {
      const res = await fetch('/api/lobby/rooms', { credentials: 'include' });
      this.rooms = await res.json();
    } catch { /* retry */ }
  }

  private async createRoom() {
    const res = await fetch('/api/lobby/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await res.json();
    window.location.hash = `#/join/${data.code}`;
  }

  private async quickGame() {
    const res = await fetch('/api/dev/quick-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bots: 2, name: authStore.displayName || 'Dev' }),
      credentials: 'include',
    });
    const data = await res.json();
    window.location.hash = `#/game/${data.code}`;
  }

  private async deleteRoom(code: string, e: Event) {
    e.stopPropagation();
    await fetch(`/api/lobby/rooms/${code}`, { method: 'DELETE', credentials: 'include' });
    this.loadRooms();
  }

  private handleAuth() {
    this.showAuth = false;
    this._tick++;
  }

  private async handleLogout() {
    await authStore.logout();
    this.showAuth = true;
  }

  render() {
    const user = authStore.user;

    if (this.showAuth && !user) {
      return html`<auth-modal @authenticated=${this.handleAuth}></auth-modal>`;
    }

    const waitingRooms = this.rooms.filter(r => !r.started);
    const activeRooms = this.rooms.filter(r => r.started);

    return html`
      <header>
        <span class="logo">Sub-Five</span>
        ${user ? html`
          <div class="user-info">
            <span class="user-name">${user.display_name}</span>
            ${user.is_guest ? html`<span class="user-badge">Guest</span>` : nothing}
            <button class="btn-logout" @click=${this.handleLogout}>Sign Out</button>
          </div>
        ` : nothing}
      </header>

      <main>
        <div class="hero">
          <h1>Sub-Five</h1>
          <p>Play the card game. Get your hand under five. Don't get penalized.</p>
        </div>

        <div class="actions">
          <button class="btn-create" @click=${this.createRoom}>Create Game</button>
          <button class="btn-dev" @click=${this.quickGame}>Quick Play vs Bots</button>
        </div>

        <div class="rooms-section">
          <div class="rooms-header">
            <h2>Open Games</h2>
            <span class="room-count">${this.rooms.length} room${this.rooms.length !== 1 ? 's' : ''}</span>
          </div>

          ${this.rooms.length === 0 ? html`
            <div class="empty-state">
              <div class="icon">♠ ♥ ♦ ♣</div>
              <p>No games available. Create one to start playing!</p>
            </div>
          ` : html`
            <div class="room-grid">
              ${waitingRooms.map(room => html`
                <div class="room-card" @click=${() => window.location.hash = `#/join/${room.code}`}>
                  <div class="room-card-header">
                    <span class="room-code">${room.code}</span>
                    <span class="room-status waiting">${room.players.length}/${room.max_players}</span>
                  </div>
                  <div class="room-players">${room.players.join(', ') || 'Empty'}</div>
                  <div class="room-actions">
                    <button class="btn-join">Join</button>
                    <button class="btn-delete" @click=${(e: Event) => this.deleteRoom(room.code, e)}>✕</button>
                  </div>
                </div>
              `)}
              ${activeRooms.map(room => html`
                <div class="room-card" style="opacity: 0.6;">
                  <div class="room-card-header">
                    <span class="room-code">${room.code}</span>
                    <span class="room-status in-progress">In Progress</span>
                  </div>
                  <div class="room-players">${room.players.join(', ')}</div>
                </div>
              `)}
            </div>
          `}
        </div>
      </main>
    `;
  }
}
