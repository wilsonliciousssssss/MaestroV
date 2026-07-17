function mg_scenePalette() { return VisualState.palette(); }
function mg_perfScale() { return VisualState.perfMode().densityScale; }
function mg_clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function mg_norm(value, fallback = 0) { return mg_clamp((value ?? fallback) / 100, 0, 1); }
function mg_count(value, fallback, maxNormal, maxHybrid) { const cap = VisualState.scene === 'hybrid' ? maxHybrid : maxNormal; return Math.max(0, Math.min(cap, Math.floor((value || fallback) * mg_perfScale()))); }
function mg_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 10) {
    ctx.shadowBlur = Math.min(28, glow * 0.24 + radius * 0.8);
    ctx.shadowColor = color;
  }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.2, radius), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function mg_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1, dash = null) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
function mg_drawBox(ctx, x, y, w, h, color, alpha = 0.2, lw = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
function mg_arc(ctx, x, y, r, start, end, color, alpha = 0.18, width = 1, dash = null) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.arc(x, y, r, start, end);
  ctx.stroke();
  ctx.restore();
}

const MobiusGalaxyScene = {
  signals: [],
  dust: [],
  lastKey: '',
  presets: ['Clean Topology', 'Galaxy Wormhole', 'Data Mobius', 'Neon Ribbon', 'Chaos Twist'],

  reset() {
    this.signals = [];
    this.dust = [];
    this.lastKey = '';
  },

  trimForHybrid() {
    if (this.signals.length > 42) this.signals.splice(0, this.signals.length - 42);
    if (this.dust.length > 50) this.dust.splice(0, this.dust.length - 50);
  },

  drawFallback(ctx, width, height, time, audio) {
    const p = mg_scenePalette();
    const cx = width / 2;
    const cy = height / 2;
    const count = 96;
    let prev = null;
    for (let i = 0; i <= count; i++) {
      const u = i / count * Math.PI * 2;
      const r = Math.min(width, height) * (0.23 + audio.bass * 0.04);
      const x = cx + Math.cos(u + time * 0.18) * r;
      const y = cy + Math.sin(u * 2 + time * 0.2) * r * 0.46;
      const col = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
      if (prev) mg_drawLine(ctx, prev.x, prev.y, x, y, col, 0.12 + audio.high * 0.08, 0.8);
      if (i % 8 === 0) mg_drawGlowPoint(ctx, x, y, 1.3 + audio.high * 1.6, col, 0.42);
      prev = { x, y };
    }
    mg_arc(ctx, cx, cy, Math.min(width, height) * (0.08 + audio.bass * 0.05), 0, Math.PI * 2, p.b, 0.08 + audio.bass * 0.1, 1.2, [4, 8]);
  },

  ensure(width, height) {
    const signalCount = mg_count(VisualState.controls.mobiusSignalParticles, 42, 96, 42);
    const dustCount = mg_count(VisualState.controls.mobiusDustAmount, 50, 120, 50);
    const key = [width, height, signalCount, dustCount].join(':');
    if (this.lastKey === key) return;
    this.lastKey = key;
    this.signals = Array.from({ length: signalCount }, (_, i) => ({
      u: Math.random() * Math.PI * 2,
      lane: (Math.random() - 0.5) * 2,
      speed: 0.22 + Math.random() * 1.15,
      size: 0.9 + Math.random() * 2.6,
      phase: Math.random() * Math.PI * 2,
      colorSlot: i % 3
    }));
    this.dust = Array.from({ length: dustCount }, (_, i) => ({
      angle: i * 2.399963 + Math.random() * 0.2,
      radius: Math.sqrt(Math.random()),
      depth: Math.random(),
      size: 0.4 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      spin: 0.05 + Math.random() * 0.2
    }));
  },

  point(width, height, time, audio, u, lane = 0) {
    const cx = width / 2;
    const cy = height / 2;
    const minDim = Math.min(width, height);
    const mode = Math.round(VisualState.controls.mobiusMode || 1);
    const rot = VisualState.controls.mobiusRotation || 1.1;
    const ribbonWidth = (VisualState.controls.mobiusRibbonWidth || 38) / 100;
    const twistCtrl = mg_norm(VisualState.controls.mobiusTwistAmount, 56);
    const depthCtrl = mg_norm(VisualState.controls.mobiusDepthStrength, 68);
    const gravity = mg_norm(VisualState.controls.mobiusGravityPulse, 66);
    const lens = mg_norm(VisualState.controls.mobiusLensDistortion, 52);

    const twistCount = mode === 0 ? 1 : mode === 1 ? 1.35 : mode === 2 ? 1.8 : mode === 3 ? 1.1 : 2.4;
    const doubleFigure = mode === 4 ? Math.sin(u * 2 + time * 0.55) * 0.18 : 0;
    const galaxyRing = mode === 1 ? 0.08 : 0;
    const wormholePull = mode === 1 ? 0.12 + lens * 0.12 : 0;
    const chaos = mode === 4 ? Math.sin(u * 5 + time * 1.7) * 0.09 : 0;

    const twist = Math.sin(u * twistCount + time * rot * 0.7) * (0.35 + twistCtrl * 0.55);
    const depth = Math.cos(u + time * rot * 0.18) * depthCtrl;
    const scale = 1 + depth * 0.22 + audio.bass * gravity * 0.18;
    const baseR = minDim * (0.24 + galaxyRing + audio.bass * gravity * 0.04);
    const laneOffset = lane * minDim * (0.025 + ribbonWidth * 0.095) * (0.65 + Math.abs(twist) * 0.65);

    let x = cx + Math.cos(u + time * 0.16 * rot + doubleFigure) * (baseR + laneOffset * Math.cos(u * twistCount));
    let y = cy + Math.sin(u * (mode === 4 ? 1.7 : 1.0) + time * 0.12 * rot) * (baseR * 0.56 + laneOffset * Math.sin(u + twist)) + Math.sin(u * 2 + time * 0.3) * minDim * 0.035 * twistCtrl;

    const lensDx = x - cx;
    const lensDy = y - cy;
    const d = Math.hypot(lensDx, lensDy) || 1;
    const lensPull = wormholePull * audio.bass * Math.max(0, 1 - d / (minDim * 0.45));
    x += (lensDx / d) * lensPull * minDim * 0.08;
    y += (lensDy / d) * lensPull * minDim * 0.05;
    x += chaos * minDim * 0.12;
    y += Math.cos(u * 3 + time) * chaos * minDim * 0.08;

    return { x, y, depth, twist, scale, alpha: mg_clamp(0.34 + depth * 0.32, 0.12, 0.94) };
  },

  drawGalaxy(ctx, width, height, time, audio, p) {
    const cx = width / 2;
    const cy = height / 2;
    const stars = mg_count(VisualState.controls.galaxyPoints, 160, 260, 120);
    const spiral = mg_norm(VisualState.controls.galaxySpiral, 62);
    const lens = mg_norm(VisualState.controls.mobiusLensDistortion, 52);
    const gravity = mg_norm(VisualState.controls.mobiusGravityPulse, 66);
    const mode = Math.round(VisualState.controls.mobiusMode || 1);

    for (let i = 0; i < stars; i++) {
      const depth = (i % 7) / 7;
      const a = i * 2.399963 + time * (0.02 + depth * 0.09 + audio.beat * 0.03);
      const rr = Math.sqrt(i / Math.max(1, stars)) * Math.min(width, height) * (0.42 + spiral * 0.12) * (1 + audio.bass * gravity * 0.12);
      const swirl = a + rr * 0.004 * spiral + time * 0.05 * spiral;
      const flatten = 0.46 + depth * 0.28;
      let x = cx + Math.cos(swirl) * rr;
      let y = cy + Math.sin(swirl) * rr * flatten;

      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const warp = lens * Math.max(0, 1 - d / (Math.min(width, height) * 0.55)) * audio.bass;
      x += (dx / d) * warp * 18;
      y += (dy / d) * warp * 12;

      const col = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
      mg_drawGlowPoint(ctx, x, y, 0.5 + depth * 1.4 + audio.high * 1.1, col, 0.12 + depth * 0.13 + audio.high * 0.12);
      if (mode === 2 && i % 17 === 0) {
        mg_drawLine(ctx, cx, cy, x, y, col, 0.018 + audio.mid * 0.025, 0.55);
      }
    }

    const coreR = Math.min(width, height) * (0.035 + audio.bass * gravity * 0.04);
    mg_arc(ctx, cx, cy, coreR * 3.8, 0, Math.PI * 2, p.b, 0.06 + audio.bass * 0.12, 1.1 + audio.bass * 1.6, [4, 8]);
    mg_arc(ctx, cx, cy, coreR * 1.6, 0, Math.PI * 2, p.c, 0.08 + audio.high * 0.08, 0.8, [2, 6]);
  },

  drawRibbon(ctx, width, height, time, audio, p) {
    const count = Math.max(48, mg_count(VisualState.controls.mobiusDensity, 128, 180, 96));
    const surfaceGrid = mg_norm(VisualState.controls.mobiusSurfaceGrid, 58);
    const mode = Math.round(VisualState.controls.mobiusMode || 1);
    const lanes = [-1, -0.5, 0, 0.5, 1];
    const edgeA = [];
    const edgeB = [];
    const center = [];

    for (let i = 0; i <= count; i++) {
      const u = i / count * Math.PI * 2;
      edgeA.push(this.point(width, height, time, audio, u, -1));
      edgeB.push(this.point(width, height, time, audio, u, 1));
      center.push(this.point(width, height, time, audio, u, 0));
    }

    // shaded ribbon cells
    for (let i = 1; i < edgeA.length; i++) {
      const a1 = edgeA[i - 1], a2 = edgeA[i], b2 = edgeB[i], b1 = edgeB[i - 1];
      const avgDepth = (a1.depth + a2.depth + b1.depth + b2.depth) / 4;
      const col = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
      ctx.save();
      ctx.fillStyle = rgba(col, mg_clamp(0.025 + avgDepth * 0.04 + audio.bass * 0.025, 0.008, 0.11));
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.lineTo(b2.x, b2.y);
      ctx.lineTo(b1.x, b1.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // edge and center lines
    for (let i = 1; i < center.length; i++) {
      const col = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
      const alpha = 0.12 + audio.high * 0.08 + center[i].alpha * 0.12;
      mg_drawLine(ctx, edgeA[i - 1].x, edgeA[i - 1].y, edgeA[i].x, edgeA[i].y, col, alpha, 0.8 + Math.max(0, edgeA[i].depth) * 0.9);
      mg_drawLine(ctx, edgeB[i - 1].x, edgeB[i - 1].y, edgeB[i].x, edgeB[i].y, col, alpha, 0.8 + Math.max(0, edgeB[i].depth) * 0.9);
      mg_drawLine(ctx, center[i - 1].x, center[i - 1].y, center[i].x, center[i].y, col, 0.08 + audio.mid * 0.08, 0.6);
    }

    if (surfaceGrid > 0.04) {
      const crossStep = Math.max(4, Math.floor(18 - surfaceGrid * 12));
      for (let i = 0; i < center.length; i += crossStep) {
        const col = i % 2 ? p.a : p.b;
        mg_drawLine(ctx, edgeA[i].x, edgeA[i].y, edgeB[i].x, edgeB[i].y, col, 0.045 + surfaceGrid * 0.12 + audio.mid * 0.04, 0.65, [2, 5]);
      }

      if (VisualState.scene !== 'hybrid') lanes.forEach((lane, laneIndex) => {
        if (lane === -1 || lane === 1 || lane === 0) return;
        let prev = null;
        for (let i = 0; i <= count; i++) {
          const u = i / count * Math.PI * 2;
          const pt = this.point(width, height, time, audio, u, lane);
          if (prev) mg_drawLine(ctx, prev.x, prev.y, pt.x, pt.y, laneIndex % 2 ? p.c : p.a, 0.035 + surfaceGrid * 0.08, 0.5);
          prev = pt;
        }
      });
    }

    // high-frequency edge shimmer
    if (audio.high > 0.05 || mode === 3 || mode === 4) {
      for (let i = 0; i < center.length; i += 7) {
        const pt = center[i];
        const col = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
        mg_drawGlowPoint(ctx, pt.x, pt.y, 0.9 + audio.high * 2.2 + Math.max(0, pt.depth) * 0.8, col, 0.22 + audio.high * 0.36);
        if (mode === 3 && i % 21 === 0) {
          mg_drawLine(ctx, pt.x - 10, pt.y, pt.x + 10, pt.y, col, 0.1 + audio.high * 0.12, 0.75);
        }
      }
    }
  },

  drawSignals(ctx, width, height, time, audio, p) {
    const signalSpeed = mg_norm(VisualState.controls.mobiusSignalSpeed, 54);
    const mode = Math.round(VisualState.controls.mobiusMode || 1);
    this.signals.forEach((signal, i) => {
      signal.u = (signal.u + 0.006 * signal.speed * (0.35 + signalSpeed * 1.8 + audio.mid * 1.4)) % (Math.PI * 2);
      const pt = this.point(width, height, time, audio, signal.u + signal.phase * 0.04, signal.lane);
      const col = signal.colorSlot === 0 ? p.a : signal.colorSlot === 1 ? p.b : p.c;
      const trail = this.point(width, height, time, audio, signal.u - 0.035 * (1 + signal.speed), signal.lane);
      mg_drawLine(ctx, trail.x, trail.y, pt.x, pt.y, col, 0.12 + audio.high * 0.18, 0.8 + audio.high * 1.2);
      mg_drawGlowPoint(ctx, pt.x, pt.y, signal.size * (1 + audio.bass * 0.4 + audio.high * 0.7), col, 0.42 + audio.high * 0.35);
      if ((mode === 2 || mode === 4) && i % 5 === 0) {
        mg_drawBox(ctx, pt.x - 4, pt.y - 4, 8, 8, col, 0.1 + audio.mid * 0.08, 0.8);
      }
    });
  },

  drawDust(ctx, width, height, time, audio, p) {
    const cx = width / 2;
    const cy = height / 2;
    const minDim = Math.min(width, height);
    this.dust.forEach((d, i) => {
      const angle = d.angle + time * d.spin * (0.4 + audio.mid * 0.5);
      const radius = d.radius * minDim * (0.42 + d.depth * 0.18) * (1 + audio.bass * 0.05);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * (0.45 + d.depth * 0.35);
      const col = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
      mg_drawGlowPoint(ctx, x, y, d.size * (0.65 + d.depth + audio.high * 0.45), col, 0.04 + d.depth * 0.09 + audio.high * 0.045);
    });
  },

  applyPreset(name) {
    const presets = {
      topology: {
        mobiusDensity: 180, galaxyPoints: 120, mobiusRibbonWidth: 28, mobiusTwistAmount: 42,
        mobiusDepthStrength: 54, mobiusSurfaceGrid: 78, mobiusSignalParticles: 34, mobiusSignalSpeed: 34,
        galaxySpiral: 32, mobiusDustAmount: 40, mobiusGravityPulse: 32, mobiusLensDistortion: 22, mobiusMode: 0
      },
      wormhole: {
        mobiusDensity: 210, galaxyPoints: 360, mobiusRibbonWidth: 46, mobiusTwistAmount: 62,
        mobiusDepthStrength: 88, mobiusSurfaceGrid: 44, mobiusSignalParticles: 64, mobiusSignalSpeed: 46,
        galaxySpiral: 86, mobiusDustAmount: 140, mobiusGravityPulse: 88, mobiusLensDistortion: 82, mobiusMode: 1
      },
      data: {
        mobiusDensity: 190, galaxyPoints: 220, mobiusRibbonWidth: 32, mobiusTwistAmount: 58,
        mobiusDepthStrength: 66, mobiusSurfaceGrid: 68, mobiusSignalParticles: 118, mobiusSignalSpeed: 74,
        galaxySpiral: 52, mobiusDustAmount: 70, mobiusGravityPulse: 52, mobiusLensDistortion: 40, mobiusMode: 2
      },
      neon: {
        mobiusDensity: 230, galaxyPoints: 280, mobiusRibbonWidth: 52, mobiusTwistAmount: 64,
        mobiusDepthStrength: 72, mobiusSurfaceGrid: 54, mobiusSignalParticles: 92, mobiusSignalSpeed: 64,
        galaxySpiral: 60, mobiusDustAmount: 110, mobiusGravityPulse: 66, mobiusLensDistortion: 54, mobiusMode: 3
      },
      chaos: {
        mobiusDensity: 260, galaxyPoints: 420, mobiusRibbonWidth: 62, mobiusTwistAmount: 92,
        mobiusDepthStrength: 86, mobiusSurfaceGrid: 72, mobiusSignalParticles: 140, mobiusSignalSpeed: 88,
        galaxySpiral: 80, mobiusDustAmount: 180, mobiusGravityPulse: 82, mobiusLensDistortion: 76, mobiusMode: 4
      }
    };
    const selected = presets[name] || presets.wormhole;
    Object.entries(selected).forEach(([id, value]) => VisualState.setControl(id, value));
    this.reset();
  },

  drawDetailed(ctx, width, height, time, audio) {
    this.ensure(width, height);
    const p = mg_scenePalette();
    const cx = width / 2;
    const cy = height / 2;
    const gravity = mg_norm(VisualState.controls.mobiusGravityPulse, 66);
    const lens = mg_norm(VisualState.controls.mobiusLensDistortion, 52);
    const mode = Math.round(VisualState.controls.mobiusMode || 1);

    ctx.save();
    this.drawGalaxy(ctx, width, height, time, audio, p);
    this.drawDust(ctx, width, height, time, audio, p);

    // gravity lens rings
    const core = Math.min(width, height) * (0.08 + audio.bass * gravity * 0.08);
    mg_arc(ctx, cx, cy, core * 2.2, 0, Math.PI * 2, p.a, 0.04 + audio.bass * 0.1, 1 + audio.bass * 1.8, [6, 12]);
    mg_arc(ctx, cx, cy, core * (3.4 + lens * 1.2), time * 0.3, Math.PI * 1.5 + time * 0.3, p.c, 0.04 + audio.high * 0.08, 0.9, [3, 8]);

    this.drawRibbon(ctx, width, height, time, audio, p);
    this.drawSignals(ctx, width, height, time, audio, p);

    // HUD brackets / identity frame
    const frameW = Math.min(width, height) * (0.42 + mode * 0.015);
    const frameH = frameW * 0.62;
    mg_drawBox(ctx, cx - frameW / 2, cy - frameH / 2, frameW, frameH, p.a, 0.035 + audio.beat * 0.05, 1);
    mg_drawLine(ctx, cx - frameW / 2, cy, cx - frameW / 2 - 24, cy, p.b, 0.08 + audio.mid * 0.08, 0.8);
    mg_drawLine(ctx, cx + frameW / 2, cy, cx + frameW / 2 + 24, cy, p.b, 0.08 + audio.mid * 0.08, 0.8);
    ctx.restore();
  }
,

  draw(ctx, width, height, time, audio) {
    try {
      this.drawDetailed(ctx, width, height, time, audio);
    } catch (error) {
      console.warn('[Maestro V95] Mobius detailed draw failed, using fallback.', error);
      this.drawFallback(ctx, width, height, time, audio || {});
    }
  }
};

window.MobiusGalaxyScene = MobiusGalaxyScene;
