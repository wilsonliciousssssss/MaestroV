const AudioEngine = {
  enabled: false,
  context: null,
  analyser: null,
  data: null,
  source: null,
  stream: null,
  sourceType: 'fallback',
  bass: 0,
  mid: 0,
  high: 0,
  beat: 0,
  bpm: 0,
  lastBeatAt: 0,
  status: 'Mic off',

  async start() {
    return this.startMicrophone();
  },

  async prepareContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    return this.context;
  },

  /* V112 — real spectrum: log-spaced bins from the analyser (0..1), or null in fallback mode. */
  spectrum(bins = 48) {
    if (!this.enabled || !this.analyser || !this.data) return null;
    const n = this.data.length;
    const out = new Array(bins);
    for (let i = 0; i < bins; i++) {
      const f0 = Math.max(1, Math.floor(Math.pow(n, i / bins)));
      const f1 = Math.max(f0 + 1, Math.floor(Math.pow(n, (i + 1) / bins)));
      let sum = 0;
      for (let k = f0; k < f1 && k < n; k++) sum += this.data[k];
      out[i] = sum / ((f1 - f0) * 255);
    }
    return out;
  },

  stopCurrentStream() {
    if (this.source) {
      try { this.source.disconnect(); } catch (error) { /* already disconnected — safe to ignore during teardown */ }
      this.source = null;
    }
    if (this.stream) {
      try { this.stream.getTracks().forEach((track) => track.stop()); } catch (error) { /* tracks already stopped — safe to ignore during teardown */ }
      this.stream = null;
    }
    this.enabled = false;
  },

  async attachStream(stream, sourceType, statusText) {
    await this.prepareContext();
    this.stopCurrentStream();
    this.stream = stream;
    this.source = this.context.createMediaStreamSource(stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.72;
    this.data = new Uint8Array(this.analyser.frequencyBinCount);
    this.source.connect(this.analyser);
    this.enabled = true;
    this.sourceType = sourceType;
    this.status = statusText;

    const audioTracks = stream.getAudioTracks ? stream.getAudioTracks() : [];
    audioTracks.forEach((track) => {
      track.onended = () => {
        this.enabled = false;
        this.sourceType = 'fallback';
        this.status = `${statusText} ended`;
      };
    });

    return true;
  },

  async startMicrophone() {
    if (this.enabled && this.sourceType === 'microphone') return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      return await this.attachStream(stream, 'microphone', 'Microphone input');
    } catch (error) {
      console.warn('Microphone unavailable, using synthetic audio fallback', error);
      this.enabled = false;
      this.sourceType = 'fallback';
      this.status = 'Mic blocked / fallback';
      return false;
    }
  },

  async startSystemAudio() {
    if (this.enabled && this.sourceType === 'system') return true;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      this.status = 'System audio capture unsupported';
      this.sourceType = this.enabled ? this.sourceType : 'fallback';
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const audioTracks = stream.getAudioTracks ? stream.getAudioTracks() : [];
      const videoTracks = stream.getVideoTracks ? stream.getVideoTracks() : [];

      // We only need audio analysis. Stop the visual screen-share track after permission is granted.
      videoTracks.forEach((track) => track.stop());

      if (!audioTracks.length) {
        stream.getTracks().forEach((track) => track.stop());
        this.enabled = false;
        this.sourceType = 'fallback';
        this.status = 'No system audio selected';
        return false;
      }

      const audioOnlyStream = new MediaStream(audioTracks);
      return await this.attachStream(audioOnlyStream, 'system', 'Sound card / tab audio');
    } catch (error) {
      console.warn('System audio capture unavailable, using fallback', error);
      this.enabled = false;
      this.sourceType = 'fallback';
      this.status = 'System audio blocked / fallback';
      return false;
    }
  },

  async cycleSource() {
    if (this.sourceType === 'microphone') {
      return this.startSystemAudio();
    }
    return this.startMicrophone();
  },

  update() {
    if (this.enabled && this.analyser) {
      this.analyser.getByteFrequencyData(this.data);
      const gain = VisualState.controls.audioGain || 1;
      const bass = this.avg(1, 8) / 255 * gain * (VisualState.controls.bassBoost || 1);
      const mid = this.avg(9, 48) / 255 * gain * (VisualState.controls.midBoost || 1);
      const high = this.avg(49, 180) / 255 * gain * (VisualState.controls.highBoost || 1);
      this.bass = smooth(this.bass, clamp(bass, 0, 1), 0.18);
      this.mid = smooth(this.mid, clamp(mid, 0, 1), 0.14);
      this.high = smooth(this.high, clamp(high, 0, 1), 0.12);
    } else {
      const t = performance.now() * 0.001;
      this.bass = smooth(this.bass, 0.45 + Math.sin(t * 2.0) * 0.25 + Math.sin(t * 5.1) * 0.08, 0.08);
      this.mid = smooth(this.mid, 0.35 + Math.sin(t * 1.3 + 1) * 0.2, 0.08);
      this.high = smooth(this.high, 0.28 + Math.sin(t * 3.2 + 2) * 0.18, 0.08);
    }
    const impact = (VisualState.controls.beatImpact || 58) / 100;
    const energy = clamp(this.bass * 0.62 + this.mid * 0.24 + this.high * 0.14, 0, 1);
    this.beat = smooth(this.beat, energy > 0.58 ? energy * impact : energy * 0.32, 0.28);
    const now = performance.now();
    if (this.beat > 0.5 && now - this.lastBeatAt > 260) {
      if (this.lastBeatAt > 0) {
        const delta = now - this.lastBeatAt;
        const bpm = clamp(60000 / delta, 70, 180);
        this.bpm = this.bpm ? Math.round(smooth(this.bpm, bpm, 0.18)) : Math.round(bpm);
      }
      this.lastBeatAt = now;
    }
  },

  avg(start, end) {
    if (!this.data) return 0;
    let total = 0;
    let count = 0;
    for (let i = start; i < Math.min(end, this.data.length); i++) {
      total += this.data[i];
      count++;
    }
    return count ? total / count : 0;
  },

  sourceLabel() {
    if (this.sourceType === 'system') return 'Sound Card';
    if (this.sourceType === 'microphone') return 'Mic';
    return 'Fallback';
  },

  snapshot() {
    return {
      bass: this.bass,
      mid: this.mid,
      high: this.high,
      beat: this.beat,
      bpm: this.bpm,
      enabled: this.enabled,
      sourceType: this.sourceType,
      sourceLabel: this.sourceLabel(),
      status: this.status
    };
  }
};

function smooth(current, target, factor) {
  return current + (target - current) * factor;
}
