function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createNoiseBuffer(context) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

export class AudioManager {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.ambientOscillator = null;
    this.noiseSource = null;
    this.noiseGain = null;
    this.lastFootstepAt = 0;
    this.currentChamber = null;
    this.enabled = false;
  }

  async unlock() {
    if (!this.context) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;

      if (!AudioCtor) {
        return;
      }

      this.context = new AudioCtor();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.18;
      this.masterGain.connect(this.context.destination);

      this.ambientGain = this.context.createGain();
      this.ambientGain.gain.value = 0.0001;
      this.ambientGain.connect(this.masterGain);

      this.ambientOscillator = this.context.createOscillator();
      this.ambientOscillator.type = "triangle";
      this.ambientOscillator.frequency.value = 120;
      this.ambientOscillator.connect(this.ambientGain);
      this.ambientOscillator.start();

      this.noiseGain = this.context.createGain();
      this.noiseGain.gain.value = 0.0001;
      this.noiseGain.connect(this.masterGain);

      this.noiseSource = this.context.createBufferSource();
      this.noiseSource.buffer = createNoiseBuffer(this.context);
      this.noiseSource.loop = true;
      this.noiseSource.connect(this.noiseGain);
      this.noiseSource.start();
    }

    await this.context.resume();
    this.enabled = true;
  }

  setChamber(chamberId) {
    if (!this.context || this.currentChamber === chamberId) {
      return;
    }

    this.currentChamber = chamberId;
    const now = this.context.currentTime;
    const frequencyMap = {
      start: 122,
      debate: 92,
      hallOfDelay: 78,
      stageOfMasks: 142,
      consequence: 68,
    };
    const noiseMap = {
      start: 0.015,
      debate: 0.022,
      hallOfDelay: 0.028,
      stageOfMasks: 0.02,
      consequence: 0.032,
    };

    this.ambientOscillator.frequency.cancelScheduledValues(now);
    this.ambientOscillator.frequency.linearRampToValueAtTime(frequencyMap[chamberId] ?? 110, now + 1.2);
    this.ambientGain.gain.cancelScheduledValues(now);
    this.ambientGain.gain.linearRampToValueAtTime(0.028, now + 0.8);
    this.noiseGain.gain.cancelScheduledValues(now);
    this.noiseGain.gain.linearRampToValueAtTime(noiseMap[chamberId] ?? 0.018, now + 0.9);
  }

  playFootstep(intensity = 1) {
    if (!this.context || !this.enabled) {
      return;
    }

    const now = this.context.currentTime;

    if (now - this.lastFootstepAt < 0.24) {
      return;
    }

    this.lastFootstepAt = now;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = 95 + Math.random() * 40;
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    gain.gain.exponentialRampToValueAtTime(clamp(0.018 * intensity, 0.008, 0.03), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    oscillator.start(now);
    oscillator.stop(now + 0.12);
  }

  playInteraction(kind = "default") {
    if (!this.context || !this.enabled) {
      return;
    }

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = kind === "transition" ? "sawtooth" : "sine";
    oscillator.frequency.value = kind === "fragment" ? 420 : kind === "plate" ? 310 : 260;
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    oscillator.start(now);
    oscillator.stop(now + 0.36);
  }

  playEnding(endingId) {
    if (!this.context || !this.enabled) {
      return;
    }

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = endingId === "fractured" ? "sawtooth" : "triangle";
    oscillator.frequency.value = endingId === "avenger" ? 110 : endingId === "actor" ? 176 : endingId === "philosopher" ? 132 : 98;
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    oscillator.start(now);
    oscillator.stop(now + 1.85);
  }
}