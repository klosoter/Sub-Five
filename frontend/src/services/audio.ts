/**
 * Audio service for Sub-Five.
 *
 * Generates all sounds programmatically via Web Audio API —
 * no audio files to load or manage.
 */

type SoundName =
  | 'card-play'
  | 'card-draw'
  | 'card-select'
  | 'card-deselect'
  | 'shuffle'
  | 'your-turn'
  | 'round-end'
  | 'game-over'
  | 'error'
  | 'button-click'
  | 'timer-warning'
  | 'timer-danger';

class AudioService {
  private ctx: AudioContext | null = null;
  private _muted = false;
  private _volume = 0.5;

  get muted() { return this._muted; }
  set muted(v: boolean) { this._muted = v; }

  get volume() { return this._volume; }
  set volume(v: number) { this._volume = Math.max(0, Math.min(1, v)); }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  play(sound: SoundName) {
    if (this._muted) return;
    try {
      switch (sound) {
        case 'card-play': this.playCardPlay(); break;
        case 'card-draw': this.playCardDraw(); break;
        case 'card-select': this.playCardSelect(); break;
        case 'card-deselect': this.playCardDeselect(); break;
        case 'shuffle': this.playShuffle(); break;
        case 'your-turn': this.playYourTurn(); break;
        case 'round-end': this.playRoundEnd(); break;
        case 'game-over': this.playGameOver(); break;
        case 'error': this.playError(); break;
        case 'button-click': this.playButtonClick(); break;
        case 'timer-warning': this.playTimerWarning(); break;
        case 'timer-danger': this.playTimerDanger(); break;
      }
    } catch {
      // Audio failures are non-critical
    }
  }

  /** Short percussive snap — card hitting the table */
  private playCardPlay() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.4;

    // Noise burst for the snap
    const duration = 0.08;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(t);
    noise.stop(t + duration);
  }

  /** Softer slide sound — drawing a card */
  private playCardDraw() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.25;

    const duration = 0.12;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(t);
    noise.stop(t + duration);
  }

  /** Tiny click up — selecting a card */
  private playCardSelect() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.15;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.04);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /** Tiny click down — deselecting a card */
  private playCardDeselect() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.12;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  /** Rapid series of noise bursts — shuffling cards */
  private playShuffle() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.2;

    for (let i = 0; i < 8; i++) {
      const offset = i * 0.05;
      const duration = 0.04;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) {
        data[j] = (Math.random() * 2 - 1) * (1 - j / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600 + i * 100;
      filter.Q.value = 2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol * (0.5 + Math.random() * 0.5), t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + duration);

      noise.connect(filter).connect(gain).connect(ctx.destination);
      noise.start(t + offset);
      noise.stop(t + offset + duration);
    }
  }

  /** Bright two-tone chime — it's your turn */
  private playYourTurn() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.25;

    const notes = [660, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = t + i * 0.12;
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  /** Descending arpeggio — round ended */
  private playRoundEnd() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.3;

    const notes = [880, 660, 440, 330];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = t + i * 0.15;
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /** Fanfare — game over */
  private playGameOver() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.3;

    // C major chord arpeggio
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = t + i * 0.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  }

  /** Low buzz — error */
  private playError() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.2;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 150;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** Soft tap */
  private playButtonClick() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.1;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  /** Single warning tone */
  private playTimerWarning() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.15;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /** Urgent double-beep */
  private playTimerDanger() {
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const vol = this._volume * 0.2;

    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 880;

      const gain = ctx.createGain();
      const start = t + i * 0.12;
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;

      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.08);
    }
  }
}

/** Singleton audio service */
export const audio = new AudioService();
