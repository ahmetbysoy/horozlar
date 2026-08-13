// ============================================================
// AUDIO MANAGER — Web Audio API ile sentezlenmiş ses efektleri
// Doküman §8.1 (ADSR envelope)
// ============================================================

class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.45;
    this.master = null;
  }

  // Kullanıcı etkileşiminden sonra çağrılır (autoplay policy)
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    } catch (e) { /* audio yok */ }
  }

  playTone(frequency, duration, type = 'sine', volume = 1, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t0);

    // ADSR
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.linearRampToValueAtTime(volume * 0.7, t0 + 0.05);
    gain.gain.setValueAtTime(volume * 0.7, t0 + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, t0 + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  // --- Oyun sesleri ---
  hit()        { this.playTone(180, 0.09, 'square', 0.7); }
  crit()       { this.playTone(320, 0.18, 'sawtooth', 0.9); this.playTone(160, 0.22, 'square', 0.6); }
  dodge()      { this.playTone(620, 0.14, 'sine', 0.5); }
  skill()      { this.playTone(440, 0.12, 'triangle', 0.7); this.playTone(660, 0.12, 'triangle', 0.6, 0.06); }
  click()      { this.playTone(800, 0.05, 'sine', 0.4); }
  coin()       { this.playTone(1000, 0.09, 'sine', 0.6); setTimeout(() => this.playTone(1300, 0.12, 'sine', 0.6), 80); }
  win()        { [523, 659, 784, 1046].forEach((f, i) => this.playTone(f, 0.25, 'sine', 0.7, i * 0.14)); }
  lose()       { this.playTone(220, 0.3, 'sawtooth', 0.6); this.playTone(150, 0.4, 'sawtooth', 0.5, 0.2); }
  roar()       { this.playTone(90, 0.4, 'sawtooth', 0.8); this.playTone(60, 0.5, 'square', 0.7, 0.05); }
  train()      { this.playTone(500, 0.1, 'triangle', 0.6); this.playTone(750, 0.12, 'triangle', 0.6, 0.1); }

  toggle() { this.enabled = !this.enabled; return this.enabled; }
}

export const audio = new AudioManager();
export default audio;
