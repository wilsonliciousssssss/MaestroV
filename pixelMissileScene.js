
function missileScenePalette() { return VisualState.palette(); }
function missilePerfScale() { return VisualState.perfMode().densityScale; }
function missileDrawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) { const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale; ctx.save(); if (glow > 12) { ctx.shadowBlur = Math.min(22, glow * 0.22); ctx.shadowColor = color; } ctx.fillStyle = rgba(color, alpha); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
function missileDrawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1) { ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); }
function missileDrawBox(ctx, x, y, w, h, color, alpha = 0.2, lw = 1) { ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); ctx.restore(); }

const PixelMissileScene = {
  missiles: [], bursts: [], shockwaves: [], debris: [], empPulses: [], pendingManualMissiles: 0, pendingMegaMissiles: 0,
  reset() {
    this.missiles = [];
    this.bursts = [];
    this.shockwaves = [];
    this.debris = [];
    this.empPulses = [];
    this.pendingManualMissiles = 0;
    this.pendingMegaMissiles = 0;
  },
  trimForHybrid() {
    if (this.missiles.length > 12) this.missiles.splice(0, this.missiles.length - 12);
    if (this.bursts.length > 8) this.bursts.splice(0, this.bursts.length - 8);
    if (this.shockwaves.length > 8) this.shockwaves.splice(0, this.shockwaves.length - 8);
    if (this.debris.length > 90) this.debris.splice(0, this.debris.length - 90);
    if (this.empPulses.length > 5) this.empPulses.splice(0, this.empPulses.length - 5);
  },
  queueManualMissile() { this.pendingManualMissiles = Math.min(6, (this.pendingManualMissiles || 0) + 1); },
  queueMegaMissile() { this.pendingMegaMissiles = Math.min(3, (this.pendingMegaMissiles || 0) + 1); },
  resolveBarrageMode() { const mode = Math.round(VisualState.controls.missileBarrageMode ?? 0); return mode <= 0 ? 1 + Math.floor(Math.random() * 3) : mode; },
  resolveSplitMode() { const mode = Math.round(VisualState.controls.missileSplitMode ?? 2); return mode === 0 ? 1 + Math.floor(Math.random() * 3) : mode; },
  resolveExplosionMode() { const mode = Math.round(VisualState.controls.missileExplosionMode ?? 0); return mode === 0 ? 1 + Math.floor(Math.random() * 4) : mode; },
  resolveTypeMode() { const mode = Math.round(VisualState.controls.missileTypeMode ?? 0); return mode === 0 ? 1 + Math.floor(Math.random() * 5) : mode; },
  pushLaunchShockwave(x, y, mega = false) { const base = (VisualState.controls.launchShockwave || 64) / 100; this.shockwaves.push({ x, y, r: 6, age: 0, life: 0.42 + base * 0.22 + (mega ? 0.18 : 0), power: 18 + base * 36 + (mega ? 30 : 0), mega }); },
  pushEmpPulse(x, y, baseSize, mega = false) {
    const radiusCtrl = (VisualState.controls.empRadius || 62) / 100;
    const ringCount = Math.max(1, Math.round(VisualState.controls.empRingCount || 3));
    const interference = (VisualState.controls.interferenceStrength || 48) / 100;
    this.empPulses.push({ x, y, age: 0, life: 0.68 + radiusCtrl * 0.35 + (mega ? 0.2 : 0), size: baseSize * (0.85 + radiusCtrl * 1.05), rings: ringCount, interference, mega });
  },
  pushDebris(x, y, size, audio, countBoost = 0) {
    const amount = (VisualState.controls.debrisAmount || 54) / 100;
    const lifetime = (VisualState.controls.debrisLifetime || 56) / 100;
    const count = Math.max(4, Math.floor((10 + amount * 24 + countBoost) * missilePerfScale()));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = size * (0.02 + Math.random() * 0.08) * (1 + audio.high * 0.4);
      this.debris.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - Math.random() * 1.2, age: 0, life: 0.5 + lifetime * 0.95 + Math.random() * 0.35, size: 0.8 + Math.random() * 2.1, box: Math.random() < 0.45, color: i % 3 === 0 ? 'a' : i % 3 === 1 ? 'b' : 'c' });
    }
  },
  applyTypeProfile(type, missile) { const heavyChance = (VisualState.controls.heavyRocketChance || 36) / 100; if (type === 3 && Math.random() > heavyChance) type = 1; missile.type = type; if (type === 2) { missile.speed *= 1.45; missile.width *= 0.8; missile.arc *= 0.75; missile.trailLimit = Math.max(4, Math.round(missile.trailLimit * 0.8)); } else if (type === 3) { missile.speed *= 0.8; missile.width *= 1.5; missile.arc *= 1.15; missile.explosionScale = 1.42; missile.heavy = true; } else if (type === 4) { missile.speed *= 0.92; missile.cluster = true; missile.split = true; missile.explosionScale = 0.9; } else if (type === 5) { missile.guided = true; missile.speed *= 1.02; missile.guidanceBoost = 1.8; missile.arc *= 1.02; } },
  spawnMissile(width, height, audio, time, opts = {}) { const scatter = (VisualState.controls.missileScatter || 56) / 100, barrageMode = opts.barrageMode || this.resolveBarrageMode(), splitMode = opts.splitMode || this.resolveSplitMode(), explosionMode = opts.explosionMode || this.resolveExplosionMode(), mega = !!opts.mega; const lane = Math.floor(Math.random() * 5); let x0 = width * 0.15, y0 = height + 28, tx = width * (0.15 + Math.random() * 0.7), ty = height * (0.12 + Math.random() * (0.18 + scatter * 0.18)), arc = 130 + Math.random() * 60; if (barrageMode === 1) { x0 = width * (0.1 + lane * 0.2 + (Math.random() - 0.5) * 0.08); tx = x0 + (Math.random() - 0.5) * width * 0.08 * scatter; ty = height * (0.08 + Math.random() * 0.22); arc = 160 + Math.random() * 80; } else if (barrageMode === 2) { const fromLeft = Math.random() < 0.5; x0 = fromLeft ? -20 : width + 20; y0 = height * (0.38 + Math.random() * 0.48); tx = width * (0.18 + Math.random() * 0.64); ty = height * (0.12 + Math.random() * 0.34); arc = 70 + Math.random() * 45; } else if (barrageMode === 3) { const fromSide = Math.random() < 0.5; if (fromSide) { x0 = Math.random() < 0.5 ? -20 : width + 20; y0 = height * (0.28 + Math.random() * 0.52); } else { x0 = width * (0.08 + Math.random() * 0.84); y0 = height + 28; } tx = width * (0.24 + Math.random() * 0.52); ty = height * (0.1 + Math.random() * 0.28); arc = 105 + Math.random() * 70; } let splitChance = 0.28 + audio.mid * 0.14; if (splitMode === 1) splitChance = 0.12 + audio.mid * 0.08; else if (splitMode === 2) splitChance = 0.28 + audio.mid * 0.14; else if (splitMode === 3) splitChance = 0.58 + audio.mid * 0.16; const small = !mega && Math.random() < 0.32; const power = (VisualState.controls.megaMissilePower || 70) / 100; const missile = { x0, y0, tx, ty, t: 0, speed: (mega ? 0.0065 : 0.0075) + Math.random() * (mega ? 0.012 : 0.018), width: (mega ? 2.8 : 1) + Math.random() * (mega ? 2.6 : 2.2), trail: [], trailLimit: Math.max(5, Math.round((VisualState.controls.missileTrailLength || 16) * (small ? 0.75 : mega ? 1.45 : 1.15))), split: mega ? true : Math.random() < splitChance, small, mega, lane, born: time, seed: Math.random() * Math.PI * 2, arc: arc * (mega ? 1.2 + power * 0.2 : 1), exploded: false, thrustPhase: Math.random() * Math.PI * 2, barrageMode, explosionMode, lockPulseOffset: Math.random() * Math.PI * 2, type: 1, explosionScale: 1, clusterFired: false, isChild: !!opts.isChild };
    this.applyTypeProfile(opts.typeMode || this.resolveTypeMode(), missile);
    if (opts.isChild) { missile.cluster = false; missile.split = false; missile.speed *= 1.12; missile.width *= 0.72; missile.arc *= 0.4; missile.explosionScale *= 0.65; }
    this.missiles.push(missile); this.pushLaunchShockwave(x0, y0 - 10, mega);
  },
  spawnClusterChildren(parent, x, y, width, height, audio, time) { const amount = Math.max(2, Math.round(VisualState.controls.clusterSplitAmount || 4)); for (let i = 0; i < amount; i++) { const angle = i / amount * Math.PI * 2 + parent.seed, radius = 50 + Math.random() * 80, tx = Math.max(width * 0.08, Math.min(width * 0.92, parent.tx + Math.cos(angle) * radius)), ty = Math.max(height * 0.08, Math.min(height * 0.7, parent.ty + Math.sin(angle) * radius * 0.55)); this.spawnMissile(width, height, audio, time, { isChild: true, typeMode: Math.random() < 0.45 ? 2 : 5, explosionMode: Math.random() < 0.5 ? 2 : 3, barrageMode: 1 }); const child = this.missiles[this.missiles.length - 1]; child.x0 = x; child.y0 = y; child.tx = tx; child.ty = ty; child.arc = 35 + Math.random() * 40; child.t = 0; child.clusterChild = true; } },
  spawnBurst(x, y, missile, audio, time) {
    const mode = missile.explosionMode || 2; let fragments = Math.max(8, Math.floor((VisualState.controls.fragmentCount || 24) * missilePerfScale())); if (mode === 1) fragments = Math.max(8, Math.floor(fragments * 0.7)); if (mode === 3) fragments = Math.max(14, Math.floor(fragments * 1.35));
    const size = (VisualState.controls.explosionSize || 76) * (missile.small ? 0.8 : missile.mega ? 1.5 + (VisualState.controls.megaMissilePower || 70) / 170 : 1) * missile.explosionScale * (1 + audio.bass * 0.28);
    this.bursts.push({ x, y, age: 0, life: 0.62 + Math.random() * 0.36 + (missile.mega ? 0.22 : 0), size, ringAlpha: 0.24 + audio.bass * 0.16 + (missile.mega ? 0.08 : 0), crossAlpha: 0.14 + audio.mid * 0.2, sparkAlpha: 0.18 + audio.high * 0.28, fragments: Array.from({ length: fragments + (missile.mega ? 14 : 0) }, (_, i) => ({ angle: (i / Math.max(1, fragments)) * Math.PI * 2 + Math.random() * 0.18, speed: size * (0.18 + Math.random() * 0.82) * (missile.split ? 1.16 : 1), size: (missile.mega ? 1.4 : 0.8) + Math.random() * 2.4, drift: (Math.random() - 0.5) * 0.4, box: i % 5 === 0, color: i % 3 === 0 ? 'a' : i % 3 === 1 ? 'b' : 'c' })), split: missile.split, mode, timeSeed: time + missile.seed, mega: missile.mega, clusterChild: missile.clusterChild });
    if (mode === 1 || missile.mega) this.pushEmpPulse(x, y, size, missile.mega);
    this.pushDebris(x, y, size, audio, missile.mega ? 10 : missile.clusterChild ? -3 : 0);
  },
  drawTacticalGrid(ctx, width, height, time, audio, p) {
    const interference = (VisualState.controls.interferenceStrength || 48) / 100;
    let empMix = 0; this.empPulses.forEach((pulse) => { empMix = Math.max(empMix, (1 - pulse.age / pulse.life) * pulse.interference); });
    const totalMix = Math.min(1, interference * 0.45 + empMix);
    const cell = 48; for (let x = 0; x <= width; x += cell) { const offset = Math.sin(time * 1.8 + x * 0.03) * totalMix * 6; missileDrawLine(ctx, x + offset, 0, x + offset, height, p.b, 0.025 + totalMix * 0.08, 1); }
    for (let y = 0; y <= height; y += cell) { const offset = Math.cos(time * 1.6 + y * 0.04) * totalMix * 6; missileDrawLine(ctx, 0, y + offset, width, y + offset, p.a, 0.02 + totalMix * 0.06, 1); }
    if (totalMix > 0.04) {
      for (let i = 0; i < 8; i++) { const yy = height * (i + 1) / 9 + Math.sin(time * 5 + i) * totalMix * 8; missileDrawLine(ctx, 0, yy, width, yy, p.c, 0.02 + totalMix * 0.05, 1); }
    }
  },
  drawLaunchPads(ctx, width, height, time, audio, p) { const pads = 5, bassPulse = 1 + audio.bass * 0.55; for (let i = 0; i < pads; i++) { const x = width * (0.1 + i * 0.2), sway = Math.sin(time * 0.8 + i * 0.6) * 14 * audio.mid, baseY = height - 28; missileDrawBox(ctx, x - 28 + sway * 0.08, baseY - 24, 56, 20, p.a, 0.12 + audio.mid * 0.08, 1); missileDrawLine(ctx, x, baseY, x + sway, height * (0.82 - audio.mid * 0.03), p.b, 0.08 + audio.mid * 0.05, 1 + audio.mid * 0.8); missileDrawLine(ctx, x - 12, baseY + 1, x + 12, baseY + 1, p.c, 0.14 + audio.high * 0.1, 1); missileDrawGlowPoint(ctx, x, baseY - 8, 1.2 + audio.high * 1.8, i % 2 ? p.a : p.c, 0.3); const towerH = 18 + bassPulse * 12 + i % 2 * 5; missileDrawLine(ctx, x - 18, baseY - 2, x - 18, baseY - towerH, p.b, 0.08, 1); missileDrawLine(ctx, x + 18, baseY - 2, x + 18, baseY - towerH, p.b, 0.08, 1); } },
  drawReticle(ctx, x, y, time, audio, p, lockAmt = 0, warning = 0) { const baseStrength = (VisualState.controls.targetLockStrength || 60) / 100, warningStrength = (VisualState.controls.impactWarningPulse || 58) / 100, size = (VisualState.controls.missileReticleSize || 16) * (1 + audio.mid * 0.26 + lockAmt * 0.35), rot = time * (0.7 + baseStrength * 1.2) + lockAmt * 0.8, pulse = 1 + Math.sin(time * 5 + x * 0.01) * 0.05 + warning * (0.05 + warningStrength * 0.08) * Math.sin(time * (8 + warningStrength * 12)), r = size * pulse; ctx.save(); ctx.translate(x, y); ctx.rotate(rot * 0.35); missileDrawLine(ctx, -r, 0, -r * 0.35, 0, p.a, 0.14 + audio.mid * 0.1 + lockAmt * 0.12, 1 + audio.mid * 0.7); missileDrawLine(ctx, r * 0.35, 0, r, 0, p.a, 0.14 + audio.mid * 0.1 + lockAmt * 0.12, 1 + audio.mid * 0.7); missileDrawLine(ctx, 0, -r, 0, -r * 0.35, p.c, 0.12 + audio.high * 0.12 + warning * 0.12, 1); missileDrawLine(ctx, 0, r * 0.35, 0, r, p.c, 0.12 + audio.high * 0.12 + warning * 0.12, 1); missileDrawBox(ctx, -r * 0.42, -r * 0.42, r * 0.84, r * 0.84, p.b, 0.08 + audio.mid * 0.08 + lockAmt * 0.08, 1); if (warning > 0.02) { const rr = r * (1.08 + warning * 0.4); missileDrawBox(ctx, -rr * 0.5, -rr * 0.5, rr, rr, p.a, 0.08 + warning * 0.18, 1 + warning * 1.2); } ctx.restore(); },
  updateAndDrawShockwaves(ctx, audio, p) { this.shockwaves = this.shockwaves.filter((s) => s.age < s.life); this.shockwaves.forEach((s) => { s.age += 0.016 * (1 + audio.bass * 0.25); const t = s.age / s.life, eased = 1 - t, rr = s.r + t * s.power * (1 + audio.bass * 0.4); ctx.save(); ctx.strokeStyle = rgba(s.mega ? p.a : p.b, (0.16 + audio.bass * 0.14) * eased); ctx.lineWidth = 1 + audio.bass * 1.8 + (s.mega ? 0.8 : 0); ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.arc(s.x, s.y, rr, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); missileDrawLine(ctx, s.x - rr * 0.65, s.y, s.x + rr * 0.65, s.y, p.c, 0.08 * eased, 1); }); },
  updateAndDrawEmp(ctx, time, audio, p) {
    this.empPulses = this.empPulses.filter((pulse) => pulse.age < pulse.life);
    this.empPulses.forEach((pulse) => {
      pulse.age += 0.016 * (1 + audio.bass * 0.25);
      const t = pulse.age / pulse.life, eased = 1 - t;
      for (let i = 0; i < pulse.rings; i++) {
        const rr = pulse.size * (0.18 + t * (0.55 + i * 0.25));
        ctx.save();
        ctx.strokeStyle = rgba(i % 2 ? p.a : p.b, (0.12 + pulse.interference * 0.18) * eased);
        ctx.lineWidth = 1 + audio.bass * 1.8 + (pulse.mega ? 0.8 : 0) + i * 0.18;
        ctx.setLineDash(i % 2 ? [8, 8] : [2, 10]);
        ctx.beginPath(); ctx.arc(pulse.x, pulse.y, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      for (let i = 0; i < 10; i++) {
        const ang = i / 10 * Math.PI * 2 + time * 0.5;
        const rr = pulse.size * (0.22 + t * 0.68);
        missileDrawLine(ctx, pulse.x, pulse.y, pulse.x + Math.cos(ang) * rr, pulse.y + Math.sin(ang) * rr, p.c, (0.04 + pulse.interference * 0.09) * eased, 1);
      }
    });
  },
  updateAndDrawDebris(ctx, audio, p) {
    const gravity = 0.08 + (VisualState.controls.debrisGravity || 58) / 100 * 0.18;
    this.debris = this.debris.filter((d) => d.age < d.life);
    this.debris.forEach((d, i) => {
      d.age += 0.016 * (1 + audio.high * 0.1); d.vy += gravity * 0.06; d.x += d.vx; d.y += d.vy; const eased = 1 - d.age / d.life; const color = p[d.color];
      if (d.box) missileDrawBox(ctx, d.x - d.size, d.y - d.size, d.size * 2, d.size * 2, color, 0.18 * eased, 1);
      else missileDrawGlowPoint(ctx, d.x, d.y, d.size * (0.8 + audio.high * 0.5), color, 0.24 * eased);
      if (i % 3 === 0) missileDrawLine(ctx, d.x, d.y, d.x - d.vx * 2.5, d.y - d.vy * 2.5, color, 0.08 * eased, 1);
    });
  },
  updateAndDrawBursts(ctx, time, audio, p) { this.bursts = this.bursts.filter((b) => b.age < b.life); this.bursts.forEach((b) => { b.age += 0.016 * (1 + audio.high * 0.4 + audio.mid * 0.2); const t = b.age / b.life, eased = 1 - t, ringR = b.size * (0.16 + t * 0.95); if (b.mode === 1 || b.mode === 2 || b.mode === 4) { const ringLoops = b.mode === 1 ? 4 : b.mode === 4 ? 3 : 2; for (let r = 0; r < ringLoops + (b.mega ? 1 : 0); r++) { const rr = ringR * (0.5 + r * 0.34); ctx.save(); ctx.strokeStyle = rgba(r % 2 ? p.b : p.a, b.ringAlpha * eased * (0.95 - r * 0.14)); ctx.lineWidth = 1 + r * 0.25 + audio.bass * (b.mode === 1 ? 2 : 1.2) + (b.mega ? 0.6 : 0); ctx.setLineDash(r % 2 ? [5, 5] : [2, 7]); ctx.beginPath(); ctx.arc(b.x, b.y, rr, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); } } if (b.mode === 2 || b.mode === 3) { missileDrawLine(ctx, b.x - ringR, b.y, b.x + ringR, b.y, p.c, b.crossAlpha * eased * 0.65, 1 + audio.mid * 1.2); missileDrawLine(ctx, b.x, b.y - ringR, b.x, b.y + ringR, p.a, b.crossAlpha * eased * 0.65, 1 + audio.mid * 1.2); } b.fragments.forEach((frag, i) => { const rr = frag.speed * t, ang = frag.angle + frag.drift * t + time * 0.4 * audio.high, x = b.x + Math.cos(ang) * rr, y = b.y + Math.sin(ang) * rr, color = p[frag.color]; if (b.mode === 3) { missileDrawLine(ctx, x, y, x + Math.cos(ang) * 7, y + Math.sin(ang) * 7, color, (b.sparkAlpha + 0.06) * eased, 1 + audio.high * 0.8); if (i % 3 === 0) missileDrawBox(ctx, x - 1.5, y - 1.5, 3, 3, color, 0.12 * eased, 1); } else { if (frag.box) { const size = frag.size * (1.2 + audio.high * 0.8) * eased; missileDrawBox(ctx, x - size, y - size, size * 2, size * 2, color, b.sparkAlpha * eased, 1); } else missileDrawGlowPoint(ctx, x, y, frag.size * (0.7 + audio.high * 1.1) * eased, color, b.sparkAlpha * eased); if (i % 4 === 0 && b.mode !== 4) missileDrawLine(ctx, b.x, b.y, x, y, p.c, 0.07 * eased + audio.mid * 0.05 * eased, 0.8 + audio.mid * 0.8); } }); if (b.split) for (let i = 0; i < 6 + (b.mega ? 2 : 0); i++) { const ang = b.timeSeed * 2.6 + i * (Math.PI * 2 / (6 + (b.mega ? 2 : 0))), rr = ringR * (1.05 + audio.high * 0.18); missileDrawLine(ctx, b.x, b.y, b.x + Math.cos(ang) * rr, b.y + Math.sin(ang) * rr, p.a, 0.11 * eased, 1.1); } }); },
  draw(ctx, width, height, time, audio) {
    const p = missileScenePalette(), rate = (VisualState.controls.missileRate || 48) / 100, max = VisualState.controls.missileCount || 22, guidance = (VisualState.controls.missileGuidance || 54) / 100, engineFlicker = (VisualState.controls.missileEngineFlicker || 62) / 100, bassBoost = 1 + audio.bass * 0.95;
    this.drawTacticalGrid(ctx, width, height, time, audio, p);
    this.drawLaunchPads(ctx, width, height, time, audio, p);
    const spawnChance = 0.018 + rate * 0.075 + audio.bass * 0.05 + audio.mid * 0.03;
    if (this.missiles.length < max && Math.random() < spawnChance) this.spawnMissile(width, height, audio, time);
    if (this.pendingManualMissiles > 0 && this.missiles.length < max + 4) { this.spawnMissile(width, height, audio, time); this.pendingManualMissiles -= 1; }
    if (this.pendingMegaMissiles > 0 && this.missiles.length < max + 2) { this.spawnMissile(width, height, audio, time, { mega: true, explosionMode: 1 + Math.floor(Math.random() * 4), typeMode: Math.random() < 0.5 ? 3 : 5 }); this.pendingMegaMissiles -= 1; }
    this.updateAndDrawShockwaves(ctx, audio, p); this.updateAndDrawEmp(ctx, time, audio, p);
    this.missiles = this.missiles.filter((m) => m.t < 1.14);
    this.missiles.forEach((m) => {
      m.t += m.speed * (1 + audio.bass * 1.15 + audio.mid * 0.22);
      const guidanceScale = guidance * (m.guidanceBoost || 1), guideWave = Math.sin((m.t * 7 + time * 2.2) + m.seed) * (12 + guidanceScale * 32) * audio.mid, guideWave2 = Math.cos((m.t * 11 + time * 3.1) + m.seed) * (6 + guidanceScale * 18) * audio.high;
      const x = lerp(m.x0, m.tx, m.t) + guideWave * (1 - m.t) + guideWave2 * (1 - m.t * 0.8), y = lerp(m.y0, m.ty, m.t) - Math.sin(m.t * Math.PI) * m.arc * bassBoost;
      m.trail.push({ x, y }); if (m.trail.length > m.trailLimit) m.trail.shift();
      const lockAmt = Math.max(0, (m.t - 0.3) / 0.7), warning = Math.max(0, (m.t - 0.72) / 0.24);
      this.drawReticle(ctx, m.tx, m.ty, time + m.lockPulseOffset, audio, p, lockAmt, warning);
      if (audio.mid > 0.08) { missileDrawLine(ctx, x, y, m.tx, m.ty, p.b, 0.03 + audio.mid * 0.08 + lockAmt * 0.05, 0.8 + audio.mid); missileDrawBox(ctx, m.tx - 8 - audio.mid * 12, m.ty - 8 - audio.mid * 12, 16 + audio.mid * 24, 16 + audio.mid * 24, p.a, 0.06 + audio.mid * 0.1 + warning * 0.08, 1); }
      if (m.cluster && !m.clusterFired && m.t > 0.62) { m.clusterFired = true; this.spawnClusterChildren(m, x, y, width, height, audio, time); }
      for (let i = 1; i < m.trail.length; i++) { const a = m.trail[i - 1], b = m.trail[i], prog = i / m.trail.length; missileDrawLine(ctx, a.x, a.y, b.x, b.y, i % 2 ? p.a : p.c, prog * (0.12 + audio.mid * 0.16), m.width * (0.75 + audio.bass * 0.65 + (m.mega ? 0.5 : 0))); if (i % 3 === 0) { const boxSize = (VisualState.controls.pixelSize || 3) * 0.8 * prog * (1 + audio.high * 0.8); missileDrawBox(ctx, b.x - boxSize, b.y - boxSize, boxSize * 2, boxSize * 2, p.b, 0.05 + audio.high * 0.08, 1); } }
      const pxSize = VisualState.controls.pixelSize || 3, pw = (m.small ? 4 : m.mega ? 8 : m.heavy ? 7 : 6) * pxSize / 3, ph = (m.small ? 10 : m.mega ? 18 : m.heavy ? 16 : 14) * pxSize / 3;
      ctx.fillStyle = rgba(m.small ? p.a : m.mega ? p.b : m.cluster ? p.a : p.c, 0.92); ctx.fillRect(x - pw / 2, y - ph / 2, pw, ph); missileDrawLine(ctx, x, y + ph * 0.35, x, y + ph * 1.25, p.b, 0.22 + audio.bass * 0.2, 1 + audio.high * 1.3);
      const flick = 1 + Math.sin(time * (10 + engineFlicker * 12) + m.seed) * (0.2 + engineFlicker * 0.35); missileDrawGlowPoint(ctx, x, y + ph * 0.85, ((m.small ? 1.6 : m.mega ? 4.2 : m.heavy ? 3.2 : 2.4) + audio.high * 3.2) * flick, p.b, 0.5 + audio.high * 0.25);
      if (m.cluster) missileDrawBox(ctx, x - pw, y - ph * 0.7, pw * 2, ph * 1.4, p.a, 0.12, 1);
      if (warning > 0.01) missileDrawGlowPoint(ctx, m.tx, m.ty, 2 + warning * 4, p.a, 0.08 + warning * 0.18);
      if (m.t > 0.94 && !m.exploded) {
        /* V112 — hold at the target and detonate ON the beat (mega waits for the downbeat). */
        m.holdFrames = (m.holdFrames || 0) + 1;
        const bus = typeof BeatBus !== 'undefined' ? BeatBus : null;
        const fire = m.mega
          ? ((bus && bus.active && bus.downbeat) || m.holdFrames > 90)
          : ((bus && bus.active) || m.holdFrames > 45);
        if (fire) { m.exploded = true; this.spawnBurst(x, y, m, audio, time); }
        else if (m.t > 0.985) m.t = 0.985;
      }
    });
    this.updateAndDrawBursts(ctx, time, audio, p);
    this.updateAndDrawDebris(ctx, audio, p);
  }
};
