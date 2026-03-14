import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('opponent-hand')
export class OpponentHand extends LitElement {
  @property() name = '';
  @property({ type: Number }) cardCount = 0;
  @property({ type: Number }) score = 0;
  @property({ type: Boolean }) isCurrentTurn = false;
  @property() position: 'top' | 'left' | 'right' = 'top';

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
  `;

  render() {
    const backs = [];
    for (let i = 0; i < this.cardCount; i++) {
      backs.push(html`<div class="card-back"></div>`);
    }

    return html`
      <div class="opponent-box ${this.position}">
        <div class="opponent-hand">${backs}</div>
        <div class="player-label ${this.isCurrentTurn ? 'current-turn' : ''}">
          ${this.name} (${this.score})
        </div>
      </div>
    `;
  }
}
