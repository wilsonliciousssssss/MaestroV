function ob_scenePalette() { return VisualState.palette(); }
function ob_perfScale() { return VisualState.perfMode().densityScale; }
function ob_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 12) { ctx.shadowBlur = Math.min(22, glow * 0.22); ctx.shadowColor = color; }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function ob_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function ob_drawBox(ctx, x, y, w, h, color, alpha = 0.2, lw = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); ctx.restore();
}
function ob_scenePulse(audio) { return 1 + audio.beat * 0.35 + audio.bass * 0.18; }

const ObsidianGraphScene = {
  /* V112 rewrite — bass finally mapped: beat gravity-lurch (nodes contract toward
     their hub and spring back), band-coloured data pulses travel the edges,
     hub rings flash additively on the beat. */
  nodes: [], pulses: [],
  reset() { this.nodes = []; this.pulses = []; },
  trimForHybrid() { if (this.pulses.length > 24) this.pulses.splice(0, this.pulses.length - 24); },
  ensure(width, height) {
    const count = Math.floor((VisualState.controls.graphNodes || 100) * ob_perfScale());
    if (Math.abs(this.nodes.length - count) < 8) return;
    this.nodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: 0, vy: 0, z: Math.random(), phase: i * 0.47
    }));
    this.pulses = [];
  },
  draw(ctx, width, height, time, audio) {
    this.ensure(width, height);
    const p = ob_scenePalette();
    const link = (VisualState.controls.graphLinks || 44) / 100;
    const depth = (VisualState.controls.graphDepth || 55) / 100;
    const bass = audio.bass || 0, mid = audio.mid || 0, high = audio.high || 0;
    const bus = typeof BeatBus !== 'undefined' ? BeatBus : null;
    const kick = !!(bus && bus.active);
    const hubs = this.nodes.filter((_, i) => i % 17 === 0);
    /* motion: wander + beat gravity lurch toward nearest hub, springy return */
    this.nodes.forEach((n) => {
      n.vx += Math.sin(time * 0.38 + n.phase) * depth * 0.05;
      n.vy += Math.cos(time * 0.33 + n.phase) * depth * 0.05;
      if (kick && hubs.length) {
        let hb = hubs[0], hd = Infinity;
        for (let h = 0; h < hubs.length; h++) {
          const d = Math.hypot(n.x - hubs[h].x, n.y - hubs[h].y);
          if (d < hd) { hd = d; hb = hubs[h]; }
        }
        const pull = (0.045 + bass * 0.08);
        n.vx += (hb.x - n.x) * pull; n.vy += (hb.y - n.y) * pull;
      }
      n.vx *= 0.86; n.vy *= 0.86;
      n.x = (n.x + n.vx + width) % width;
      n.y = (n.y + n.vy + height) % height;
    });
    hubs.forEach((h, hi) => {
      ob_drawBox(ctx, h.x - 26, h.y - 16, 52, 32, p.c, 0.1 + (audio.beat || 0) * 0.16, 1);
      if (kick && typeof additiveDraw === 'function') {
        additiveDraw(ctx, () => {
          ctx.strokeStyle = rgba(p.c, 0.5);
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(h.x, h.y, 26 + bass * 34, 0, Math.PI * 2); ctx.stroke();
        });
      }
      /* spawn band-coloured data pulses from hubs on the beat */
      if (kick && this.pulses.length < 60) {
        const target = this.nodes[(hi * 29 + (bus ? bus.count : 0) * 13) % this.nodes.length];
        if (target) this.pulses.push({ x0: h.x, y0: h.y, x1: target.x, y1: target.y, t: 0, band: hi % 3 });
      }
    });
    const reach = 170 + mid * 70 + bass * 60; /* bass widens the mesh */
    this.nodes.forEach((n, i) => {
      for (let j = i + 1; j < Math.min(this.nodes.length, i + Math.floor(5 + link * 22)); j++) {
        const m = this.nodes[j], d = Math.hypot(n.x - m.x, n.y - m.y);
        if (d < reach) ob_drawLine(ctx, n.x, n.y, m.x, m.y, (i + j) % 2 ? p.a : p.b, (1 - d / (reach + 90)) * 0.24, pixelSafe(VisualState.controls.lineWeight) * (0.7 + n.z * 0.5));
      }
      hubs.slice(0, 4).forEach((h) => {
        const d = Math.hypot(n.x - h.x, n.y - h.y);
        if (d < 230) ob_drawLine(ctx, n.x, n.y, h.x, h.y, p.c, (1 - d / 230) * 0.07, 0.5);
      });
      ob_drawGlowPoint(ctx, n.x, n.y, (2 + n.z * 3.5) * (1 + high * 0.75 + bass * 0.25), i % 2 ? p.b : p.c, 0.62 + n.z * 0.16);
      if (i % 11 === 0) {
        ctx.fillStyle = rgba(p.a, 0.32);
        ctx.font = '9px Courier New';
        ctx.fillText('NODE_' + i, n.x + 6, n.y - 6);
      }
    });
    /* travelling edge pulses */
    this.pulses = this.pulses.filter((pu) => {
      pu.t += 0.035 + mid * 0.03;
      const x = pu.x0 + (pu.x1 - pu.x0) * pu.t;
      const y = pu.y0 + (pu.y1 - pu.y0) * pu.t;
      const col = pu.band === 0 ? p.c : pu.band === 1 ? p.b : p.a;
      ob_drawLine(ctx, pu.x0, pu.y0, x, y, col, 0.2 * (1 - pu.t), 1);
      ob_drawGlowPoint(ctx, x, y, 2.6, col, 0.8 * (1 - pu.t * 0.5));
      return pu.t < 1;
    });
  }
};

function pixelSafe(v){return Math.max(.3,v||1)}
