import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LogEntry } from '../../state/game-store.js';
import './card-element.js';

@customElement('action-log')
export class ActionLog extends LitElement {
  @property({ type: Array }) entries: LogEntry[] = [];

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.5em;
      position: absolute;
      top: 0;
      right: 0;
      height: 100%;
      width: 18.4vw;
      padding: 0.5vw;
      color: white;
      font-size: 0.9vw;
      line-height: 1.4;
      overflow-y: auto;
      box-sizing: border-box;
      font-family: "Segoe UI", sans-serif;
      background: rgba(0, 0, 0, 0.25);
      backdrop-filter: blur(0.4vw);
      -webkit-backdrop-filter: blur(0.4vw);
      border-radius: 0.5vw 0 0 0.5vw;
      box-shadow: inset 0 0 0.5vw rgba(255, 255, 255, 0.1);

      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    }

    :host::-webkit-scrollbar { width: 0.6vw; }
    :host::-webkit-scrollbar-track { background: transparent; }
    :host::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.3);
      border-radius: 0.3vw;
      border: 0.1vw solid rgba(0, 0, 0, 0.1);
    }
    :host::-webkit-scrollbar-thumb:hover {
      background-color: rgba(255, 255, 255, 0.5);
    }

    .log-entry {
      background: rgb(255 255 255 / 5%);
      padding: 0.6vw;
      border-radius: 0.5vw;
    }

    .name {
      font-weight: bold;
      display: block;
      margin-bottom: 0.3vw;
    }

    .action-line {
      color: #ccc;
      margin-left: 0.5vw;
    }

    .log-card-row {
      display: flex;
      gap: 0.3vw;
      margin-top: 0.3em;
      margin-bottom: 0.6em;
    }

    .log-card-row card-element {
      width: 2.5vw;
      height: calc(2.5vw * 1.39);
      flex-shrink: 0;
    }
  `;

  render() {
    return html`
      ${[...this.entries].reverse().map(
        (entry) => html`
          <div class="log-entry">
            <span class="name" style="color: ${entry.color}">
              ${entry.player} (${entry.score})
            </span>
            ${entry.items.map(
              (item) => html`
                <div class="action-line">
                  <div>${item.type}:</div>
                  <div class="log-card-row">
                    ${item.cards.map(
                      (c) => html`<card-element mini .card=${c} .faceDown=${c === '🂠'}></card-element>`
                    )}
                  </div>
                </div>
              `
            )}
          </div>
        `
      )}
    `;
  }
}
