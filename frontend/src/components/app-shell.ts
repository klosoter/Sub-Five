import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gameStore } from '../state/game-store.js';
import './lobby/lobby-page.js';
import './join/join-page.js';
import './game/game-page.js';
import './game/spectator-page.js';

type Route =
  | { page: 'lobby' }
  | { page: 'join'; code: string }
  | { page: 'game'; code: string }
  | { page: 'spectate'; code: string };

@customElement('app-shell')
export class AppShell extends LitElement {
  @state() route: Route = { page: 'lobby' };

  static styles = css`
    :host { display: block; width: 100%; height: 100%; }
  `;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('hashchange', () => this.resolveRoute());
    this.resolveRoute();
  }

  private resolveRoute() {
    const hash = window.location.hash.slice(1) || '/';

    const joinMatch = hash.match(/^\/join\/(.+)$/);
    if (joinMatch) {
      this.route = { page: 'join', code: joinMatch[1] };
      return;
    }

    const spectateMatch = hash.match(/^\/spectate\/(.+)$/);
    if (spectateMatch) {
      this.route = { page: 'spectate', code: spectateMatch[1] };
      return;
    }

    const gameMatch = hash.match(/^\/game\/(.+)$/);
    if (gameMatch) {
      const code = gameMatch[1];
      this.route = { page: 'game', code };
      // Connect game store when entering game page
      gameStore.connect(code, ''); // playerName set from server state
      return;
    }

    this.route = { page: 'lobby' };
  }

  render() {
    switch (this.route.page) {
      case 'join':
        return html`<join-page .roomCode=${this.route.code}></join-page>`;
      case 'game':
        return html`<game-page></game-page>`;
      case 'spectate':
        return html`<spectator-page .roomCode=${this.route.code}></spectator-page>`;
      default:
        return html`<lobby-page></lobby-page>`;
    }
  }
}
