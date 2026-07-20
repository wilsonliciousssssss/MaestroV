function dn_scenePalette() { return VisualState.palette(); }
function dn_perfScale() { return VisualState.perfMode().densityScale; }
function dn_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 12) { ctx.shadowBlur = Math.min(22, glow * 0.22); ctx.shadowColor = color; }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function dn_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function dn_drawBox(ctx, x, y, w, h, color, alpha = 0.2, lw = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); ctx.restore();
}
function dn_scenePulse(audio) { return 1 + audio.beat * 0.35 + audio.bass * 0.18; }

const DnaOscilloscopeScene = {
  /* V112 rewrite — kick-driven "unzip" (rails part and re-anneal on the beat),
     depth-shaded rails (front bright/thick, back dim/thin), high-band ionization sparks. */
  unzip: 0, sparks: [],
  reset() { this.unzip = 0; this.sparks = []; },
  trimForHybrid() { if (this.sparks.length > 40) this.sparks.splice(0, this.sparks.length - 40); },
  draw(ctx, width, height, time, audio) {
    const p = dn_scenePalette();
    const strands = VisualState.controls.dnaStrands || 3;
    const seg = Math.floor((VisualState.controls.dnaSegments || 118) * dn_perfScale());
    const amp = (VisualState.controls.dnaAmplitude || 74) * (1 + (audio.bass || 0) * 0.95);
    const radius = (VisualState.controls.dnaRadius || 46) * (1 + (audio.mid || 0) * 0.55);
    const cx = width * 0.5;
    const bus = typeof BeatBus !== 'undefined' ? BeatBus : null;
    if (bus && bus.active) this.unzip = 1;
    this.unzip *= 0.9;
    dn_drawBox(ctx, width * 0.34, height * 0.39, width * 0.32, height * 0.22, p.a, 0.14 + (audio.beat || 0) * 0.1, 1);
    dn_drawLine(ctx, width * 0.36, height * 0.5, width * 0.64, height * 0.5, p.b, 0.08, 1);
    dn_drawLine(ctx, cx, height * 0.41, cx, height * 0.59, p.b, 0.08, 1);
    for (let s = 0; s < strands; s++) {
      const yOff = height * 0.5 + (s - (strands - 1) / 2) * height * 0.145;
      let prev1 = null, prev2 = null;
      for (let i = 0; i < seg; i++) {
        const t = i / (seg - 1);
        const x = width * 0.07 + t * width * 0.86;
        const phase = t * Math.PI * 12 + time * (1.15 + (audio.beat || 0) * 0.5) + s;
        const cy = yOff + Math.sin(t * Math.PI * 4 + time * 0.9 + s) * amp * 0.26;
        const open = this.unzip * Math.sin(t * Math.PI) * amp * 0.55; /* unzip window peaks mid-strand */
        const y1 = cy + Math.sin(phase) * radius - open;
        const y2 = cy - Math.sin(phase) * radius + open;
        const d1 = (Math.cos(phase) + 1) / 2;  /* rail 1 depth: 0 back → 1 front */
        const d2 = 1 - d1;
        if (prev1) {
          dn_drawLine(ctx, prev1.x, prev1.y, x, y1, p.a, 0.08 + d1 * 0.26 + (audio.high || 0) * 0.1, 0.7 + d1 * 1.1);
          dn_drawLine(ctx, prev2.x, prev2.y, x, y2, p.c, 0.08 + d2 * 0.26 + (audio.high || 0) * 0.1, 0.7 + d2 * 1.1);
        }
        if (i % 3 === 0) {
          if (this.unzip > 0.35) { /* snapped rung: two live stubs */
            const gapY = (y1 + y2) / 2;
            dn_drawLine(ctx, x, y1, x, y1 + (gapY - y1) * 0.4, p.b, 0.3 + (audio.mid || 0) * 0.3, 1 + (audio.beat || 0) * 1.5);
            dn_drawLine(ctx, x, y2, x, y2 + (gapY - y2) * 0.4, p.b, 0.3 + (audio.mid || 0) * 0.3, 1 + (audio.beat || 0) * 1.5);
          } else {
            dn_drawLine(ctx, x, y1, x, y2, p.b, 0.18 + (audio.mid || 0) * 0.34, 1 + (audio.beat || 0) * 1.5);
          }
        }
        if (i % 10 === 0) {
          ctx.fillStyle = rgba(p.b, 0.5);
          ctx.font = Math.round(10 + (audio.mid || 0) * 6) + 'px Courier New';
          ctx.fillText(['A', 'T', 'C', 'G'][(i + s) % 4], x + 5, cy - 8 - open * 0.4);
        }
        dn_drawGlowPoint(ctx, x, y1, 1 + d1 * 2.4, p.a, 0.3 + d1 * 0.5);
        dn_drawGlowPoint(ctx, x, y2, 1 + d2 * 2.4, p.c, 0.3 + d2 * 0.5);
        if ((audio.high || 0) > 0.5 && Math.random() < 0.05 && this.sparks.length < 90) {
          this.sparks.push({ x, y: Math.random() < 0.5 ? y1 : y2, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2.4, life: 1 });
        }
        prev1 = { x, y: y1 }; prev2 = { x, y: y2 };
      }
    }
    /* ionization sparks — additive so they genuinely flare */
    if (this.sparks.length && typeof additiveDraw === 'function') {
      additiveDraw(ctx, () => {
        this.sparks.forEach((sp) => {
          ctx.fillStyle = rgba(p.b, 0.55 * sp.life);
          ctx.fillRect(sp.x - 1, sp.y - 1, 2, 2);
        });
      });
    }
    this.sparks = this.sparks.filter((sp) => { sp.x += sp.vx; sp.y += sp.vy; sp.vy += 0.05; sp.life -= 0.04; return sp.life > 0; });
  }
};
