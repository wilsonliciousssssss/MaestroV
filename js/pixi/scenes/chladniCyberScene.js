function cc_scenePalette() { return VisualState.palette(); }
function cc_perfScale() { return VisualState.perfMode().densityScale; }
function cc_clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function cc_norm(value, fallback = 0) { return cc_clamp((value ?? fallback) / 100, 0, 1); }
function cc_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 10) { ctx.shadowBlur = Math.min(22, glow * 0.2 + radius * 0.65); ctx.shadowColor = color; }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.2, radius), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function cc_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function cc_drawBox(ctx, x, y, w, h, color, alpha = 0.18, lw = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); ctx.restore();
}

const ChladniCyberScene = {
  field(u, v, n, m, harmonic, time, audio, drift) {
    const bass = audio.bass || 0;
    const mid = audio.mid || 0;
    const high = audio.high || 0;
    const t1 = time * (0.7 + drift * 1.0);
    const t2 = time * (1.2 + drift * 1.6);
    const x = (u + 1) * 0.5;
    const y = (v + 1) * 0.5;
    const core = Math.sin(n * Math.PI * x + Math.sin(t1 + y * 3.2) * drift * 0.18) * Math.sin(m * Math.PI * y + Math.cos(t1 + x * 2.6) * drift * 0.18)
               - Math.sin(m * Math.PI * x - Math.cos(t2 + y * 2.2) * drift * 0.16) * Math.sin(n * Math.PI * y + Math.sin(t2 + x * 3.4) * drift * 0.16);
    const harmonicField = Math.sin((n + 1) * Math.PI * x + t2 * 0.28) * Math.sin((m + 2) * Math.PI * y - t2 * 0.22);
    const scan = Math.sin((x + y) * Math.PI * (n + m) * 0.35 + t1) * bass * 0.1 + Math.cos((x - y) * Math.PI * (n + 2) * 0.45 + t2) * mid * 0.08;
    return core + harmonicField * harmonic * (0.35 + high * 0.45) + scan;
  },

  drawFrame(ctx, px, py, size, p, bass, mid, high, circuit) {
    const pad = size * 0.06;
    cc_drawBox(ctx, px, py, size, size, p.a, 0.06 + bass * 0.04, 1.1 + bass * 0.25);
    cc_drawBox(ctx, px + pad, py + pad, size - pad * 2, size - pad * 2, p.b, 0.035 + mid * 0.03, 0.9);
    const corners = [
      [px, py], [px + size, py], [px, py + size], [px + size, py + size]
    ];
    corners.forEach((c, i) => {
      const col = i % 2 === 0 ? p.c : p.b;
      cc_drawGlowPoint(ctx, c[0], c[1], 2.2 + bass * 2, col, 0.12 + bass * 0.1);
    });
    const bar = size * 0.12 * (0.6 + circuit * 0.5);
    cc_drawLine(ctx, px, py + bar, px + bar, py, p.c, 0.06 + high * 0.05, 1);
    cc_drawLine(ctx, px + size - bar, py, px + size, py + bar, p.c, 0.06 + high * 0.05, 1);
    cc_drawLine(ctx, px, py + size - bar, px + bar, py + size, p.c, 0.06 + high * 0.05, 1);
    cc_drawLine(ctx, px + size - bar, py + size, px + size, py + size - bar, p.c, 0.06 + high * 0.05, 1);
  },

  draw(ctx, width, height, time, audio) {
    const p = cc_scenePalette();
    const bass = audio.bass || 0;
    const mid = audio.mid || 0;
    const high = audio.high || 0;
    const beat = audio.beat || 0;

    const density = Math.max(20, Math.floor((VisualState.controls.cyberChladniDensity || 72) * cc_perfScale()));
    const baseModeX = Math.max(1, Math.floor(VisualState.controls.cyberChladniModeX || 4));
    const baseModeY = Math.max(2, Math.floor(VisualState.controls.cyberChladniModeY || 7));
    const threshold = cc_norm(VisualState.controls.cyberChladniThreshold, 28);
    const drift = cc_norm(VisualState.controls.cyberChladniDrift, 52);
    const pulse = cc_norm(VisualState.controls.cyberChladniPulse, 60);
    const circuit = cc_norm(VisualState.controls.cyberChladniCircuit, 66);
    const sparkle = cc_norm(VisualState.controls.cyberChladniSparkle, 58);

    const n = baseModeX + Math.round(bass * 3);
    let m = baseModeY + Math.round(mid * 4);
    if (m === n) m += 1;
    const harmonic = 0.2 + high * 0.9;

    const size = Math.min(width, height) * 0.62 * (1 + beat * 0.03 + pulse * bass * 0.04);
    const px = (width - size) * 0.5;
    const py = (height - size) * 0.5;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const rotation = Math.sin(time * 0.3) * drift * 0.045 + Math.sin(time * 0.95) * mid * 0.02;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.translate(-cx, -cy);

    ctx.save();
    ctx.fillStyle = rgba('#05070b', 0.14 + bass * 0.04);
    ctx.fillRect(px, py, size, size);
    ctx.restore();

    this.drawFrame(ctx, px, py, size, p, bass, mid, high, circuit);

    // cyber grid hints
    const gridCount = Math.max(6, Math.floor(8 + circuit * 10));
    for (let i = 1; i < gridCount; i++) {
      const t = i / gridCount;
      const gx = px + t * size;
      const gy = py + t * size;
      cc_drawLine(ctx, gx, py, gx, py + size, p.a, 0.008 + high * 0.01, 0.45);
      cc_drawLine(ctx, px, gy, px + size, gy, p.b, 0.008 + mid * 0.01, 0.45);
    }

    const samples = Math.max(26, Math.floor(density * 0.78));
    const tracerStep = Math.max(3, Math.floor(10 - sparkle * 5));

    // nodal circuit traces
    for (let row = 0; row < samples; row++) {
      const v = -1 + (row / Math.max(1, samples - 1)) * 2;
      let prev = null;
      for (let col = 0; col < samples; col++) {
        const u = -1 + (col / Math.max(1, samples - 1)) * 2;
        const val = this.field(u, v, n, m, harmonic, time, audio, drift);
        const node = Math.max(0, 1 - Math.abs(val) / (0.055 + threshold * 0.28));
        const x = px + (u + 1) * 0.5 * size;
        const y = py + (v + 1) * 0.5 * size;
        if (node > 0.2) {
          const colr = (row + col) % 3 === 0 ? p.a : (row + col) % 3 === 1 ? p.b : p.c;
          if (prev) {
            cc_drawLine(ctx, prev.x, prev.y, x, y, colr, 0.03 + node * 0.18 + high * 0.02, 0.45 + node * 0.9 + bass * 0.22);
          }
          if (col % tracerStep === 0) {
            const box = 1.4 + node * 2.2 + high * 0.6;
            ctx.save();
            ctx.strokeStyle = rgba(colr, 0.05 + node * 0.18 + high * 0.06);
            ctx.lineWidth = 0.8;
            ctx.strokeRect(x - box * 0.5, y - box * 0.5, box, box);
            ctx.restore();
            if (sparkle > 0.08 && high > 0.12) {
              cc_drawGlowPoint(ctx, x, y, 0.4 + node * 1.1, colr, 0.07 + node * 0.18 + high * 0.07);
            }
          }
          prev = { x, y };
        } else {
          prev = null;
        }
      }
    }

    // scan pulses linked to low/mid/high zones
    const sweeps = [
      { t: (time * (0.08 + bass * 0.08)) % 1, vertical: true, col: p.c, alpha: 0.04 + bass * 0.07 },
      { t: (time * (0.12 + mid * 0.1) + 0.33) % 1, vertical: false, col: p.b, alpha: 0.035 + mid * 0.07 },
      { t: (time * (0.18 + high * 0.12) + 0.67) % 1, vertical: true, col: p.a, alpha: 0.03 + high * 0.08 },
    ];
    sweeps.forEach((s) => {
      if (s.vertical) {
        const x = px + s.t * size;
        cc_drawLine(ctx, x, py, x, py + size, s.col, s.alpha, 0.85 + beat * 0.45);
      } else {
        const y = py + s.t * size;
        cc_drawLine(ctx, px, y, px + size, y, s.col, s.alpha, 0.85 + beat * 0.45);
      }
    });

    // HUD connectors and resonance nodes
    const nodeCount = Math.floor((10 + circuit * 18) * (VisualState.scene === 'hybrid' ? 0.55 : 1));
    for (let i = 0; i < nodeCount; i++) {
      const t = i / Math.max(1, nodeCount - 1);
      const u = -0.95 + t * 1.9;
      const v = Math.sin(time * (0.9 + mid * 0.8) + i * 0.7) * (0.18 + drift * 0.22);
      const val = this.field(u, v, n, m, harmonic, time, audio, drift);
      const node = Math.max(0, 1 - Math.abs(val) / (0.07 + threshold * 0.3));
      const x = px + (u + 1) * 0.5 * size;
      const y = py + (v + 1) * 0.5 * size;
      const col = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
      if (node > 0.14) {
        cc_drawGlowPoint(ctx, x, y, 0.7 + node * 1.8 + high * 0.6, col, 0.06 + node * 0.2 + high * 0.08);
        if (i > 0) {
          const px2 = px + ((-0.95 + ((i - 1) / Math.max(1, nodeCount - 1)) * 1.9) + 1) * 0.5 * size;
          const py2 = py + ((Math.sin(time * (0.9 + mid * 0.8) + (i - 1) * 0.7) * (0.18 + drift * 0.22)) + 1) * 0.5 * size;
          cc_drawLine(ctx, px2, py2, x, y, col, 0.018 + node * 0.1 + mid * 0.03, 0.55);
        }
      }
    }

    ctx.restore();
  }
};
