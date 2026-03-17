import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './card-element.js';

@customElement('opponent-hand')
export class OpponentHand extends LitElement {
  @property() name = '';
  @property({ type: Number }) cardCount = 0;
  @property({ type: Number }) score = 0;
  @property({ type: Boolean }) isCurrentTurn = false;
  @property() position: 'top' | 'left' | 'right' = 'top';
  /** When provided, render actual cards face-up (spectator mode). */
  @property({ type: Array }) cards: string[] | null = null;
  @property({ type: Number }) handValue: number | null = null;

  static styles = css`
    :host { display: block; }

    .opponent-box {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 5;
      width: 15vw;
    }

    .opponent-box.open-hand {
      width: auto;
    }

    .opponent-box.top {
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
    }

    .opponent-box.left {
      left: 0%;
      top: 50%;
      transform: translateY(-50%) rotate(-90deg);
      transform-origin: center;
    }

    .opponent-box.right {
      right: 0%;
      top: 50%;
      transform: translateY(-50%) rotate(90deg);
      transform-origin: center;
    }

    .player-label {
      font-size: 2vw;
      font-weight: bold;
      color: white;
      text-shadow: 0 0 1vw black;
      margin-top: 0.5vw;
      text-align: center;
      white-space: nowrap;
    }

    .player-label.current-turn {
      color: gold;
      text-shadow: 0 0 5px black, 0 0 10px gold;
    }

    .opponent-hand {
      display: flex;
      gap: 0.3vw;
    }

    .card-back {
      width: 2.5vw;
      height: calc(2.5vw * 1.39);
      border-radius: 2px;
      background: white url("/card-back.svg") center center / cover no-repeat;
      box-sizing: border-box;
    }

    .open-cards-wrapper {
      display: flex;
      justify-content: center;
    }

    .open-cards {
      display: flex;
      gap: 0.3vw;
      transform: scale(1.5);
      transform-origin: center top;
    }

    /* Reserve space for scaled cards so label doesn't overlap.
       mini cards are 2.5vw * 1.39 tall; at 1.5x that's ~5.2vw.
       Original height is ~3.5vw, so extra = ~1.7vw */
    .opponent-box.open-hand .player-label {
      margin-top: 2vw;
    }
  `;

  render() {
    const hasOpenCards = this.cards && this.cards.length > 0;

    const handContent = hasOpenCards
      ? html`
          <div class="open-cards-wrapper">
            <div class="open-cards">
              ${this.cards!.map(card => html`
                <card-element mini .card=${card}></card-element>
              `)}
            </div>
          </div>
        `
      : html`
          <div class="opponent-hand">
            ${Array.from({ length: this.cardCount }, () => html`<div class="card-back"></div>`)}
          </div>
        `;

    const label = this.handValue != null
      ? `${this.name} (${this.score}) [${this.handValue}]`
      : `${this.name} (${this.score})`;

    return html`
      <div class="opponent-box ${this.position} ${hasOpenCards ? 'open-hand' : ''}">
        ${handContent}
        <div class="player-label ${this.isCurrentTurn ? 'current-turn' : ''}">
          ${label}
        </div>
      </div>
    `;
  }
}
