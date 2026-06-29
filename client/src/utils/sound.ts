/** Web Audio API sound effects */
class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.7;

  init(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = volume;
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = this.volume * 0.3;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  cardDraw() { this.playTone(400, 0.1); setTimeout(() => this.playTone(500, 0.1), 50); }
  cardPlay() { this.playTone(600, 0.15, 'square'); }
  uno() { this.playTone(800, 0.1); setTimeout(() => this.playTone(1000, 0.2), 100); }
  winner() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.playTone(f, 0.2), i * 150));
  }
  buttonClick() { this.playTone(300, 0.05); }
  lobbyJoin() { this.playTone(440, 0.15); }
  countdown() { this.playTone(700, 0.1); }
  error() { this.playTone(200, 0.3, 'sawtooth'); }
}

export const soundManager = new SoundManager();
