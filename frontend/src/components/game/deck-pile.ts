import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { gameStore } from '../../state/game-store.js';
import { audio } from '../../services/audio.js';
import './card-element.js';

@customElement('deck-pile')
export class DeckPile extends LitElement {
  @property() pileTop = '';
  @property({ type: Number }) deckCount = 0;
  @property() drawSource: string | null = null;
  @property({ type: Array }) lastPlayed: string[] = [];
  @property({ type: Boolean }) interactive = false;

  static styles = css`
    :host { display: contents; }

    .deck-area, .pile-area {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .deck-area { left: 30%; }
    .pile-area { left: 70%; }

    .pile-card-stack {
      position: relative;
      height: calc(7vw * 1.39);
      /* Width set dynamically via style attribute for centering */
    }

    .pile-card-stack card-element {
      position: absolute;
      top: 0;
    }

    .not-interactive { pointer-events: none; }
  `;

  private handleDeckClick() {
    if (!this.interactive) return;
    audio.play('card-select');
    gameStore.setDrawSource('deck');
  }

  private handlePileClick() {
    if (!this.interactive) return;
    audio.play('card-select');
    gameStore.setDrawSource('pile');
  }

  render() {
    const deckClass = this.drawSource === 'deck' ? 'draw-selected' : '';
    const pileClass = this.drawSource === 'pile' ? 'draw-selected' : '';

    return html`
      <div class="deck-area ${!this.interactive ? 'not-interactive' : ''}"
           @click=${this.handleDeckClick}>
        <card-element class=${deckClass} faceDown></card-element>
      </div>

      <div class="pile-area ${!this.interactive ? 'not-interactive' : ''}"
           @click=${this.handlePileClick}>
        ${this.lastPlayed.length > 1
          ? html`
              <div class="pile-card-stack"
                   style="width: ${7 + (this.lastPlayed.length - 1) * 0.3 * 7}vw">
                ${this.lastPlayed.map((card, i) => {
                  const isTop = i === this.lastPlayed.length - 1;
                  const cls = isTop ? `top-played ${pileClass}` : '';
                  return html`
                    <card-element
                      class=${cls}
                      style="left: ${i * 0.3 * 7}vw; z-index: ${i}"
                      .card=${card}
                    ></card-element>
                  `;
                })}
              </div>
            `
          : html`
              <card-element
                class=${pileClass}
                .card=${this.pileTop}
              ></card-element>
            `
        }
      </div>
    `;
  }
}
