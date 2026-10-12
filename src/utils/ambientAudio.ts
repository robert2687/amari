/**
 * Procedural ambient sound synthesis using Web Audio API.
 * Never fails or 404s, requires zero external audio assets.
 */

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentMode: 'off' | 'rain' | 'fireplace' | 'twilight' = 'off';
  private masterGain: GainNode | null = null;
  private nodes: AudioNode[] = [];
  private isMuted: boolean = false;
  private volume: number = 0.25;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public stop() {
    this.currentMode = 'off';
    if (this.nodes.length > 0 && this.ctx) {
      this.nodes.forEach((n) => {
        try {
          if ('stop' in n && typeof (n as any).stop === 'function') {
            (n as any).stop();
          }
          n.disconnect();
        } catch {
          // ignore
        }
      });
      this.nodes = [];
    }
  }

  public play(mode: 'rain' | 'fireplace' | 'twilight') {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.stop();
    this.currentMode = mode;

    if (mode === 'rain') {
      this.startRain();
    } else if (mode === 'fireplace') {
      this.startFireplace();
    } else if (mode === 'twilight') {
      this.startTwilight();
    }
  }

  public getMode(): 'off' | 'rain' | 'fireplace' | 'twilight' {
    return this.currentMode;
  }

  private startRain() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise generator for gentle soothing rainfall
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to make it sound like outdoor window rain
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    this.nodes.push(whiteNoise, filter, gain);
  }

  private startFireplace() {
    if (!this.ctx || !this.masterGain) return;
    // Low frequency warm rumble
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(65, this.ctx.currentTime);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start();
    this.nodes.push(osc, oscGain);

    // Filtered crackle noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * (Math.random() > 0.985 ? 0.35 : 0.02);
    }

    const crackleSource = this.ctx.createBufferSource();
    crackleSource.buffer = noiseBuffer;
    crackleSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    crackleSource.connect(filter);
    filter.connect(crackleGain);
    crackleGain.connect(this.masterGain);

    crackleSource.start();
    this.nodes.push(crackleSource, filter, crackleGain);
  }

  private startTwilight() {
    if (!this.ctx || !this.masterGain) return;
    // Soothing lush ambient harmonic pad
    const freqs = [174.61, 220.0, 261.63, 329.63]; // F maj7 soothing chord
    freqs.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      this.nodes.push(osc, gain);
    });
  }
}

export const ambientSound = new AmbientSoundEngine();
