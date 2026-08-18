/**
 * Sound & Background Music Manager for WordWiz
 * Supports MP3 BGM (Ghibli Station by The Mini Vandals) with procedural synthesis
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxMuted = false;
    this.musicMuted = false;

    // Background Music Audio Element
    this.bgm = new Audio('/audio/ghibli_station.mp3');
    this.bgm.loop = true;
    this.bgm.volume = 0.35;
    this.bgmStarted = false;
    this.bgmUsingSynth = false;
    this.synthBgmTimer = null;

    // Setup error fallback to procedural Ghibli synthesizer
    this.bgm.addEventListener('error', () => {
      console.log('MP3 not found or blocked, falling back to procedural Ghibli ambient music.');
      if (!this.musicMuted && this.bgmStarted) {
        this.startProceduralGhibliBGM();
      }
    });
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

  /**
   * Start BGM on first user interaction
   */
  startBGM() {
    this.bgmStarted = true;
    if (this.musicMuted) return;

    this.resume();

    // Try playing MP3 first
    const playPromise = this.bgm.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback to procedural synth music
        this.startProceduralGhibliBGM();
      });
    }
  }

  toggleMusic() {
    this.musicMuted = !this.musicMuted;
    if (this.musicMuted) {
      this.bgm.pause();
      this.stopProceduralGhibliBGM();
    } else {
      this.bgmStarted = true;
      this.startBGM();
    }
    return !this.musicMuted;
  }

  toggleSFX() {
    this.sfxMuted = !this.sfxMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.sfxMuted ? 0 : 0.3, this.ctx.currentTime);
    }
    return !this.sfxMuted;
  }

  /**
   * Procedural Ghibli-inspired Pentatonic Harp/Piano Ambient Synth
   */
  startProceduralGhibliBGM() {
    if (this.synthBgmTimer || this.musicMuted) return;
    this.resume();
    if (!this.ctx) return;

    this.bgmUsingSynth = true;

    // Ghibli-esque warm pentatonic scale (D-major / B-minor: D4, E4, F#4, A4, B4, D5, E5, F#5)
    const scale = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25, 739.99];
    const chords = [
      [293.66, 369.99, 440.00], // D
      [246.94, 293.66, 369.99, 440.00], // Bm7
      [220.00, 277.18, 329.63, 440.00], // A
      [196.00, 246.94, 293.66, 369.99]  // Gmaj7
    ];

    let chordIdx = 0;
    let step = 0;

    const playNote = () => {
      if (this.musicMuted || !this.bgmUsingSynth) return;
      const t = this.ctx.currentTime;

      // Chord root/harmony every 8 beats
      if (step % 8 === 0) {
        const chord = chords[chordIdx % chords.length];
        chord.forEach(freq => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq / 2, t);

          gain.gain.setValueAtTime(0.04, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 2.5);
        });
        chordIdx++;
      }

      // Melody harp arpeggio
      if (Math.random() < 0.75) {
        const freq = scale[Math.floor(Math.random() * scale.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 1.2);
      }

      step++;
      this.synthBgmTimer = setTimeout(playNote, 400 + Math.random() * 200);
    };

    playNote();
  }

  stopProceduralGhibliBGM() {
    this.bgmUsingSynth = false;
    if (this.synthBgmTimer) {
      clearTimeout(this.synthBgmTimer);
      this.synthBgmTimer = null;
    }
  }

  /**
   * Sound FX
   */
  playTileClick(index = 0) {
    if (this.sfxMuted) return;
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
    if (this.sfxMuted) return;
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
    if (this.sfxMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
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
    if (this.sfxMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
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

    setTimeout(() => {
      if (!this.ctx || this.sfxMuted) return;
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
    if (this.sfxMuted) return;
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
    if (this.sfxMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99];
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
    if (this.sfxMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
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
    if (this.sfxMuted) return;
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
    if (this.sfxMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const fanfare = [
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.12 },
      { f: 1046.50, d: 0.35 },
      { f: 880.00, d: 0.12 },
      { f: 1046.50, d: 0.5 }
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
    if (this.sfxMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 415.30, 392, 349.23];
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
