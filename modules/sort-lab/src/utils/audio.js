// Native Web Audio API Procedural Synthesizer
// Zero external sound files - 100% procedurally synthesized in browser

class SoundManager {
  constructor() {
    this.ctx = null;
    this.mode = 'chimes'; // 'chimes' | 'clicks' | 'muted'
    this.minFreq = 180;
    this.maxFreq = 1100;
    this.masterGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMode(mode) {
    this.mode = mode; // 'chimes' | 'clicks' | 'muted'
  }

  getMode() {
    return this.mode;
  }

  cycleMode() {
    if (this.mode === 'chimes') this.mode = 'clicks';
    else if (this.mode === 'clicks') this.mode = 'muted';
    else this.mode = 'chimes';
    this.init();
    return this.mode;
  }

  // Value normalized between 0.0 and 1.0
  playTone(normValue, type = 'compare') {
    if (this.mode === 'muted') return;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const clampedNorm = Math.max(0, Math.min(1, normValue));

    // Logarithmic pitch mapping: f = min * (max / min)^norm
    const freq = this.minFreq * Math.pow(this.maxFreq / this.minFreq, clampedNorm);

    if (this.mode === 'clicks') {
      this.playMechanicalClick(freq, now, type);
    } else {
      this.playKalimbaChime(freq, now, type);
    }
  }

  playKalimbaChime(freq, now, type) {
    const isSwap = type === 'swap' || type === 'shift';
    const isSorted = type === 'sorted';

    const duration = isSorted ? 0.25 : (isSwap ? 0.18 : 0.09);
    const volume = isSwap ? 0.35 : (isSorted ? 0.4 : 0.22);

    // Fundamental oscillator (triangle wave gives warm marimba/kalimba body)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = isSwap ? 'sawtooth' : 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    // Soft 2nd harmonic (octave higher)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);

    // 3rd harmonic (5th above octave)
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, now);

    // Smooth envelope attack to prevent pop/click
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(volume, now + 0.006);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.exponentialRampToValueAtTime(volume * 0.25, now + 0.005);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    gain3.gain.setValueAtTime(0.0001, now);
    gain3.gain.exponentialRampToValueAtTime(volume * 0.1, now + 0.005);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.4);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    gain1.connect(this.masterGain);
    gain2.connect(this.masterGain);
    gain3.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + duration + 0.01);
    osc2.stop(now + duration + 0.01);
    osc3.stop(now + duration + 0.01);
  }

  playMechanicalClick(freq, now, type) {
    const isSwap = type === 'swap' || type === 'shift';
    const clickDuration = isSwap ? 0.035 : 0.02;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(isSwap ? 380 : 800, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + clickDuration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq * 1.5, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + clickDuration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + clickDuration + 0.01);
  }

  // Ascending celebratory fanfare arpeggio upon sorting completion
  playVictoryFanfare() {
    if (this.mode === 'muted') return;
    this.init();
    if (!this.ctx || this.ctx.state !== 'running') return;

    // Major pentatonic victory chords: C5, E5, G5, A5, C6, E6, G6
    const chordFrequencies = [523.25, 659.25, 783.99, 880.0, 1046.5, 1318.51, 1567.98];
    const now = this.ctx.currentTime;

    chordFrequencies.forEach((f, idx) => {
      const noteTime = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.28, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    });
  }
}

export const soundManager = new SoundManager();
