export class HelixAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastThunder = 0;

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    const drone = ctx.createOscillator();
    const tone = ctx.createGain();
    drone.type = "sine";
    drone.frequency.value = 55;
    tone.gain.value = 0.035;
    drone.connect(tone);
    tone.connect(master);
    drone.start();
    const over = ctx.createOscillator();
    const overGain = ctx.createGain();
    over.type = "triangle";
    over.frequency.value = 110;
    overGain.gain.value = 0.012;
    over.connect(overGain);
    overGain.connect(master);
    over.start();
    this.ctx = ctx;
    this.master = master;
    void ctx.resume();
  }

  chime() {
    this.tone(660, 0.09, "sine", 0.18);
    this.tone(990, 0.14, "triangle", 0.08);
  }

  hop() {
    this.tone(180, 0.06, "square", 0.05);
  }

  thunder() {
    const now = performance.now();
    if (!this.ctx || !this.master || now - this.lastThunder < 400) return;
    this.lastThunder = now;
    const ctx = this.ctx;
    const frames = Math.floor(ctx.sampleRate * 0.55);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      const env = Math.pow(1 - i / frames, 1.6);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 240;
    const gain = ctx.createGain();
    gain.gain.value = 0.55;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
  }

  private tone(freq: number, seconds: number, type: OscillatorType, volume: number) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + seconds + 0.02);
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }
}
