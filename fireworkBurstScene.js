function cp_scenePalette() { return VisualState.palette(); }
function cp_perfScale() { return VisualState.perfMode().densityScale; }
function cp_clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function cp_norm(value, fallback = 0) { return cp_clamp((value ?? fallback) / 100, 0, 1); }
function cp_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 10) { ctx.shadowBlur = Math.min(20, glow * 0.18 + radius * 0.6); ctx.shadowColor = color; }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.2, radius), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function cp_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
function cp_drawBox(ctx, x, y, w, h, color, alpha = 0.18, lw = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

const ChladniPlateScene = {
  grains: [],
  lastKey: '',

  reset() {
    this.grains = [];
    this.lastKey = '';
  },

  trimForHybrid() {
    if (this.grains.length > 1600) this.grains = this.grains.slice(0, 1600);
  },

  ensureGrains(count, scatter) {
    const key = `${count}:${scatter.toFixed(3)}`;
    if (this.lastKey === key && this.grains.length === count) return;
    this.lastKey = key;
    this.grains = [];
    for (let i = 0; i < count; i++) {
      this.grains.push({
        u: Math.random() * 2 - 1,
        v: Math.random() * 2 - 1,
        jx: (Math.random() * 2 - 1) * scatter,
        jy: (Math.random() * 2 - 1) * scatter,
        s: 0.55 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2
      });
    }
  },

  field(u, v, n, m, harmonic, time, audio, drift) {
    const bass = audio.bass || 0;
    const high = audio.high || 0;
    const t1 = time * (0.6 + drift * 0.8);
    const t2 = time * (0.9 + drift * 1.4);
    const x = (u + 1) * 0.5;
    const y = (v + 1) * 0.5;
    const f1 = Math.sin(n * Math.PI * x + Math.sin(t1 + y * 3) * drift * 0.18) * Math.sin(m * Math.PI * y + Math.cos(t1 + x * 4) * drift * 0.18);
    const f2 = Math.sin(m * Math.PI * x - Math.cos(t2 + y * 2) * drift * 0.16) * Math.sin(n * Math.PI * y + Math.sin(t2 + x * 3) * drift * 0.16);
    const f3 = Math.sin((n + 1) * Math.PI * x + t2 * 0.4) * Math.sin((m + 2) * Math.PI * y - t2 * 0.3);
    const mix = (f1 - f2) + harmonic * (0.35 + high * 0.4) * f3 + bass * 0.08 * Math.sin((n + m) * Math.PI * (x + y) * 0.5 + t1);
    return mix;
  },

  drawGuides(ctx, px, py, size, p, bass, mid, high) {
    cp_drawBox(ctx, px, py, size, size, p.a, 0.06 + bass * 0.05, 1);
    const inner = size * 0.08;
    cp_drawBox(ctx, px + inner, py + inner, size - inner * 2, size - inner * 2, p.b, 0.03 + mid * 0.03, 1);
    cp_drawLine(ctx, px, py + size * 0.5, px + size, py + size * 0.5, p.c, 0.025 + bass * 0.02, 0.7);
    cp_drawLine(ctx, px + size * 0.5, py, px + size * 0.5, py + size, p.c, 0.025 + high * 0.02, 0.7);
  },

  draw(ctx, width, height, time, audio) {
    const p = cp_scenePalette();
    const bass = audio.bass || 0;
    const mid = audio.mid || 0;
    const high = audio.high || 0;
    const beat = audio.beat || 0;

    const density = Math.max(20, Math.floor((VisualState.controls.chladniDensity || 78) * cp_perfScale()));
    const modeX = Math.max(1, Math.floor(VisualState.controls.chladniModeX || 3));
    const modeYBase = Math.max(2, Math.floor(VisualState.controls.chladniModeY || 5));
    const threshold = cp_norm(VisualState.controls.chladniThreshold, 34);
    const drift = cp_norm(VisualState.controls.chladniDrift, 46);
    const scatter = cp_norm(VisualState.controls.chladniScatter, 36) * 0.09;
    const lineAlpha = cp_norm(VisualState.controls.chladniLineAlpha, 62);
    const sparkle = cp_norm(VisualState.controls.chladniSparkle, 54);

    const n = modeX + Math.round(bass * 3);
    let m = modeYBase + Math.round(mid * 4);
    if (m === n) m += 1;
    const harmonic = 0.15 + high * 0.85;

    const grainCount = Math.floor((density * density * 0.42) * (VisualState.scene === 'hybrid' ? 0.55 : 1));
    this.ensureGrains(grainCount, scatter);
    if (VisualState.scene === 'hybrid') this.trimForHybrid();

    const plateSize = Math.min(width, height) * 0.62 * (1 + beat * 0.02 + bass * 0.03);
    const px = (width - plateSize) * 0.5;
    const py = (height - plateSize) * 0.5;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const rotation = Math.sin(time * 0.35) * drift * 0.05 + Math.sin(time * 1.1) * mid * 0.015;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);

    ctx.save();
    ctx.fillStyle = rgba('#05070b', 0.18 + bass * 0.05);
    ctx.fillRect(px, py, plateSize, plateSize);
    ctx.restore();

    this.drawGuides(ctx, px, py, plateSize, p, bass, mid, high);

    const samples = Math.max(28, Math.floor(density * 0.7));
    for (let row = 0; row < samples; row++) {
      const v = -1 + (row / Math.max(1, samples - 1)) * 2;
      let prev = null;
      for (let col = 0; col < samples; col++) {
        const u = -1 + (col / Math.max(1, samples - 1)) * 2;
        const val = this.field(u, v, n, m, harmonic, time, audio, drift);
        const node = Math.max(0, 1 - Math.abs(val) / (0.06 + threshold * 0.34));
        const x = px + (u + 1) * 0.5 * plateSize;
        const y = py + (v + 1) * 0.5 * plateSize;
        if (node > 0.22) {
          if (prev) {
            cp_drawLine(ctx, prev.x, prev.y, x, y, (row + col) % 3 === 0 ? p.a : (row + col) % 3 === 1 ? p.b : p.c, 0.03 + node * 0.18 * lineAlpha, 0.45 + node * 0.85 + bass * 0.2);
          }
          prev = { x, y };
        } else {
          prev = null;
        }
      }
    }

    for (let i = 0; i < this.grains.length; i++) {
      const g = this.grains[i];
      const tremorX = Math.sin(time * (1.6 + drift * 2.0) + g.phase) * drift * 0.02;
      const tremorY = Math.cos(time * (1.9 + drift * 1.8) + g.phase) * drift * 0.02;
      const u = cp_clamp(g.u + g.jx + tremorX, -1, 1);
      const v = cp_clamp(g.v + g.jy + tremorY, -1, 1);
      const val = this.field(u, v, n, m, harmonic, time, audio, drift);
      const node = Math.max(0, 1 - Math.abs(val) / (0.05 + threshold * 0.30));
      const x = px + (u + 1) * 0.5 * plateSize;
      const y = py + (v + 1) * 0.5 * plateSize;

      if (node > 0.06) {
        const col = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
        const alpha = 0.04 + node * 0.30 + sparkle * high * 0.12;
        const radius = g.s * (0.35 + node * 1.15 + high * 0.12);
        cp_drawGlowPoint(ctx, x, y, radius, col, alpha);
        if (sparkle > 0.1 && high > 0.18 && i % Math.max(3, Math.floor(12 - sparkle * 8)) === 0) {
          cp_drawLine(ctx, x - 1.8, y, x + 1.8, y, col, 0.05 + high * 0.12, 0.6);
          cp_drawLine(ctx, x, y - 1.8, x, y + 1.8, col, 0.05 + high * 0.12, 0.6);
        }
      }
    }

    const exciterR = 3 + bass * 2.5;
    const corners = [
      [px, py], [px + plateSize, py], [px, py + plateSize], [px + plateSize, py + plateSize]
    ];
    corners.forEach((c, idx) => {
      const col = idx % 2 === 0 ? p.c : p.b;
      cp_drawGlowPoint(ctx, c[0], c[1], exciterR, col, 0.15 + beat * 0.08 + bass * 0.08);
    });

    ctx.restore();
  }
};
