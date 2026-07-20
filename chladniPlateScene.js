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
  /* V119 — denser vibrating Chladni line-field. Marching-squares now traces MULTIPLE
     contour levels (the bright F=0 nodal lines plus flanking iso-lines) each frame for a
     rich topographic web, all driven continuously by audio: bass = phase travel + flex,
     mid = a stronger two-octave travelling ripple along the lines, high = per-vertex
     shimmer. Beat metamorphoses the mode (crossfade + flash). */
  nA: 4, mA: 7, sA: 1, nB: 4, mB: 7, sB: 1, morph: 1, beatsSinceChange: 0, flash: 0,
  _buf: null, _bufN: 0,
  reset() { this.morph = 1; this.beatsSinceChange = 0; this.flash = 0; },
  trimForHybrid() { /* grid resolution + level count already scale with perf */ },
  axes(gridN, n, m, ph) {
    const cn = new Float32Array(gridN), cm = new Float32Array(gridN);
    for (let i = 0; i < gridN; i++) { const x = i / (gridN - 1); cn[i] = Math.cos(n * Math.PI * x + ph); cm[i] = Math.cos(m * Math.PI * x + ph); }
    return { cn, cm };
  },
  pickMode(bass, mid, baseN, baseM) {
    let n = Math.max(1, Math.min(10, baseN + Math.round(bass * 3 + Math.random() * 2 - 1)));
    let m = Math.max(2, Math.min(12, baseM + Math.round(mid * 4 + Math.random() * 2 - 1)));
    if (m === n) m += 1;
    return { n, m, s: Math.random() < 0.5 ? 1 : -1 };
  },
  drawReadout(ctx, px, py, size, p, bass, mid, high, time) {
    const pad2 = (n) => { n = Math.max(0, Math.min(99, Math.round(n))); return n < 10 ? '0' + n : '' + n; };
    ctx.save();
    ctx.font = '9px "Courier New", monospace';
    ctx.textBaseline = 'middle';
    const ticks = Math.max(6, Math.floor(size / 56));
    /* per-edge ticks: bottom=LOW(bass), top=HIGH, left/right=MID */
    const edge = (band, col, place) => {
      for (let t = 0; t < ticks; t++) {
        const f = (t + 0.5) / ticks;
        const flick = Math.sin(t * 1.7 + time * 3.2) * 0.5 + 0.5;
        const num = pad2(band * 99 * (0.4 + flick * 0.6));
        const a = 0.18 + band * 0.7 * (0.5 + flick * 0.5);
        ctx.fillStyle = rgba(col, a);
        if (place === 'bottom') { ctx.textAlign = 'center'; ctx.fillText(num, px + f * size, py + size + 11); }
        else if (place === 'top') { ctx.textAlign = 'center'; ctx.fillText(num, px + f * size, py - 11); }
        else if (place === 'left') { ctx.textAlign = 'right'; ctx.fillText(num, px - 8, py + f * size); }
        else { ctx.textAlign = 'left'; ctx.fillText(num, px + size + 8, py + f * size); }
      }
    };
    edge(bass, p.c, 'bottom');
    edge(high, p.a, 'top');
    edge(mid, p.b, 'left');
    edge(mid, p.b, 'right');
    /* explicit live band readout above the box */
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(p.c, 0.4 + bass * 0.5); ctx.fillText('LO ' + pad2(bass * 99), px, py - 24);
    ctx.fillStyle = rgba(p.b, 0.4 + mid * 0.5); ctx.fillText('MD ' + pad2(mid * 99), px + 48, py - 24);
    ctx.fillStyle = rgba(p.a, 0.4 + high * 0.5); ctx.fillText('HI ' + pad2(high * 99), px + 96, py - 24);
    ctx.restore();
  },
  draw(ctx, width, height, time, audio) {
    const p = cp_scenePalette();
    const bass = audio.bass || 0, mid = audio.mid || 0, high = audio.high || 0, beat = audio.beat || 0;
    const gridN = Math.max(40, Math.floor((40 + cp_norm(VisualState.controls.chladniDensity, 78) * 62) * (0.6 + cp_perfScale() * 0.4)));
    const glowAmt = cp_norm(VisualState.controls.chladniThreshold, 34);
    const plateLife = cp_norm(VisualState.controls.chladniDrift, 46);
    const ripAmt = cp_norm(VisualState.controls.chladniScatter, 55);
    const lineAlpha = 0.3 + cp_norm(VisualState.controls.chladniLineAlpha, 62) * 0.65;
    const shimmer = cp_norm(VisualState.controls.chladniSparkle, 54);
    const baseN = Math.max(1, Math.floor(VisualState.controls.chladniModeX || 4));
    const baseM = Math.max(2, Math.floor(VisualState.controls.chladniModeY || 7));
    const speed = VisualState.controls.speed || 1.2;
    const lineW = VisualState.controls.lineWeight || 1;

    const bus = typeof BeatBus !== 'undefined' ? BeatBus : null;
    if (bus && bus.active) {
      this.flash = 1;
      this.beatsSinceChange += 1;
      if (this.morph >= 1 && this.beatsSinceChange >= 4) {
        this.nA = this.nB; this.mA = this.mB; this.sA = this.sB;
        const nx = this.pickMode(bass, mid, baseN, baseM);
        this.nB = nx.n; this.mB = nx.m; this.sB = nx.s;
        this.morph = 0; this.beatsSinceChange = 0;
      }
    }
    if (this.morph < 1) this.morph = Math.min(1, this.morph + 0.02 + plateLife * 0.02);
    this.flash *= 0.88;

    const ph = time * speed * (0.15 + plateLife * 0.4 + bass * 1.1) + Math.sin(time * 0.6) * bass * 0.5;
    const A = this.axes(gridN, this.nA, this.mA, ph);
    const B = this.axes(gridN, this.nB, this.mB, ph * 1.04);
    if (!this._buf || this._bufN !== gridN) { this._buf = new Float32Array(gridN * gridN); this._bufN = gridN; }
    const buf = this._buf, k = this.morph, sA = this.sA, sB = this.sB;
    for (let j = 0; j < gridN; j++) {
      for (let i = 0; i < gridN; i++) {
        const a = A.cn[i] * A.cm[j] + sA * A.cm[i] * A.cn[j];
        const b = B.cn[i] * B.cm[j] + sB * B.cm[i] * B.cn[j];
        buf[j * gridN + i] = a * (1 - k) + b * k;
      }
    }

    const size = Math.min(width, height) * 0.64 * (1 + bass * 0.05 + this.flash * 0.02);
    const px = (width - size) * 0.5, py = (height - size) * 0.5;
    const cx = width * 0.5, cy = height * 0.5;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(Math.sin(time * 0.1) * plateLife * 0.03); ctx.translate(-cx, -cy);

    ctx.fillStyle = rgba('#06070b', 0.28); ctx.fillRect(px, py, size, size);
    cp_drawLine(ctx, px, py, px + size, py, p.b, 0.16, 0.8);
    cp_drawLine(ctx, px, py + size, px + size, py + size, p.b, 0.16, 0.8);
    cp_drawLine(ctx, px, py, px, py + size, p.b, 0.16, 0.8);
    cp_drawLine(ctx, px + size, py, px + size, py + size, p.b, 0.16, 0.8);
    [[px, py], [px + size, py], [px, py + size], [px + size, py + size]].forEach((c) => cp_drawGlowPoint(ctx, c[0], c[1], 1.6, p.b, 0.3));
    cp_drawGlowPoint(ctx, cx, py + size + 3, 2.5 + bass * 5, p.c, 0.3 + bass * 0.4);

    const cell = size / (gridN - 1);
    const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
    const useGlow = glow > 8 || glowAmt > 0.2;
    /* MID = two-octave travelling ripple (stronger) · HIGH = shimmer */
    const ripK = 8 + Math.floor(ripAmt * 12);
    const ripS = size * (0.06 + ripAmt * 0.09);
    const dispX = (x, y) => {
      const nx = (x - px) / size, ny = (y - py) / size;
      const r1 = Math.sin(nx * ripK + ny * ripK * 0.7 + time * (2 + mid * 8)) * mid * ripS;
      const r2 = Math.sin(nx * ripK * 2.3 - ny * ripK * 1.6 + time * (3.4 + mid * 5)) * mid * ripS * 0.5;
      return x + r1 + r2 + (Math.random() - 0.5) * high * shimmer * size * 0.035;
    };
    const dispY = (x, y) => {
      const nx = (x - px) / size, ny = (y - py) / size;
      const r1 = Math.cos(ny * ripK - nx * ripK * 0.7 + time * (2.2 + mid * 8)) * mid * ripS;
      const r2 = Math.cos(ny * ripK * 2.1 + nx * ripK * 1.5 + time * (3.1 + mid * 5)) * mid * ripS * 0.5;
      return y + r1 + r2 + (Math.random() - 0.5) * high * shimmer * size * 0.035;
    };
    const interp = (xa, ya, va, xb, yb, vb) => { const t = va / (va - vb); return [xa + t * (xb - xa), ya + t * (yb - ya)]; };

    /* MORE LINES: trace several contour levels — bright nodal set (0) + flanking iso-lines */
    const levels = [
      { L: 0.0, a: 1.0, w: 1.0 },
      { L: 0.34, a: 0.5, w: 0.7 }, { L: -0.34, a: 0.5, w: 0.7 },
      { L: 0.62, a: 0.32, w: 0.55 }, { L: -0.62, a: 0.32, w: 0.55 }
    ];
    ctx.save();
    if (useGlow) ctx.shadowBlur = Math.min(16, 4 + glow * 0.16 + glowAmt * 10);
    for (let lv = 0; lv < levels.length; lv++) {
      const L = levels[lv].L, aScale = levels[lv].a, wScale = levels[lv].w;
      ctx.lineWidth = Math.max(0.5, lineW * (0.9 + bass * 0.5) * wScale);
      for (let j = 0; j < gridN - 1; j++) {
        for (let i = 0; i < gridN - 1; i++) {
          const v0 = buf[j * gridN + i] - L, v1 = buf[j * gridN + i + 1] - L, v2 = buf[(j + 1) * gridN + i + 1] - L, v3 = buf[(j + 1) * gridN + i] - L;
          const x0 = px + i * cell, y0 = py + j * cell, x1 = x0 + cell, y1 = y0 + cell;
          const pts = [];
          if ((v0 >= 0) !== (v1 >= 0)) pts.push(interp(x0, y0, v0, x1, y0, v1));
          if ((v1 >= 0) !== (v2 >= 0)) pts.push(interp(x1, y0, v1, x1, y1, v2));
          if ((v2 >= 0) !== (v3 >= 0)) pts.push(interp(x1, y1, v2, x0, y1, v3));
          if ((v3 >= 0) !== (v0 >= 0)) pts.push(interp(x0, y1, v3, x0, y0, v0));
          if (pts.length < 2) continue;
          const col = (i + j) % 3 === 0 ? p.a : (i + j) % 3 === 1 ? p.b : p.c;
          ctx.strokeStyle = rgba(col, lineAlpha * aScale * (0.7 + this.flash * 0.3));
          if (useGlow) ctx.shadowColor = rgba(col, 1);
          const seg = (pa, pb) => { ctx.beginPath(); ctx.moveTo(dispX(pa[0], pa[1]), dispY(pa[0], pa[1])); ctx.lineTo(dispX(pb[0], pb[1]), dispY(pb[0], pb[1])); ctx.stroke(); };
          seg(pts[0], pts[1]);
          if (pts.length === 4) seg(pts[2], pts[3]);
        }
      }
    }
    ctx.restore();

    this.drawReadout(ctx, px, py, size, p, bass, mid, high, time);
    ctx.fillStyle = rgba(p.b, 0.4); ctx.font = '9px Courier New';
    ctx.fillText('PLATE ' + this.nB + ':' + this.mB + (this.sB > 0 ? '+' : '-') + '  MORPH ' + Math.round(this.morph * 100) + '%', px + 4, py + size + 14);
    ctx.restore();
  }
};
