import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { audio } from '../../services/audio.js';

@customElement('turn-timer')
export class TurnTimer extends LitElement {
  @property({ type: Number }) duration = 30; // seconds
  @property({ type: Boolean }) active = false;
  @property({ type: Boolean }) isMyTurn = false;
  @state() remaining = 0;
  private interval?: number;

  static styles = css`
    :host { display: block; }

    .timer-ring {
      position: relative;
      width: 4vw;
      height: 4vw;
    }

    svg {
      transform: rotate(-90deg);
      width: 100%;
      height: 100%;
    }

    .track {
      fill: none;
      stroke: rgba(255, 255, 255, 0.1);
      stroke-width: 3;
    }

    .progress {
      fill: none;
      stroke-width: 3;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear, stroke 0.3s;
    }

    .progress.plenty { stroke: #4ade80; }
    .progress.warning { stroke: #fbbf24; }
    .progress.danger { stroke: #ef4444; }

    .time-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1vw;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .time-text.danger { color: #ef4444; }
    .time-text.warning { color: #fbbf24; }
    .time-text.plenty { color: rgba(255, 255, 255, 0.7); }
  `;

  updated(changed: Map<string, unknown>) {
    if (changed.has('active') || changed.has('isMyTurn')) {
      if (this.active) {
        this.startTimer();
      } else {
        this.stopTimer();
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopTimer();
  }

  private startTimer() {
    this.stopTimer();
    this.remaining = this.duration;
    this.interval = window.setInterval(() => {
      this.remaining--;
      // Sound cues for the active player
      if (this.isMyTurn) {
        const fraction = this.remaining / this.duration;
        if (fraction <= 0.2 && fraction > 0) {
          audio.play('timer-danger');
        } else if (Math.abs(fraction - 0.5) < 0.02) {
          audio.play('timer-warning');
        }
      }
      if (this.remaining <= 0) {
        this.remaining = 0;
        this.stopTimer();
        this.dispatchEvent(new CustomEvent('timeout'));
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  render() {
    if (!this.active || this.duration <= 0) return nothing;

    const fraction = this.remaining / this.duration;
    const circumference = 2 * Math.PI * 18; // r=18 in viewbox
    const offset = circumference * (1 - fraction);
    const urgency = fraction > 0.5 ? 'plenty' : fraction > 0.2 ? 'warning' : 'danger';

    return html`
      <div class="timer-ring">
        <svg viewBox="0 0 40 40">
          <circle class="track" cx="20" cy="20" r="18" />
          <circle
            class="progress ${urgency}"
            cx="20" cy="20" r="18"
            stroke-dasharray=${circumference}
            stroke-dashoffset=${offset}
          />
        </svg>
        <span class="time-text ${urgency}">${this.remaining}</span>
      </div>
    `;
  }
}
