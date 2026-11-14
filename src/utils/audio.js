// Native Web Audio Synthesizer for UI sound effects, visualizer frequencies & ambient focus soundscapes
// Zero external mp3 dependencies - works 100% offline, reliably and instantly!

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.analyser = null;
    this.ambienceSource = null;
    this.ambienceGain = null;
    this.currentAmbience = "none";
    this.ambienceVolume = 0.35;
    this.lofiTimer = null;
    this.frequencyArray = null;
    this.listeners = new Set();

    try {
      this.muted = localStorage.getItem("study-shelf:audio-muted") === "true";
    } catch {
      this.muted = false;
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      currentAmbience: this.currentAmbience,
      muted: this.muted,
      volume: this.ambienceVolume,
    });
    return () => {
      this.listeners.delete(callback);
    };
  }

  notify() {
    const state = {
      currentAmbience: this.currentAmbience,
      muted: this.muted,
      volume: this.ambienceVolume,
    };
    this.listeners.forEach((callback) => {
      try {
        callback(state);
      } catch (err) {
        console.error("Audio subscriber error:", err);
      }
    });
  }

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;
        this.frequencyArray = new Uint8Array(this.analyser.frequencyBinCount);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  getFrequencies() {
    if (!this.analyser || !this.frequencyArray) return new Uint8Array(32);
    this.analyser.getByteFrequencyData(this.frequencyArray);
    return this.frequencyArray;
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muted) {
    this.muted = muted;
    try {
      localStorage.setItem("study-shelf:audio-muted", String(muted));
    } catch {}

    if (this.muted && this.ambienceGain) {
      this.ambienceGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    } else if (!this.muted && this.ambienceGain) {
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume, this.ctx?.currentTime || 0);
    }
    this.notify();
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Play subtle UI interaction chime
  playBeep(freq = 520, type = "sine", duration = 0.08, gainVal = 0.05) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  // Subtle cyber click on cards/buttons
  playClick() {
    this.playBeep(480, "triangle", 0.04, 0.035);
  }

  // Hover tone
  playHover() {
    this.playBeep(880, "sine", 0.025, 0.012);
  }

  // Sci-fi whoosh
  playWhoosh() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {}
  }

  // Cinematic warp chord on intro enter
  playIntroChord() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const frequencies = [220, 277.18, 329.63, 440, 554.37];
      frequencies.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq * 0.8, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + 0.6);

        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04 / (i + 1), this.ctx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 2.3);
      });
    } catch {}
  }

  // Set ambient focus soundscape
  setAmbience(type) {
    this.init();
    if (!this.ctx) return;

    if (this.lofiTimer) {
      clearInterval(this.lofiTimer);
      this.lofiTimer = null;
    }

    if (this.ambienceSource) {
      try {
        this.ambienceSource.stop?.();
        this.ambienceSource.disconnect?.();
      } catch {}
      this.ambienceSource = null;
    }

    if (type === "none" || !type) {
      this.currentAmbience = "none";
      this.notify();
      return;
    }

    this.currentAmbience = type;
    this.notify();

    try {
      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.muted ? 0 : this.ambienceVolume, this.ctx.currentTime);
      
      // Route through analyser for visualizer!
      if (this.analyser) {
        this.ambienceGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      } else {
        this.ambienceGain.connect(this.ctx.destination);
      }

      if (type === "rain") {
        // Synthesize gentle rainfall using filtered white noise
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.4;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(750, this.ctx.currentTime);

        const filter2 = this.ctx.createBiquadFilter();
        filter2.type = "highpass";
        filter2.frequency.setValueAtTime(180, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(filter2);
        filter2.connect(this.ambienceGain);

        noise.start();
        this.ambienceSource = noise;
      } else if (type === "space") {
        // Deep cosmic resonant drone
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const osc3 = this.ctx.createOscillator();

        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(110.5, this.ctx.currentTime); // Slight detune

        osc3.type = "triangle";
        osc3.frequency.setValueAtTime(165, this.ctx.currentTime); // Fifth

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(180, this.ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        filter.connect(this.ambienceGain);

        osc1.start();
        osc2.start();
        osc3.start();

        this.ambienceSource = {
          stop: () => {
            osc1.stop();
            osc2.stop();
            osc3.stop();
          },
          disconnect: () => {
            osc1.disconnect();
            osc2.disconnect();
            osc3.disconnect();
            filter.disconnect();
          },
        };
      } else if (type === "binaural") {
        // 432Hz deep meditative focus
        const oscLeft = this.ctx.createOscillator();
        const oscRight = this.ctx.createOscillator();

        oscLeft.type = "sine";
        oscLeft.frequency.setValueAtTime(432, this.ctx.currentTime);

        oscRight.type = "sine";
        oscRight.frequency.setValueAtTime(438, this.ctx.currentTime); // 6Hz theta difference

        const merger = this.ctx.createChannelMerger(2);
        oscLeft.connect(merger, 0, 0);
        oscRight.connect(merger, 0, 1);
        merger.connect(this.ambienceGain);

        oscLeft.start();
        oscRight.start();

        this.ambienceSource = {
          stop: () => {
            oscLeft.stop();
            oscRight.stop();
          },
          disconnect: () => {
            oscLeft.disconnect();
            oscRight.disconnect();
            merger.disconnect();
          },
        };
      } else if (type === "lofi") {
        // Generative Lo-Fi chord progression: Dm9 -> G13 -> Cmaj7 -> Am9
        const chords = [
          [146.83, 220.00, 261.63, 329.63], // Dm9
          [196.00, 246.94, 329.63, 392.00], // G13
          [130.81, 196.00, 246.94, 329.63], // Cmaj7
          [220.00, 261.63, 329.63, 440.00], // Am9
        ];
        let chordIndex = 0;

        const playChord = () => {
          if (this.currentAmbience !== "lofi" || !this.ctx) return;
          const currentChord = chords[chordIndex % chords.length];
          chordIndex++;

          currentChord.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = idx % 2 === 0 ? "sine" : "triangle";
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(480, this.ctx.currentTime);

            const now = this.ctx.currentTime;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.04, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ambienceGain);

            osc.start(now);
            osc.stop(now + 3.5);
          });
        };

        playChord();
        this.lofiTimer = setInterval(playChord, 3800);

        this.ambienceSource = {
          stop: () => {
            if (this.lofiTimer) clearInterval(this.lofiTimer);
          },
          disconnect: () => {
            if (this.lofiTimer) clearInterval(this.lofiTimer);
          },
        };
      }
    } catch (e) {
      console.warn("Could not start ambient sound:", e);
    }
  }

  setVolume(volume) {
    this.ambienceVolume = Math.max(0, Math.min(1, volume));
    if (this.ambienceGain && !this.muted) {
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume, this.ctx?.currentTime || 0);
    }
    this.notify();
  }

  // Success chime for CBT correct answer / high score
  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.001, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.04, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.36);
      });
    } catch {}
  }

  // Error buzz for CBT incorrect answer / alert
  playError() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.2);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  // Holographic card tilt magnetic tick
  playTiltTick() {
    this.playBeep(1200, "sine", 0.015, 0.008);
  }
}

export const soundEngine = new SoundEngine();
