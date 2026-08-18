/**
 * Procedural Web Audio Sound Synthesizer for WordWiz
 * High quality fantasy sound effects with 0 external asset dependencies
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.3, this.ctx.currentTime);
    }
    return this.muted;
  }

  /**
   * Sound when clicking a letter tile (pitch increases with word length)
   */
  playTileClick(index = 0) {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 440 * Math.pow(1.06, index % 12);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playTileDeselect() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  playValidWord() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + i * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  playCastSpell(type = 'normal') {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Laser / fireball sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type === 'ruby' ? 'sawtooth' : 'sine';

    const startFreq = type === 'ruby' ? 220 : 600;
    const endFreq = type === 'ruby' ? 880 : 200;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.3);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.35);

    // Shimmering explosion burst
    setTimeout(() => {
      if (!this.ctx) return;
      const t2 = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, t2);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.2, t2);
      nGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.2);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.masterGain);

      noise.start(t2);
      noise.stop(t2 + 0.2);
    }, 150);
  }

  playEnemyAttack() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.25);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  playHeal() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + i * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  playPotion() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Glug bubbling
    [240, 320, 280, 360, 420].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + i * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, st + 0.04);

      gain.gain.setValueAtTime(0.2, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(st);
      osc.stop(st + 0.05);
    });
  }

  playScramble() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.15);
    osc.frequency.linearRampToValueAtTime(300, t + 0.3);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  playVictory() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const fanfare = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.50, d: 0.35 }, // C6
      { f: 880.00, d: 0.12 },  // A5
      { f: 1046.50, d: 0.5 }   // C6
    ];

    let current = t;
    fanfare.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, current);

      gain.gain.setValueAtTime(0.25, current);
      gain.gain.exponentialRampToValueAtTime(0.001, current + n.d);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(current);
      osc.stop(current + n.d);
      current += n.d * 0.9;
    });
  }

  playGameOver() {
    if (this.muted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 415.30, 392, 349.23]; // A4, Ab4, G4, F4 minor descent
    let current = t;
    notes.forEach((f) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, current);

      gain.gain.setValueAtTime(0.18, current);
      gain.gain.exponentialRampToValueAtTime(0.001, current + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(current);
      osc.stop(current + 0.4);
      current += 0.35;
    });
  }
}

export const soundManager = new SoundManager();
