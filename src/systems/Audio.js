/**
 * Placeholder sound effects using Web Audio API tone generation.
 */
export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    switch (type) {
      case 'punch': this.noise(0.05, 800, 0.15); break;
      case 'kick': this.noise(0.07, 400, 0.2); break;
      case 'hit': this.tone(0.05, 300, 200, 0.12); break;
      case 'hurt': this.tone(0.08, 200, 100, 0.15); break;
      case 'death': this.sweep(0.15, 400, 80, 0.2); break;
      case 'boss-hit': this.tone(0.06, 150, 80, 0.25); break;
      case 'boss-roar': this.sweep(0.3, 100, 50, 0.3); break;
      case 'jump': this.tone(0.05, 400, 600, 0.08); break;
    }
  }

  tone(duration, freqStart, freqEnd, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  noise(duration, freq, volume) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 2;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  sweep(duration, freqStart, freqEnd, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
}
