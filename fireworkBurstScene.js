
function fwClamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function fwLine(ctx, x1, y1, x2, y2, color, alpha = 0.3, width = 1, dash = null) {
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
function fwDot(ctx, x, y, size, color, alpha = 0.35) {
  ctx.save();
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
const FireworkBurstScene = {
  bursts: [],
  cooldown: 0,
  rockets: [],
  lastMegaAt: -999,
  reset() {
    this.bursts = [];
    this.cooldown = 0;
    this.rockets = [];
    this.lastMegaAt = -999;
  },
  trimForHybrid() {
    if (this.rockets && this.rockets.length > 6) this.rockets.splice(0, this.rockets.length - 6);
    if (this.bursts.length > 10) this.bursts.splice(0, this.bursts.length - 10);
  },
  pendingManualBursts: 0,

  paletteColor(index, palette) {
    return index % 3 === 0 ? palette.a : index % 3 === 1 ? palette.b : palette.c;
  },

  shapeLabel(mode) {
    return ['random', 'sphere', 'fan', 'chrysanthemum', 'spiral'][Math.round(mode || 0)] || 'random';
  },

  chooseShape(styleOverride = null) {
    if (styleOverride) return styleOverride;
    const mode = Math.round(VisualState.controls.fireworkShapeMode || 0);
    if (mode === 0) {
      const all = ['sphere', 'fan', 'chrysanthemum', 'spiral'];
      return all[Math.floor(Math.random() * all.length)];
    }
    return this.shapeLabel(mode);
  },

  buildLineParticles(style, spokes, radius, scatter, colorOffset, lineEnergy, mega = false) {
    return Array.from({ length: spokes }, (_, i) => {
      const t = spokes <= 1 ? 0 : i / (spokes - 1);
      const baseAngle = (i / spokes) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * (0.12 + scatter * 0.26);
      let angle = baseAngle + jitter;
      let reach = radius * (0.4 + Math.random() * 0.7);
      let dash = Math.random() < 0.2 ? [3, 4] : null;
      let bend = (Math.random() - 0.5) * 0.08;
      if (style === 'fan') {
        angle = -Math.PI * 0.5 + (t - 0.5) * Math.PI * (0.8 + scatter * 0.75) + jitter;
        reach = radius * (0.5 + Math.random() * 0.55 + (1 - Math.abs(t - 0.5)) * 0.15);
        bend = (t - 0.5) * 0.14;
      } else if (style === 'chrysanthemum') {
        angle = baseAngle + jitter * 0.6;
        reach = radius * (0.62 + Math.random() * 0.5);
        dash = i % 3 === 0 ? [2, 5] : null;
        bend = (Math.random() - 0.5) * 0.02;
      } else if (style === 'spiral') {
        angle = baseAngle * 0.68 + i * 0.11 + jitter;
        reach = radius * (0.25 + t * 0.9 + Math.random() * 0.1);
        dash = [2, 6];
        bend = 0.18 + t * 0.08;
      }
      return {
        angle,
        reach: mega ? reach * 1.15 : reach,
        width: 0.7 + Math.random() * 1.9 + lineEnergy * 0.5,
        colorIndex: colorOffset + i,
        dash,
        bend,
        speed: 0.78 + Math.random() * 0.55 + (style === 'spiral' ? 0.1 : 0)
      };
    });
  },

  buildDotParticles(style, sparkCount, radius, scatter, colorOffset, mega = false) {
    return Array.from({ length: sparkCount }, (_, i) => {
      const t = sparkCount <= 1 ? 0 : i / (sparkCount - 1);
      let angle = Math.random() * Math.PI * 2;
      let reach = radius * (0.55 + Math.random() * 0.75);
      let drift = (Math.random() - 0.5) * scatter * 16;
      let orbit = 0;
      if (style === 'fan') {
        angle = -Math.PI * 0.5 + (t - 0.5) * Math.PI * (0.95 + scatter * 0.55) + (Math.random() - 0.5) * 0.2;
        reach = radius * (0.4 + Math.random() * 0.7 + (1 - Math.abs(t - 0.5)) * 0.2);
      } else if (style === 'chrysanthemum') {
        angle = (i % Math.max(8, Math.round(sparkCount / 4))) / Math.max(8, Math.round(sparkCount / 4)) * Math.PI * 2 + (Math.random() - 0.5) * 0.08;
        reach = radius * (0.7 + Math.random() * 0.42);
        drift *= 0.65;
      } else if (style === 'spiral') {
        angle = Math.PI * 2 * (t * 2.4 + Math.random() * 0.08);
        reach = radius * (0.16 + t * 0.95);
        orbit = 0.55 + Math.random() * 0.85;
      }
      return {
        angle,
        reach: mega ? reach * 1.2 : reach,
        speed: 0.82 + Math.random() * 0.72,
        size: 0.9 + Math.random() * 3.4,
        drift,
        colorIndex: colorOffset + i,
        twinkle: Math.random() * Math.PI * 2,
        tail: 6 + Math.random() * 18,
        orbit
      };
    });
  },

  buildDustParticles(radius, colorOffset, mega = false) {
    const dustAmount = Math.max(0, VisualState.controls.fireworkDustAmount || 26);
    const dustCount = Math.max(0, Math.round(dustAmount * (0.7 + Math.random() * 0.7) + (mega ? dustAmount * 0.45 : 0)));
    const dustSizeControl = Math.max(1, VisualState.controls.fireworkDustSize || 8) / 8;
    return Array.from({ length: dustCount }, (_, i) => ({
      angle: Math.random() * Math.PI * 2,
      drift: radius * (0.2 + Math.random() * 0.85),
      speed: 0.45 + Math.random() * 0.5,
      size: (0.6 + Math.random() * 1.8) * dustSizeControl,
      wobble: Math.random() * Math.PI * 2,
      colorIndex: colorOffset + i,
      orbit: (Math.random() - 0.5) * 0.2
    }));
  },

  resolveStageDepth() {
    const configured = Math.round(VisualState.controls.fireworkStageDepth ?? 0);
    if (configured <= 0) return 1 + Math.floor(Math.random() * 3);
    return configured;
  },

  spawnBurst(width, height, time, audio, opts = {}) {
    const sizeBase = VisualState.controls.fireworkSize || 76;
    const scatter = (VisualState.controls.fireworkScatter || 64) / 100;
    const lineEnergy = (VisualState.controls.fireworkLineBurst || 68) / 100;
    const stageDepth = this.resolveStageDepth();
    const childBurstAmount = Math.round(VisualState.controls.fireworkChildBurstAmount || 4);
    const megaSensitivity = (VisualState.controls.fireworkMegaSensitivity || 76) / 100;
    const megaFromBeat = audio.beat > (0.72 + (1 - megaSensitivity) * 0.18);
    const mega = !!opts.mega || megaFromBeat;
    const stage = opts.stage || 1;
    const maxStage = opts.maxStage || stageDepth;
    const shape = this.chooseShape(opts.shape || null);
    const x = opts.x ?? width * (0.1 + Math.random() * 0.8);
    const y = opts.y ?? height * (0.12 + Math.random() * 0.68);
    const bassScale = 1 + audio.bass * 0.78 + audio.beat * 0.26;
    const megaScale = mega ? 1.5 + audio.beat * 0.35 : 1;
    const stageScale = Math.pow(0.68, stage - 1);
    const radius = (opts.radius || sizeBase * (0.52 + Math.random() * 0.95)) * bassScale * megaScale * stageScale;
    const life = (opts.life || 0.72 + Math.random() * 0.6 + audio.high * 0.22) * (mega ? 1.15 : 1) * (stage > 1 ? 0.86 : 1);
    const spokeBase = shape === 'chrysanthemum' ? 18 : shape === 'spiral' ? 14 : 10;
    const sparkBase = shape === 'chrysanthemum' ? 28 : shape === 'spiral' ? 20 : 14;
    const spokes = Math.round(spokeBase + Math.random() * 10 + audio.mid * 14 + lineEnergy * 10 + (mega ? 10 : 0));
    const sparkCount = Math.round(sparkBase + Math.random() * 18 + audio.high * 24 + scatter * 14 + (mega ? 14 : 0));
    const ringCount = Math.round(1 + Math.random() * 2 + audio.bass * 1.8 + (mega ? 2 : 0));
    const colorOffset = Math.floor(Math.random() * 3);
    const lineParticles = this.buildLineParticles(shape, spokes, radius, scatter, colorOffset, lineEnergy, mega);
    const dotParticles = this.buildDotParticles(shape, sparkCount, radius, scatter, colorOffset, mega);
    const dustParticles = this.buildDustParticles(radius, colorOffset, mega);

    this.bursts.push({
      x, y, radius, life, born: time, ringCount, style: shape,
      lineParticles, dotParticles, dustParticles,
      dustDuration: 0.48 + Math.random() * 0.55 + (mega ? 0.18 : 0),
      ringTilt: Math.random() * Math.PI * 2,
      colorOffset,
      mega,
      stage,
      maxStage,
      childrenSpawned: false,
      childTrigger: opts.childTrigger || (0.44 + Math.random() * 0.15),
      childCount: opts.childCount || childBurstAmount,
      parentAngle: opts.parentAngle || 0
    });
  },


  queueManualBurst() {
    this.pendingManualBursts = Math.min((this.pendingManualBursts || 0) + 1, 6);
  },

  triggerMegaBurst(width, height, time, audio) {
    const count = audio.beat > 0.92 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      this.spawnBurst(width, height, time, audio, {
        mega: true,
        maxStage: Math.max(2, this.resolveStageDepth()),
        radius: (VisualState.controls.fireworkSize || 76) * (1.15 + Math.random() * 0.45)
      });
    }
    this.lastMegaAt = time;
  },

  updateSpawns(width, height, time, audio) {
    const maxBursts = Math.round(VisualState.controls.fireworkMaxBursts || 8);
    if ((this.pendingManualBursts || 0) > 0 && this.bursts.length < maxBursts) {
      this.spawnBurst(width, height, time, audio, {});
      this.pendingManualBursts -= 1;
      this.cooldown = Math.max(this.cooldown, 0.12);
    }
    const spawnRate = (VisualState.controls.fireworkRate || 36) / 100;
    const speed = VisualState.controls.speed || 1.2;
    const megaSensitivity = (VisualState.controls.fireworkMegaSensitivity || 76) / 100;
    this.cooldown -= 0.016 * speed;
    const urgency = spawnRate * (0.34 + audio.high * 0.34 + audio.mid * 0.24 + audio.beat * 0.34);
    const megaBeat = audio.beat > (0.76 + (1 - megaSensitivity) * 0.14) && (time - this.lastMegaAt > (1.55 - megaSensitivity * 0.65));
    if (megaBeat && this.bursts.length < maxBursts) {
      this.triggerMegaBurst(width, height, time, audio);
      this.cooldown = fwClamp(0.18 + (1 - spawnRate) * 0.52, 0.06, 0.7);
      return;
    }

    const shouldBurst = this.cooldown <= 0 && this.bursts.length < maxBursts && (Math.random() < urgency * 0.12 || audio.beat > 0.78);
    if (shouldBurst) {
      const spawnCount = audio.beat > 0.88 ? 2 : 1;
      for (let i = 0; i < spawnCount && this.bursts.length + this.rockets.length < maxBursts + 4; i++) this.launchRocket(width, height, time, audio);
      this.cooldown = fwClamp(0.14 + (1 - spawnRate) * 0.82 - audio.high * 0.14, 0.05, 1.2);
    }
  },

  /* V112 — anticipation: shells RISE as sparkling rockets and detonate ON the beat at apex. */
  launchRocket(width, height, time, audio) {
    const tx = width * (0.1 + Math.random() * 0.8);
    const ty = height * (0.12 + Math.random() * 0.55);
    this.rockets.push({ x0: tx + (Math.random() - 0.5) * width * 0.12, tx, ty, t: 0, hold: 0, speed: 0.017 + Math.random() * 0.013, seed: Math.random() * Math.PI * 2 });
  },

  updateRockets(ctx, width, height, time, audio) {
    if (!this.rockets || !this.rockets.length) return;
    const p = VisualState.palette();
    const bus = typeof BeatBus !== 'undefined' ? BeatBus : null;
    this.rockets = this.rockets.filter((r) => {
      if (r.t < 1) r.t = Math.min(1, r.t + r.speed * (1 + (audio.bass || 0) * 0.3));
      const ease = r.t * (2 - r.t); /* decelerate into the apex */
      const x = r.x0 + (r.tx - r.x0) * ease + Math.sin(time * 7 + r.seed) * 2.4 * (1 - r.t);
      const y = (height + 12) + (r.ty - height - 12) * ease;
      const tailY = y + 26 + 40 * (1 - r.t);
      fwLine(ctx, x, y, x + Math.sin(time * 9 + r.seed) * 1.6, tailY, p.a, 0.4 + (audio.high || 0) * 0.2, 1.1);
      fwDot(ctx, x, y, 1.6 + (audio.high || 0) * 1.4, p.a, 0.85);
      for (let i = 0; i < 3; i++) fwDot(ctx, x + (Math.random() - 0.5) * 7, y + 8 + Math.random() * 22, 0.7 + Math.random(), i % 2 ? p.b : p.c, 0.35);
      if (r.t >= 1) {
        r.hold += 1;
        if ((bus && bus.active) || r.hold > 20) {
          this.spawnBurst(width, height, time, audio, { x: r.tx, y: r.ty });
          return false;
        }
      }
      return true;
    });
  },

  spawnChildBursts(burst, time, audio, width, height) {
    if (burst.childrenSpawned || burst.stage >= burst.maxStage) return;
    burst.childrenSpawned = true;
    const nextStage = burst.stage + 1;
    const count = fwClamp(burst.childCount + (burst.mega ? 1 : 0), 1, 10);
    for (let i = 0; i < count; i++) {
      const line = burst.lineParticles[(i * Math.floor(burst.lineParticles.length / Math.max(1, count) + 1)) % burst.lineParticles.length];
      const bias = count <= 1 ? 0.5 : i / (count - 1);
      let angle = line ? line.angle : Math.random() * Math.PI * 2;
      if (burst.style === 'fan') angle += (bias - 0.5) * 0.2;
      const stageSpread = nextStage === 2 ? 1.18 : nextStage >= 3 ? 1.34 : 1;
      const dist = burst.radius * (0.34 + (burst.style === 'spiral' ? 0.18 : 0) + Math.random() * 0.22) * stageSpread;
      const childX = burst.x + Math.cos(angle) * dist;
      const childY = burst.y + Math.sin(angle) * dist;
      let childShape = burst.style;
      if (burst.style === 'spiral' && nextStage >= burst.maxStage) childShape = 'sphere';
      if (burst.style === 'sphere' && nextStage === burst.maxStage && Math.random() < 0.4) childShape = 'chrysanthemum';
      this.spawnBurst(width || window.innerWidth, height || window.innerHeight, time, audio, {
        x: childX,
        y: childY,
        stage: nextStage,
        maxStage: burst.maxStage,
        shape: childShape,
        radius: burst.radius * (burst.mega ? 0.58 : 0.46),
        life: burst.life * 0.72,
        childCount: Math.max(1, burst.childCount - 1),
        mega: burst.mega && nextStage === 2,
        parentAngle: angle,
        childTrigger: 0.42 + Math.random() * 0.12
      });
    }
  },

  drawDust(ctx, burst, time, audio) {
    const age = time - burst.born;
    const dustAge = age - burst.life * 0.56;
    if (dustAge <= 0) return;
    const dustT = fwClamp(dustAge / burst.dustDuration, 0, 1);
    const fade = 1 - dustT;
    const p = VisualState.palette();
    burst.dustParticles.forEach((dust, i) => {
      const color = this.paletteColor(dust.colorIndex + 1, p);
      const spread = burst.radius * 0.18 + dust.drift * dustT * (0.7 + audio.high * 0.45);
      const angle = dust.angle + dust.orbit * dustT * 4;
      const x = burst.x + Math.cos(angle) * spread + Math.cos(dust.wobble + age * 3.6) * 3.2 * fade;
      const y = burst.y + Math.sin(angle) * spread + Math.sin(dust.wobble + age * 2.8) * 3.2 * fade;
      const alpha = (0.05 + audio.high * 0.08 + (burst.mega ? 0.03 : 0)) * fade;
      const size = dust.size * (0.9 + audio.high * 0.3 + dustT * 0.25);
      fwDot(ctx, x, y, size, color, alpha);
      if (i % 4 === 0) {
        const tail = 4 + dustT * 8 + audio.mid * 3;
        fwLine(ctx, x, y, x - Math.cos(angle) * tail, y - Math.sin(angle) * tail, color, alpha * 0.55, 0.45 + audio.high * 0.3);
      }
    });
  },

  drawBurst(ctx, burst, time, audio) {
    const p = VisualState.palette();
    const age = time - burst.born;
    const t = fwClamp(age / burst.life, 0, 1);
    const fade = 1 - t;
    if (t < 0.14 && typeof additiveDraw === 'function') {
      additiveDraw(ctx, () => {
        const k = 1 - t / 0.14;
        ctx.fillStyle = rgba(p.a, 0.5 * k * (burst.mega ? 1.2 : 1));
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, burst.radius * (0.1 + (1 - k) * 0.32) * (burst.mega ? 1.6 : 1), 0, Math.PI * 2);
        ctx.fill();
      });
    }
    const bassBoost = 1 + audio.bass * 0.32 + (burst.mega ? 0.16 : 0);
    const midBoost = 1 + audio.mid * 0.38 + (burst.style === 'chrysanthemum' ? 0.08 : 0);
    const highBoost = 1 + audio.high * 0.48 + (burst.style === 'spiral' ? 0.12 : 0);
    const expandT = 1 - Math.pow(1 - t, 2);

    if (!burst.childrenSpawned && t > burst.childTrigger && burst.stage < burst.maxStage) {
      this.spawnChildBursts(burst, time, audio, ctx.canvas?.width || window.innerWidth, ctx.canvas?.height || window.innerHeight);
    }

    burst.lineParticles.forEach((line, i) => {
      const color = this.paletteColor(line.colorIndex, p);
      let progress = fwClamp(expandT * line.speed * midBoost, 0, 1);
      let angle = line.angle + Math.sin(age * 8 + i * 0.22) * line.bend * (1 - t);
      if (burst.style === 'spiral') {
        angle += expandT * 1.1;
        progress = fwClamp(Math.pow(t, 0.85) * line.speed * highBoost, 0, 1);
      }
      const len = line.reach * progress * bassBoost;
      const x2 = burst.x + Math.cos(angle) * len;
      const y2 = burst.y + Math.sin(angle) * len;
      const alpha = (0.14 + audio.mid * 0.34 + audio.beat * 0.1 + (burst.mega ? 0.08 : 0)) * fade;
      fwLine(ctx, burst.x, burst.y, x2, y2, color, alpha, line.width * (0.9 + audio.mid * 0.72), line.dash);
      if (t > 0.16) {
        const tipLen = Math.min(11 + audio.high * 7 + (burst.mega ? 4 : 0), len * (burst.style === 'fan' ? 0.22 : 0.16));
        fwLine(ctx, x2, y2, x2 - Math.cos(angle) * tipLen, y2 - Math.sin(angle) * tipLen, color, alpha * 0.75, 0.85 + audio.high * 0.85);
      }
      if (burst.style === 'chrysanthemum' && t > 0.2 && i % 2 === 0) {
        const sideAngle = angle + Math.sin(i) * 0.32;
        const sideLen = len * 0.16;
        fwLine(ctx, x2, y2, x2 + Math.cos(sideAngle + 0.65) * sideLen, y2 + Math.sin(sideAngle + 0.65) * sideLen, color, alpha * 0.48, 0.7);
        fwLine(ctx, x2, y2, x2 + Math.cos(sideAngle - 0.65) * sideLen, y2 + Math.sin(sideAngle - 0.65) * sideLen, color, alpha * 0.48, 0.7);
      }
    });

    burst.dotParticles.forEach((spark, i) => {
      const color = this.paletteColor(spark.colorIndex + 1, p);
      let progress = fwClamp(Math.pow(t, 0.75) * spark.speed * highBoost, 0, 1);
      let angle = spark.angle;
      if (burst.style === 'spiral') angle += t * spark.orbit * 2.1;
      const rr = spark.reach * progress;
      const driftX = Math.cos(age * 2.5 + spark.twinkle) * spark.drift * t * 0.05;
      const driftY = Math.sin(age * 2.1 + spark.twinkle) * spark.drift * t * 0.05;
      const x = burst.x + Math.cos(angle) * rr + driftX;
      const y = burst.y + Math.sin(angle) * rr + driftY;
      const alpha = (0.22 + audio.high * 0.3 + (burst.mega ? 0.08 : 0)) * fade;
      const size = spark.size * (1 + audio.high * 0.35 + audio.beat * 0.2 + (burst.mega ? 0.2 : 0));
      fwDot(ctx, x, y, size, color, alpha);
      const tailLen = spark.tail * (0.35 + audio.high * 0.56 + (burst.style === 'spiral' ? 0.18 : 0)) * fade;
      if (audio.high > 0.12) fwLine(ctx, x, y, x - Math.cos(angle) * tailLen, y - Math.sin(angle) * tailLen, color, alpha * 0.7, 0.6 + audio.high * 0.85);
    });

    for (let r = 0; r < burst.ringCount; r++) {
      const color = this.paletteColor(burst.colorOffset + r, p);
      const ringProgress = fwClamp(t * (1.02 + r * 0.16) * bassBoost, 0, 1);
      const rr = burst.radius * (0.24 + r * 0.18) * ringProgress;
      const segments = 16 + Math.round(audio.mid * 14) + (burst.mega ? 8 : 0);
      for (let s = 0; s < segments; s++) {
        if ((s + r) % 2 === 1) continue;
        let a1 = (s / segments) * Math.PI * 2 + burst.ringTilt + age * (0.15 + r * 0.03);
        if (burst.style === 'fan') {
          const fanMin = -Math.PI * 0.92;
          const fanSpan = Math.PI * 1.84;
          a1 = fanMin + (s / segments) * fanSpan + burst.ringTilt * 0.12;
        }
        if (burst.style === 'spiral') a1 += t * 1.25;
        const a2 = a1 + Math.PI * 2 / segments * 0.58;
        const x1 = burst.x + Math.cos(a1) * rr;
        const y1 = burst.y + Math.sin(a1) * rr;
        const x2 = burst.x + Math.cos(a2) * rr;
        const y2 = burst.y + Math.sin(a2) * rr;
        fwLine(ctx, x1, y1, x2, y2, color, (0.06 + audio.bass * 0.18 + (burst.mega ? 0.04 : 0)) * fade, 0.7 + audio.bass * 1.15);
      }
    }

    if (burst.mega) {
      const outer = burst.radius * (0.45 + expandT * 0.7);
      for (let i = 0; i < 12; i++) {
        const a1 = (i / 12) * Math.PI * 2 + age * 0.2;
        const a2 = a1 + Math.PI / 8;
        fwLine(ctx,
          burst.x + Math.cos(a1) * outer,
          burst.y + Math.sin(a1) * outer,
          burst.x + Math.cos(a2) * outer,
          burst.y + Math.sin(a2) * outer,
          this.paletteColor(burst.colorOffset + i, p),
          (0.08 + audio.beat * 0.16) * fade,
          1 + audio.bass * 0.8
        );
      }
    }

    this.drawDust(ctx, burst, time, audio);
    fwDot(ctx, burst.x, burst.y, 1.6 + audio.beat * 1.9 + (burst.mega ? 1.4 : 0), this.paletteColor(burst.colorOffset, p), (0.26 + audio.mid * 0.18) * fade);
  },

  draw(ctx, width, height, time, audio) {
    this.updateSpawns(width, height, time, audio);
    const p = VisualState.palette();
    const gridCount = 6;
    for (let i = 0; i < gridCount; i++) {
      const y = height * (0.14 + i * 0.12);
      fwLine(ctx, 0, y, width, y, i % 2 ? p.a : p.c, 0.015 + audio.high * 0.016, 0.8, [4, 10]);
    }
    this.updateRockets(ctx, width, height, time, audio);
    this.bursts = this.bursts.filter((burst) => time - burst.born < burst.life + burst.dustDuration + 0.04);
    this.bursts.forEach((burst) => this.drawBurst(ctx, burst, time, audio));
  }
};
