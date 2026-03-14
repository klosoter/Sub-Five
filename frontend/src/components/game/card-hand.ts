import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { gameStore } from '../../state/game-store.js';
import { audio } from '../../services/audio.js';
import './card-element.js';

@customElement('card-hand')
export class CardHand extends LitElement {
  @property({ type: Array }) cards: string[] = [];
  @property({ type: Array }) selectedOrder: number[] = [];
  @property({ type: Boolean }) interactive = false;
  @property({ type: Number }) handValue: number | null = null;
  @property() playerName = '';
  @property({ type: Number }) score = 0;
  @property({ type: Boolean }) isCurrentTurn = false;

  static styles = css`
    :host { display: block; }

    .player-hand-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .player-label {
      font-size: 2vw;
      font-weight: bold;
      color: white;
      text-shadow: 0 0 1vw black;
      margin-bottom: 0.3vw;
      text-align: center;
      white-space: nowrap;
    }

    .player-label.current-turn {
      color: gold;
      text-shadow: 0 0 5px black, 0 0 10px gold;
    }

    .player-hand {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 0.9vw;
    }

    card-element {
      cursor: pointer;
    }
  `;

  private handleCardClick(index: number) {
    if (!this.interactive) return;
    const wasSelected = this.selectedOrder.includes(index);
    audio.play(wasSelected ? 'card-deselect' : 'card-select');
    gameStore.toggleCardSelection(index);
  }

  render() {
    return html`
      <div class="player-hand-wrapper">
        <div class="player-label ${this.isCurrentTurn ? 'current-turn' : ''}">
          ${this.playerName} (${this.score})
        </div>
        <div class="player-hand">
          ${this.cards.map((card, i) => {
            const selIdx = this.selectedOrder.indexOf(i);
            const isSelected = selIdx !== -1;
            return html`
              <card-element
                class=${isSelected ? 'selected' : ''}
                .card=${card}
                .selected=${isSelected}
                .order=${isSelected ? selIdx + 1 : 0}
                .interactive=${this.interactive}
                @click=${() => this.handleCardClick(i)}
              ></card-element>
            `;
          })}
        </div>
      </div>
    `;
  }
}
