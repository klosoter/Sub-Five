import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authStore } from '../../state/auth-store.js';

@customElement('auth-modal')
export class AuthModal extends LitElement {
  @state() mode: 'guest' | 'login' | 'register' = 'guest';
  @state() error = '';
  @state() loading = false;

  static styles = css`
    :host { display: block; }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }

    .modal {
      background: linear-gradient(135deg, #1a2332, #0f1923);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1.5rem;
      padding: 3rem;
      width: 420px;
      max-width: 90vw;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
    }

    h1 {
      text-align: center;
      font-size: 2.5rem;
      font-weight: 800;
      margin: 0 0 0.3rem;
      background: linear-gradient(135deg, #4ade80, #22d3ee);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .tab {
      flex: 1;
      padding: 0.6rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      background: transparent;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .tab:hover { border-color: rgba(255, 255, 255, 0.3); color: white; }
    .tab.active {
      background: rgba(74, 222, 128, 0.15);
      border-color: #4ade80;
      color: #4ade80;
    }

    form { display: flex; flex-direction: column; gap: 1rem; }

    label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      background: rgba(0, 0, 0, 0.3);
      color: white;
      font-size: 1rem;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    input:focus { outline: none; border-color: #4ade80; }
    input::placeholder { color: rgba(255, 255, 255, 0.3); }

    .field { display: flex; flex-direction: column; gap: 0.3rem; }

    button[type="submit"] {
      padding: 0.8rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.15s;
      margin-top: 0.5rem;
    }
    button[type="submit"]:hover:not(:disabled) { filter: brightness(1.1); }
    button[type="submit"]:disabled { opacity: 0.5; cursor: wait; }

    .btn-guest {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #052e16;
    }
    .btn-login {
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
      color: white;
    }
    .btn-register {
      background: linear-gradient(135deg, #a78bfa, #7c3aed);
      color: white;
    }

    .error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 0.6rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      text-align: center;
    }

    .hint {
      text-align: center;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 0.5rem;
    }
  `;

  private async handleSubmit(e: Event) {
    e.preventDefault();
    this.error = '';
    this.loading = true;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      switch (this.mode) {
        case 'guest':
          await authStore.loginAsGuest(formData.get('display_name') as string);
          break;
        case 'login':
          await authStore.login(
            formData.get('username') as string,
            formData.get('password') as string
          );
          break;
        case 'register':
          await authStore.register(
            formData.get('username') as string,
            formData.get('password') as string,
            formData.get('display_name') as string
          );
          break;
      }
      this.dispatchEvent(new CustomEvent('authenticated'));
    } catch (err: any) {
      this.error = err.message || 'Something went wrong';
    }
    this.loading = false;
  }

  render() {
    return html`
      <div class="overlay">
        <div class="modal">
          <h1>Sub-Five</h1>
          <p class="subtitle">A strategic card game</p>

          <div class="tabs">
            <button class="tab ${this.mode === 'guest' ? 'active' : ''}" @click=${() => { this.mode = 'guest'; this.error = ''; }}>
              Quick Play
            </button>
            <button class="tab ${this.mode === 'login' ? 'active' : ''}" @click=${() => { this.mode = 'login'; this.error = ''; }}>
              Sign In
            </button>
            <button class="tab ${this.mode === 'register' ? 'active' : ''}" @click=${() => { this.mode = 'register'; this.error = ''; }}>
              Register
            </button>
          </div>

          ${this.error ? html`<div class="error">${this.error}</div>` : ''}

          ${this.mode === 'guest' ? html`
            <form @submit=${this.handleSubmit}>
              <div class="field">
                <label>Display Name</label>
                <input name="display_name" placeholder="Enter your name" maxlength="20" required autofocus />
              </div>
              <button type="submit" class="btn-guest" ?disabled=${this.loading}>
                ${this.loading ? 'Joining...' : 'Play as Guest'}
              </button>
              <p class="hint">No account needed. Stats won't be saved.</p>
            </form>
          ` : ''}

          ${this.mode === 'login' ? html`
            <form @submit=${this.handleSubmit}>
              <div class="field">
                <label>Username</label>
                <input name="username" placeholder="Username" required autofocus />
              </div>
              <div class="field">
                <label>Password</label>
                <input name="password" type="password" placeholder="Password" required />
              </div>
              <button type="submit" class="btn-login" ?disabled=${this.loading}>
                ${this.loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ` : ''}

          ${this.mode === 'register' ? html`
            <form @submit=${this.handleSubmit}>
              <div class="field">
                <label>Username</label>
                <input name="username" placeholder="Choose a username" minlength="3" required autofocus />
              </div>
              <div class="field">
                <label>Display Name</label>
                <input name="display_name" placeholder="Name shown in-game" maxlength="20" required />
              </div>
              <div class="field">
                <label>Password</label>
                <input name="password" type="password" placeholder="Min 4 characters" minlength="4" required />
              </div>
              <button type="submit" class="btn-register" ?disabled=${this.loading}>
                ${this.loading ? 'Creating account...' : 'Create Account'}
              </button>
              <p class="hint">Accounts track your stats and leaderboard rank.</p>
            </form>
          ` : ''}
        </div>
      </div>
    `;
  }
}
