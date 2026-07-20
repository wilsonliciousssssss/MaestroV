function sf_scenePalette() { return VisualState.palette(); }
function sf_perfScale() { return VisualState.perfMode().densityScale; }
function sf_clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function sf_norm(value, fallback = 0) { return sf_clamp((value ?? fallback) / 100, 0, 1); }
function sf_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 12) { ctx.shadowBlur = Math.min(16, glow * 0.12 + radius * 0.35); ctx.shadowColor = color; }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.2, radius), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function sf_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
function sf_drawBox(ctx, x, y, w, h, color, alpha = 0.2, lw = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
function sf_gauss(x, m, s) { const d = (x - m) / s; return Math.exp(-0.5 * d * d); }

const SlashFabricScene = {
  waterfall: [],
  peakHold: { low: 0, mid: 0, high: 0 },
  particles: [],
  lastShift: 0,
  lastKey: '',

  reset() {
    this.waterfall = [];
    this.peakHold = { low: 0, mid: 0, high: 0 };
    this.particles = [];
    this.lastShift = 0;
    this.lastKey = '';
  },

  trimForHybrid() {
    const maxCols = 40;
    if (this.waterfall.length > maxCols) this.waterfall = this.waterfall.slice(this.waterfall.length - maxCols);
    if (this.particles.length > 60) this.particles = this.particles.slice(this.particles.length - 60);
  },

  ensureState(cols) {
    const key = String(cols);
    if (this.lastKey !== key) {
      this.lastKey = key;
      this.waterfall = [];
      this.particles = [];
      this.lastShift = 0;
    }
  },

  spectralProfile(nx, ny, time, audio, gain, scroll, detail, bassWeight) {
    const bass = audio.bass || 0;
    const mid = audio.mid || 0;
    const high = audio.high || 0;
    const beat = audio.beat || 0;

    const drift = time * (0.7 + scroll * 1.4);
    const lowEnv = sf_gauss(ny, 0.82, 0.12) * (0.58 + bass * (0.95 + bassWeight * 0.55));
    const midEnv = sf_gauss(ny, 0.52, 0.16) * (0.38 + mid * 0.98);
    const highEnv = sf_gauss(ny, 0.20, 0.10) * (0.24 + high * (1.02 + detail * 0.55));

    const lowWave = Math.sin(nx * 7.5 + drift * 1.2 + ny * 3.2) * 0.78 + Math.cos(nx * 3.4 - drift * 0.6) * 0.36;
    const midWave = Math.sin(nx * 12.0 + drift * 1.8 + ny * 6.5) * 0.62 + Math.cos(nx * 5.8 + drift * 0.9) * 0.26;
    const hiWave = Math.sin(nx * (18 + detail * 16) + drift * (2.1 + high * 1.8) + ny * 9.5) * 0.52 + Math.cos(nx * (26 + detail * 18) - drift * 1.3) * 0.24;
    const micro = Math.sin(nx * (38 + detail * 30) + drift * 3.0 + ny * 20) * (0.02 + detail * 0.09 + high * 0.07);
    const impulse = beat * 0.11 * Math.sin(nx * 14 + time * 6.5) * sf_gauss(ny, 0.56, 0.28);

    const synth = (lowEnv * lowWave + midEnv * midWave + highEnv * hiWave + micro + impulse) * (0.28 + gain * 0.98);
    /* V112 — real spectrograph: when the analyser is live, rows read actual FFT bins
       (low frequencies at the bottom); the synth field remains as texture + fallback. */
    if (this.fft && this.fft.length) {
      const bin = this.fft[Math.max(0, Math.min(this.fft.length - 1, Math.round((1 - ny) * (this.fft.length - 1))))];
      const ripple = Math.sin(nx * (10 + detail * 24) + drift * 1.6) * 0.5 + 0.5;
      return bin * (0.6 + ripple * 0.55) * (0.55 + gain * 1.1) + synth * 0.3;
    }
    return synth;
  },

  refreshFft() {
    this.fft = (typeof AudioEngine !== 'undefined' && typeof AudioEngine.spectrum === 'function') ? AudioEngine.spectrum(64) : null;
  },

  updateWaterfall(time, audio, rows, gain, scroll, detail, bassWeight) {
    const shiftInterval = 0.028 + (1 - scroll) * 0.04;
    if (this.lastShift === 0 || time - this.lastShift >= shiftInterval) {
      const col = [];
      for (let r = 0; r < rows; r++) {
        const ny = r / Math.max(1, rows - 1);
        const value = this.spectralProfile(1.0, ny, time, audio, gain, scroll, detail, bassWeight);
        const low = sf_gauss(ny, 0.82, 0.12);
        const mid = sf_gauss(ny, 0.52, 0.16);
        const high = sf_gauss(ny, 0.20, 0.10);
        const intensity = Math.abs(value);
        col.push({ intensity, low, mid, high });
      }
      this.waterfall.push(col);
      this.lastShift = time;
    }
  },

  emitParticles(time, audio, left, top, plotW, plotH) {
    const high = audio.high || 0;
    const mid = audio.mid || 0;
    const spawn = Math.floor((1 + high * 3 + mid * 1.2) * (VisualState.scene === 'hybrid' ? 0.5 : 1));
    const p = sf_scenePalette();
    for (let i = 0; i < spawn; i++) {
      const zoneY = top + plotH * (0.15 + Math.random() * 0.18);
      this.particles.push({
        x: left + plotW * (0.1 + Math.random() * 0.85),
        y: zoneY,
        vx: -0.4 - Math.random() * (0.6 + mid * 1.4),
        vy: -0.1 + Math.random() * 0.2,
        life: 0.6 + Math.random() * 0.7,
        age: 0,
        size: 0.7 + Math.random() * (1.1 + high * 1.5),
        color: Math.random() < 0.45 ? p.a : Math.random() < 0.5 ? p.b : p.c
      });
    }
    this.particles = this.particles.filter((pt) => pt.age < pt.life && pt.x > left - 12);
    this.particles.forEach((pt) => {
      pt.age += 0.016;
      pt.x += pt.vx * (1 + (audio.high || 0) * 1.4);
      pt.y += pt.vy;
    });
  },

  draw(ctx, width, height, time, audio) {
    const p = sf_scenePalette();
    const bass = audio.bass || 0;
    const mid = audio.mid || 0;
    const high = audio.high || 0;
    const beat = audio.beat || 0;

    const density = Math.max(36, Math.floor((VisualState.controls.topoDensity || 128) * sf_perfScale()));
    const bands = Math.max(10, Math.floor((VisualState.controls.topoLayers || 28) * sf_perfScale()));
    const gain = (VisualState.controls.topoAmplitude || 96) / 100;
    const spacing = (VisualState.controls.topoSpacing || 22);
    const scroll = sf_norm(VisualState.controls.topoDrift, 64);
    const detail = sf_norm(VisualState.controls.topoDetail, 64);
    const bassWeight = sf_norm(VisualState.controls.topoPulse, 70);
    const tracerAmount = sf_norm(VisualState.controls.topoTracerAmount, 60);

    const left = width * 0.08;
    const top = height * 0.10;
    const plotW = width * 0.84;
    const plotH = height * 0.80;
    const baseSpacing = spacing * 0.78;
    const wfCols = VisualState.scene === 'hybrid' ? 40 : 72;
    this.ensureState(wfCols);
    this.refreshFft();
    this.updateWaterfall(time, audio, bands, gain, scroll, detail, bassWeight);
    if (this.waterfall.length > wfCols) this.waterfall = this.waterfall.slice(this.waterfall.length - wfCols);
    this.emitParticles(time, audio, left, top, plotW, plotH);

    // frame and guides
    sf_drawBox(ctx, left, top, plotW, plotH, p.a, 0.03 + bass * 0.04, 1);
    for (let i = 0; i <= 6; i++) {
      const y = top + (i / 6) * plotH;
      const col = i < 2 ? p.a : i < 4 ? p.b : p.c;
      sf_drawLine(ctx, left, y, left + plotW, y, col, 0.018 + mid * 0.018, 0.55);
    }
    for (let i = 0; i <= 10; i++) {
      const x = left + (i / 10) * plotW;
      sf_drawLine(ctx, x, top, x, top + plotH, p.a, 0.01 + high * 0.01, 0.5);
    }

    // heatmap waterfall history
    const colW = plotW / wfCols;
    for (let c = 0; c < this.waterfall.length; c++) {
      const x = left + plotW - (this.waterfall.length - c) * colW;
      const col = this.waterfall[c];
      if (!col) continue;
      for (let r = 0; r < col.length; r++) {
        const band = col[r];
        const y = top + (r / Math.max(1, col.length - 1)) * plotH;
        const hCell = plotH / Math.max(1, col.length);
        const intensity = band.intensity;
        const color = band.low > band.mid && band.low > band.high ? p.c : band.mid > band.high ? p.b : p.a;
        const alpha = (0.02 + intensity * 0.12) * (c / Math.max(1, this.waterfall.length)); /* V112: waterfall actually visible */
        ctx.save();
        ctx.fillStyle = rgba(color, alpha);
        ctx.fillRect(x, y - hCell * 0.42, colW + 0.5, hCell * 0.84);
        ctx.restore();
      }
    }

    // zone emphasis lines
    const zoneYs = [0.82, 0.52, 0.20];
    const zoneCols = [p.c, p.b, p.a];
    zoneYs.forEach((zy, zi) => {
      const y = top + zy * plotH;
      sf_drawLine(ctx, left, y, left + plotW, y, zoneCols[zi], 0.03 + [bass, mid, high][zi] * 0.05, 0.8 + [bass, mid, high][zi] * 0.45);
    });

    // live spectral bands, spikes, and peak tracking
    const peakVals = { low: 0, mid: 0, high: 0 };
    const zoneKey = (ny) => ny > 0.66 ? 'low' : ny > 0.36 ? 'mid' : 'high';
    const peakPos = { low: {x:left,y:top+0.82*plotH}, mid:{x:left,y:top+0.52*plotH}, high:{x:left,y:top+0.20*plotH} };

    for (let row = 0; row < bands; row++) {
      const ny = row / Math.max(1, bands - 1);
      const baseY = top + ny * plotH;
      const zone = zoneKey(ny);
      const zoneColor = zone === 'low' ? p.c : zone === 'mid' ? p.b : p.a;
      const alpha = 0.08 + (1 - ny) * 0.018 + bass * 0.018 + high * 0.018;
      const widthLine = 0.82 + bass * 0.28 + (row % 5 === 0 ? 0.28 : 0);
      let prev = null;
      let localMax = 0;
      let localPeak = { x: left, y: baseY };

      for (let i = 0; i < density; i++) {
        const nx = i / Math.max(1, density - 1);
        const x = left + nx * plotW;
        const field = this.spectralProfile(nx, ny, time, audio, gain, scroll, detail, bassWeight);
        const y = baseY - field * (baseSpacing * 2.1 + gain * 28);
        const activity = Math.abs(field);
        if (activity > localMax) {
          localMax = activity;
          localPeak = { x, y };
        }
        if (prev) sf_drawLine(ctx, prev.x, prev.y, x, y, zoneColor, alpha, widthLine);

        // vertical energy spikes
        if (i % Math.max(8, Math.floor(18 - (zone === 'low' ? bass : zone === 'mid' ? mid : high) * 10)) === 0) {
          const spike = activity * (10 + gain * 18) * (zone === 'low' ? (0.7 + bass * 1.6) : zone === 'mid' ? (0.55 + mid * 1.25) : (0.4 + high * 1.4));
          sf_drawLine(ctx, x, baseY, x, y - spike * 0.35, zoneColor, 0.025 + activity * 0.08, 0.5 + activity * 0.55);
        }

        if (i % Math.max(6, Math.floor(14 - high * 7)) === 0 && row % 2 === 0) {
          sf_drawGlowPoint(ctx, x, y, 0.42 + high * 0.55, zoneColor, 0.08 + high * 0.08);
        }
        prev = { x, y };
      }

      if (localMax > peakVals[zone]) {
        peakVals[zone] = localMax;
        peakPos[zone] = localPeak;
      }
    }

    // peak hold markers with decay
    this.peakHold.low = Math.max(this.peakHold.low * 0.97, peakVals.low);
    this.peakHold.mid = Math.max(this.peakHold.mid * 0.972, peakVals.mid);
    this.peakHold.high = Math.max(this.peakHold.high * 0.974, peakVals.high);
    ['low','mid','high'].forEach((zone) => {
      const col = zone === 'low' ? p.c : zone === 'mid' ? p.b : p.a;
      const pos = peakPos[zone];
      if (!pos) return;
      const markerW = 10 + this.peakHold[zone] * 8;
      sf_drawLine(ctx, pos.x - markerW * 0.5, pos.y, pos.x + markerW * 0.5, pos.y, col, 0.18 + this.peakHold[zone] * 0.12, 1.2);
      sf_drawLine(ctx, pos.x, pos.y - 6, pos.x, pos.y + 6, col, 0.12 + this.peakHold[zone] * 0.12, 0.8);
      sf_drawGlowPoint(ctx, pos.x, pos.y, 1.3 + this.peakHold[zone] * 2.4, col, 0.2 + this.peakHold[zone] * 0.2);
    });

    // sweep cursor
    const sweepX = left + (((time * (0.10 + scroll * 0.11)) % 1)) * plotW;
    sf_drawLine(ctx, sweepX, top, sweepX, top + plotH, p.c, 0.08 + high * 0.05 + beat * 0.05, 1.0 + beat * 1.2);

    // tracers following the bands
    const tracers = Math.floor((10 + tracerAmount * 30) * sf_perfScale() * (VisualState.scene === 'hybrid' ? 0.6 : 1));
    for (let i = 0; i < tracers; i++) {
      const ny = (i % bands) / Math.max(1, bands - 1);
      const nx = ((time * (0.06 + mid * 0.24 + high * 0.08)) + i * 0.053) % 1;
      const x = left + nx * plotW;
      const field = this.spectralProfile(nx, ny, time, audio, gain, scroll, detail, bassWeight);
      const baseY = top + ny * plotH;
      const y = baseY - field * (baseSpacing * 2.1 + gain * 28);
      const col = ny > 0.66 ? p.c : ny > 0.36 ? p.b : p.a;
      sf_drawGlowPoint(ctx, x, y, 0.75 + high * 0.95 + mid * 0.2, col, 0.14 + high * 0.12);
      sf_drawLine(ctx, x - 7 - mid * 10, y, x + 8 + high * 7, y, col, 0.10 + high * 0.08, 0.82);
    }

    // spark particles, focused in high region
    this.particles.forEach((pt) => {
      const life = 1 - pt.age / Math.max(0.001, pt.life);
      sf_drawGlowPoint(ctx, pt.x, pt.y, pt.size * life * 0.82, pt.color, 0.08 + life * 0.22);
    });
  }
};
