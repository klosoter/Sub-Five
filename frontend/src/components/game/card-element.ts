import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/**
 * Card element wrapping cardmeister's <playing-card> web component.
 * Also handles jokers (which cardmeister doesn't support) with custom styling.
 *
 * Selection/draw transforms are applied to the :host element itself
 * since we can't pierce cardmeister's shadow DOM.
 */

const RANK_MAP: Record<string, string> = {
  A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King',
  '10': '10', '9': '9', '8': '8', '7': '7',
  '6': '6', '5': '5', '4': '4', '3': '3', '2': '2',
};

const SUIT_MAP: Record<string, string> = {
  '♠': 'Spades', '♥': 'Hearts', '♦': 'Diamonds', '♣': 'Clubs',
};

@customElement('card-element')
export class CardElement extends LitElement {
  @property() card = '';          // e.g. "A♠", "10♥", "JOKER♠"
  @property({ type: Boolean }) selected = false;
  @property({ type: Number }) order = 0;
  @property({ type: Boolean }) faceDown = false;
  @property({ type: Boolean }) interactive = false;
  @property({ type: Boolean }) mini = false;  // smaller size for log cards

  static styles = css`
    /* === Host is the transform target for selection/draw highlight === */
    :host {
      display: inline-block;
      position: relative;
      transition: transform 0.15s ease;
      flex-shrink: 0;
    }

    :host(.selected) {
      transform: scale(1.1);
      z-index: 1;
    }

    :host(.draw-selected) {
      transform: scale(1.3);
      z-index: 1;
    }

    /* === Card sizes === */
    playing-card,
    .joker-card {
      width: 7vw;
      height: calc(7vw * 1.39);
      display: inline-block;
      box-sizing: border-box;
      flex-shrink: 0;
      vertical-align: top;
    }

    :host([mini]) playing-card,
    :host([mini]) .joker-card {
      width: 2.5vw;
      height: calc(2.5vw * 1.39);
    }

    playing-card {
      shape-rendering: geometricPrecision;
      image-rendering: pixelated;
      will-change: transform;
    }

    /* === Joker card styling — matches original === */
    .joker-card {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      background: white;
      border: 0.001vw solid #ccc;
      border-radius: 0.3vw;
      font-family: Arial, Helvetica, sans-serif;
      font-weight: bold;
      font-size: 1.2vw;
      color: black;
      text-align: center;
    }
    .joker-card[data-joker="♥"] { color: red; }

    .joker-face {
      width: 100%;
      font-size: 1.1vw;
      line-height: 1.1;
      text-transform: uppercase;
      white-space: nowrap;
    }
    :host([mini]) .joker-face { font-size: 0.6vw; }

    /* === Order badge === */
    .order-badge {
      position: absolute;
      top: -0.5vw;
      right: -0.5vw;
      width: 2vw;
      height: 2vw;
      background: orange;
      color: white;
      font-size: 1vw;
      font-weight: bold;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    :host([mini]) .order-badge { display: none; }

    .not-interactive { pointer-events: none; }
  `;

  private parseCard(): { rank: string; suit: string; isJoker: boolean } {
    if (this.card.startsWith('JOKER')) {
      return { rank: 'JOKER', suit: this.card.slice(-1), isJoker: true };
    }
    if (this.card.startsWith('10')) {
      return { rank: '10', suit: this.card[2], isJoker: false };
    }
    return { rank: this.card[0], suit: this.card[1], isJoker: false };
  }

  render() {
    // Card back: use cardmeister's built-in back rendering
    if (this.faceDown || !this.card) {
      return html`<playing-card cid="back"></playing-card>`;
    }

    const { rank, suit, isJoker } = this.parseCard();

    if (isJoker) {
      return html`
        <div class="joker-card ${!this.interactive ? 'not-interactive' : ''}" data-joker=${suit}>
          <div class="joker-face">JOKER${suit}</div>
        </div>
        ${this.selected && this.order > 0
          ? html`<div class="order-badge">${this.order}</div>`
          : nothing}
      `;
    }

    const rankAttr = RANK_MAP[rank] || rank;
    const suitAttr = SUIT_MAP[suit] || suit;

    return html`
      <playing-card
        class="${!this.interactive ? 'not-interactive' : ''}"
        rank=${rankAttr}
        suit=${suitAttr}
      ></playing-card>
      ${this.selected && this.order > 0
        ? html`<div class="order-badge">${this.order}</div>`
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'card-element': CardElement;
  }
}
