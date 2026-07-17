
function avScenePalette() { return VisualState.palette(); }
function avPerfScale() { return VisualState.perfMode().densityScale; }
function avClamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function avNorm(value, fallback = 0) { return avClamp((value ?? fallback) / 100, 0, 1); }
function avRand(min, max) { return min + Math.random() * (max - min); }
function avPick(list) { return list[Math.floor(Math.random() * list.length)] || list[0]; }
function avDistance(a, b) { const dx = a.x - b.x; const dy = a.y - b.y; return Math.hypot(dx, dy); }
function avHybridFactor() { return VisualState.scene === 'hybrid' ? 0.72 : 1; }
function avSpreadPos(width, height, spread = 0.42) {
  let x = width * avRand(0.12, 0.88);
  let y = height * avRand(0.14, 0.86);
  const cx = width * 0.5; const cy = height * 0.5;
  const dx = x - cx; const dy = y - cy;
  const dist = Math.hypot(dx, dy) || 1;
  const minR = Math.min(width, height) * (0.08 + spread * 0.18);
  if (dist < minR) {
    const push = minR - dist;
    x += dx / dist * push;
    y += dy / dist * push;
  }
  return { x: avClamp(x, 40, width - 40), y: avClamp(y, 40, height - 40) };
}
function avWrap(obj, width, height, margin = 120) {
  if (obj.x < -margin) obj.x = width + margin;
  if (obj.x > width + margin) obj.x = -margin;
  if (obj.y < -margin) obj.y = height + margin;
  if (obj.y > height + margin) obj.y = -margin;
}
function avGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 8) { ctx.shadowBlur = Math.min(26, glow * 0.26); ctx.shadowColor = color; }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.2, radius), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function avLine(ctx, x1, y1, x2, y2, color, alpha = 0.24, width = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
function avBox(ctx, x, y, w, h, color, alpha = 0.18, lw = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
function avArc(ctx, x, y, r, start, end, color, alpha = 0.22, lw = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(x, y, r, start, end);
  ctx.stroke();
  ctx.restore();
}
function avPolygon(ctx, x, y, r, sides, rot, color, alpha = 0.22, lw = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + i * Math.PI * 2 / sides;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
function avSymbol(ctx, x, y, size, symbol, color, alpha = 0.6, lw = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  if (symbol === '*') {
    avLine(ctx, x - size, y, x + size, y, color, alpha, lw);
    avLine(ctx, x, y - size, x, y + size, color, alpha, lw);
    avLine(ctx, x - size * 0.72, y - size * 0.72, x + size * 0.72, y + size * 0.72, color, alpha, lw);
    avLine(ctx, x + size * 0.72, y - size * 0.72, x - size * 0.72, y + size * 0.72, color, alpha, lw);
  } else if (symbol === '+') {
    avLine(ctx, x - size, y, x + size, y, color, alpha, lw);
    avLine(ctx, x, y - size, x, y + size, color, alpha, lw);
  } else {
    ctx.fillStyle = rgba(color, alpha);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.8, size * 0.34), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const AtomicViralScene = {
  atoms: [],
  viruses: [],
  particles: [],
  events: [],
  lastBeatAt: -99,
  lastSizeKey: '',
  targetParticleCount: 120,
  lastWidth: 1920,
  lastHeight: 1080,
  reset() {
    this.atoms = [];
    this.viruses = [];
    this.particles = [];
    this.events = [];
    this.lastBeatAt = -99;
    this.lastSizeKey = '';
    this.targetParticleCount = 120;
    this.lastWidth = 1920;
    this.lastHeight = 1080;
  },
  trimForHybrid() {
    if (this.atoms.length > 16) this.atoms.splice(0, this.atoms.length - 16);
    if (this.viruses.length > 12) this.viruses.splice(0, this.viruses.length - 12);
    if (this.particles.length > 140) this.particles.splice(0, this.particles.length - 140);
    if (this.events.length > 10) this.events.splice(0, this.events.length - 10);
  },
  createAtom(width, height, hero = false) {
    const atomTypes = ['classic', 'dense', 'split', 'multi', 'ion'];
    const spread = avNorm(VisualState.controls.spreadAmount, 42);
    const layer = Math.random();
    const scaleMul = hero ? avRand(1.18, 1.72) : (layer < 0.2 ? avRand(1.0, 1.35) : avRand(0.72, 1.08));
    const orbiters = Math.max(1, Math.round((VisualState.controls.orbitCount || 3) + (Math.random() < 0.4 ? 1 : 0)));
    const pos = avSpreadPos(width, height, spread);
    return {
      type: avPick(atomTypes),
      x: pos.x,
      y: pos.y,
      vx: avRand(-0.18, 0.18),
      vy: avRand(-0.18, 0.18),
      r: avRand(16, 42) * scaleMul,
      layer,
      phase: avRand(0, Math.PI * 2),
      orbiters,
      drift: avRand(0.2, 1.25),
      spin: avRand(-1, 1),
      wobble: avRand(0.3, 1.3),
      orbitTilt: avRand(0.35, 0.9),
      charge: Math.random() < 0.5 ? 1 : -1,
      opacity: avRand(0.45, 0.95)
    };
  },
  createVirus(width, height, hero = false) {
    const virusTypes = ['spike', 'capsule', 'geometric', 'orbital', 'cluster'];
    const spread = avNorm(VisualState.controls.spreadAmount, 42);
    const layer = Math.random();
    const scaleMul = hero ? avRand(1.18, 1.75) : (layer < 0.18 ? avRand(1.0, 1.4) : avRand(0.72, 1.08));
    const pos = avSpreadPos(width, height, spread);
    return {
      type: avPick(virusTypes),
      x: pos.x,
      y: pos.y,
      vx: avRand(-0.14, 0.14),
      vy: avRand(-0.14, 0.14),
      r: avRand(14, 30) * scaleMul,
      layer,
      phase: avRand(0, Math.PI * 2),
      spin: avRand(-1, 1),
      wobble: avRand(0.25, 1.1),
      spikes: 10 + Math.floor(Math.random() * 10),
      opacity: avRand(0.45, 0.92)
    };
  },
  createParticle(width, height) {
    const symbols = ['.', '*', '+'];
    const spread = avNorm(VisualState.controls.spreadAmount, 42);
    const dotScale = 0.45 + (VisualState.controls.dotSize || 7) / 7;
    const pos = avSpreadPos(width, height, spread * 0.85);
    return {
      x: pos.x, y: pos.y,
      vx: avRand(-0.5, 0.5), vy: avRand(-0.5, 0.5),
      size: avRand(1, 5) * dotScale, layer: Math.random(),
      phase: avRand(0, Math.PI * 2), symbol: avPick(symbols),
      alpha: avRand(0.2, 0.75), life: avRand(8, 16)
    };
  },
  ensure(width, height) {
    this.lastWidth = width;
    this.lastHeight = height;
    const hybridFactor = avHybridFactor();
    const atomCount = Math.max(3, Math.floor((VisualState.controls.atomCount || 18) * avPerfScale() * hybridFactor));
    const virusCount = Math.max(2, Math.floor((VisualState.controls.virusCount || 10) * avPerfScale() * hybridFactor));
    const particleCount = Math.max(10, Math.floor((VisualState.controls.microParticleAmount || 120) * avPerfScale() * hybridFactor));
    const largeChance = avNorm(VisualState.controls.largeObjectChance, 34);
    this.targetParticleCount = particleCount;
    const sizeKey = [width, height, atomCount, virusCount, particleCount, largeChance.toFixed(2)].join('|');
    if (this.lastSizeKey !== sizeKey) {
      this.lastSizeKey = sizeKey;
      this.atoms = Array.from({ length: atomCount }, () => this.createAtom(width, height, Math.random() < largeChance));
      this.viruses = Array.from({ length: virusCount }, () => this.createVirus(width, height, Math.random() < largeChance));
      this.particles = Array.from({ length: particleCount }, () => this.createParticle(width, height));
      if (this.events.length > 20) this.events = this.events.slice(-20);
    }
    const particleCap = Math.max(20, Math.floor(this.targetParticleCount * 1.4));
    if (this.particles.length > particleCap) this.particles = this.particles.slice(this.particles.length - particleCap);
  },
  queueEvent(type, x, y, power = 1) {
    this.events.push({ type, x, y, power, age: 0, radius: 0, seed: Math.random() * 99 });
    if (this.events.length > (VisualState.scene === 'hybrid' ? 14 : 24)) this.events.shift();
  },
  queueManualEvent(type = null) {
    const width = this.lastWidth || window.innerWidth || 1920;
    const height = this.lastHeight || window.innerHeight || 1080;
    const events = ['mutation', 'ignition', 'swarm', 'fusion'];
    const chosen = type || avPick(events);
    const pos = avSpreadPos(width, height, avNorm(VisualState.controls.spreadAmount, 42));
    this.queueEvent(chosen, pos.x, pos.y, 0.8 + Math.random() * 0.8);
    return chosen;
  },
  maybeBeatEvent(width, height, time, audio) {
    const beatBurst = avNorm(VisualState.controls.beatBurstStrength, 70);
    const threshold = 0.72 - beatBurst * 0.18;
    if (audio.beat < threshold || time - this.lastBeatAt < 0.34) return;
    this.lastBeatAt = time;
    const spawnHeroVirus = Math.random() < avNorm(VisualState.controls.swarmChance, 38) * 0.28;
    const x = width * avRand(0.14, 0.86);
    const y = height * avRand(0.16, 0.84);
    const events = ['mutation', 'ignition', 'swarm', 'fusion'];
    const type = avPick(events);
    this.queueEvent(type, x, y, 0.75 + beatBurst * 0.75 + audio.bass * 0.35);
    if (spawnHeroVirus && this.viruses.length < Math.max(6, (VisualState.controls.virusCount || 10) * 1.8)) {
      const newbie = this.createVirus(width, height, true);
      newbie.x = x; newbie.y = y; newbie.r *= 0.75;
      this.viruses.push(newbie);
    }
    if (type === 'swarm') {
      const extras = 3 + Math.floor(avNorm(VisualState.controls.swarmChance, 38) * 5);
      for (let i = 0; i < extras; i++) {
        const p = this.createParticle(width, height);
        p.x = x + avRand(-20, 20); p.y = y + avRand(-20, 20);
        p.vx = avRand(-1.5, 1.5); p.vy = avRand(-1.5, 1.5);
        p.size *= 1.2;
        this.particles.push(p);
      }
    }
  },
  nearestVirus(atom) {
    let best = null, bestD = Infinity;
    for (let i = 0; i < this.viruses.length; i++) {
      const virus = this.viruses[i];
      const d = avDistance(atom, virus);
      if (d < bestD) { bestD = d; best = virus; }
    }
    return { virus: best, distance: bestD };
  },
  updateParticles(ctx, width, height, time, audio, p, opacity) {
    const linkAmt = avNorm(VisualState.controls.linkLineAmount, 56);
    const driftSpeed = avNorm(VisualState.controls.driftSpeed, 46);
    const highResp = avNorm(VisualState.controls.highSparkResponse, 72);
    const dotScale = (VisualState.controls.dotSize || 7) / 7;
    const spread = avNorm(VisualState.controls.spreadAmount, 42);
    for (let i = 0; i < this.particles.length; i++) {
      const m = this.particles[i];
      m.x += m.vx * (0.6 + driftSpeed * 1.1) + Math.cos(time * 0.5 + m.phase) * 0.08;
      m.y += m.vy * (0.6 + driftSpeed * 1.1) + Math.sin(time * 0.45 + m.phase) * 0.08;
      const cx = width * 0.5, cy = height * 0.5;
      const dx = m.x - cx, dy = m.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const minR = Math.min(width, height) * (0.04 + spread * 0.12);
      if (dist < minR) { const push = (minR - dist) * 0.02; m.x += dx / dist * push; m.y += dy / dist * push; }
      avWrap(m, width, height, 40);
      const pulse = (1 + audio.high * highResp * 0.8) * dotScale;
      const col = i % 3 === 0 ? p.a : (i % 3 === 1 ? p.b : p.c);
      avSymbol(ctx, m.x, m.y, m.size * pulse, m.symbol, col, m.alpha * opacity * (0.55 + audio.high * 0.45), 0.8 + audio.high * 0.7);
    }
    const maxLines = Math.floor(this.particles.length * linkAmt * 0.22 * avHybridFactor());
    let drawn = 0;
    for (let i = 0; i < this.particles.length && drawn < maxLines; i++) {
      const a = this.particles[i];
      for (let j = i + 1; j < this.particles.length && drawn < maxLines; j++) {
        const b = this.particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        const lim = 50 + linkAmt * 60 + audio.mid * 40;
        if (d < lim && Math.abs(a.layer - b.layer) < 0.24) {
          const alpha = (1 - d / lim) * 0.18 * opacity * (0.5 + audio.mid * 0.8);
          avLine(ctx, a.x, a.y, b.x, b.y, drawn % 2 ? p.a : p.b, alpha, 0.6 + audio.high * 0.5);
          drawn++;
        }
      }
    }
  },
  drawAtom(ctx, atom, width, height, time, audio, p, controls) {
    const bassResp = avNorm(controls.bassScaleResponse, 66);
    const midResp = avNorm(controls.midRotationResponse, 62);
    const highResp = avNorm(controls.highSparkResponse, 72);
    const pulseStrength = avNorm(controls.pulseStrength, 52);
    const wobbleAmount = avNorm(controls.wobbleAmount, 40);
    const driftSpeed = avNorm(controls.driftSpeed, 46);
    const rotSpeed = avNorm(controls.rotationSpeed, 54);
    const orbitSpeed = avNorm(controls.orbitSpeed, 58);
    const interactionStrength = avNorm(controls.interactionStrength, 60);
    const coreBase = controls.coreSize || 38;
    const opacity = avNorm(controls.sceneOpacity, 72);
    const lowPulse = 1 + audio.bass * (0.12 + bassResp * 0.28) + audio.beat * pulseStrength * 0.12;
    atom.phase += atom.spin * 0.008 * (0.4 + rotSpeed + audio.mid * midResp);
    atom.x += atom.vx * (0.35 + driftSpeed * 1.25) + Math.sin(time * (0.3 + atom.wobble * 0.06) + atom.phase) * wobbleAmount * 0.32;
    atom.y += atom.vy * (0.35 + driftSpeed * 1.25) + Math.cos(time * (0.28 + atom.wobble * 0.05) + atom.phase) * wobbleAmount * 0.32;
    avWrap(atom, width, height, atom.r * 2 + 120);
    const baseR = atom.r * lowPulse * (0.85 + coreBase / 100);
    const spread = avNorm(controls.spreadAmount, 42);
    const cx = width * 0.5, cy = height * 0.5;
    const cdx = atom.x - cx, cdy = atom.y - cy;
    const cdist = Math.hypot(cdx, cdy) || 1;
    const desiredDist = Math.min(width, height) * (0.08 + spread * 0.18);
    if (cdist < desiredDist) { const push = (desiredDist - cdist) * 0.04; atom.x += cdx / cdist * push; atom.y += cdy / cdist * push; }
    let localDistortion = 0;
    const near = this.nearestVirus(atom);
    if (near.virus && near.distance < baseR * 3.2) {
      const influence = (1 - near.distance / (baseR * 3.2)) * interactionStrength;
      localDistortion += influence;
      const ang = Math.atan2(near.virus.y - atom.y, near.virus.x - atom.x);
      atom.x += Math.cos(ang) * influence * 0.18;
      atom.y += Math.sin(ang) * influence * 0.18;
      if (Math.random() < 0.01 + influence * 0.02) this.queueEvent('fusion', (atom.x + near.virus.x) * 0.5, (atom.y + near.virus.y) * 0.5, 0.45 + influence * 0.8);
      if (controls.linkLineAmount > 0) avLine(ctx, atom.x, atom.y, near.virus.x, near.virus.y, p.c, 0.08 + influence * 0.18, 0.8 + influence * 0.8);
    }
    for (let i = 0; i < this.events.length; i++) {
      const evt = this.events[i];
      const d = Math.hypot(atom.x - evt.x, atom.y - evt.y);
      if (d < evt.radius + baseR * 1.4) localDistortion += 0.08 * evt.power;
    }
    const rings = Math.max(1, Math.round((controls.orbitCount || 3) + (atom.type === 'dense' ? 1 : 0) + (atom.type === 'multi' ? 1 : 0)));
    const coreR = Math.max(5, baseR * 0.22 * (atom.type === 'dense' ? 1.22 : 1));
    avGlowPoint(ctx, atom.x, atom.y, coreR * (1 + audio.beat * 0.35), atom.charge > 0 ? p.a : p.c, opacity * atom.opacity);
    if (atom.type === 'multi') {
      for (let c = -1; c <= 1; c += 2) {
        avGlowPoint(ctx, atom.x + c * coreR * 1.6, atom.y + Math.sin(time + atom.phase) * coreR * 0.4, coreR * 0.8, c > 0 ? p.b : p.c, opacity * 0.55);
        avLine(ctx, atom.x, atom.y, atom.x + c * coreR * 1.6, atom.y, p.b, 0.16 * opacity, 0.8);
      }
    }
    for (let ring = 0; ring < rings; ring++) {
      const rr = baseR * (0.55 + ring * 0.24 + localDistortion * 0.06);
      const rot = atom.phase * (1 + ring * 0.12) + time * 0.18 * (0.25 + rotSpeed + audio.mid * midResp);
      if (atom.type === 'split') {
        avArc(ctx, atom.x, atom.y, rr, rot, rot + Math.PI * 0.9, ring % 2 ? p.a : p.b, opacity * (0.11 + audio.mid * 0.18), 0.8 + ring * 0.08);
        avArc(ctx, atom.x, atom.y, rr, rot + Math.PI * 1.15, rot + Math.PI * 1.9, ring % 2 ? p.c : p.a, opacity * (0.08 + audio.high * 0.16), 0.7);
      } else {
        ctx.save();
        ctx.translate(atom.x, atom.y);
        ctx.rotate(rot);
        ctx.scale(1, atom.orbitTilt + Math.sin(time * 0.3 + atom.phase) * 0.08 + localDistortion * 0.03);
        avArc(ctx, 0, 0, rr, 0, Math.PI * 2, ring % 2 ? p.b : p.a, opacity * (0.08 + audio.mid * 0.16), 0.8 + ring * 0.08);
        ctx.restore();
      }
      const orbCount = Math.max(1, atom.orbiters + (ring === 0 && atom.type === 'ion' ? 2 : 0));
      for (let k = 0; k < orbCount; k++) {
        const ang = time * (0.45 + orbitSpeed * 1.2 + audio.mid * midResp * 1.1) + atom.phase + ring * 0.7 + k * Math.PI * 2 / orbCount;
        const ex = atom.x + Math.cos(ang) * rr;
        const ey = atom.y + Math.sin(ang * (atom.orbitTilt + 0.35)) * rr * 0.78;
        avGlowPoint(ctx, ex, ey, 1.8 + audio.high * (1.4 + highResp * 2.4), k % 2 ? p.b : p.c, opacity * (0.56 + audio.high * 0.28));
        if (atom.type === 'ion') {
          avLine(ctx, atom.x, atom.y, ex, ey, p.a, opacity * (0.04 + audio.high * 0.12), 0.7);
        }
      }
    }
    if (atom.type === 'dense' || atom.type === 'classic') {
      avBox(ctx, atom.x - baseR * 0.9, atom.y - baseR * 0.58, baseR * 1.8, baseR * 1.16, p.b, opacity * 0.08, 0.8);
    }
    if (atom.type === 'ion' && highResp > 0.2) {
      const sparkCount = 2 + Math.floor(audio.high * 4);
      for (let i = 0; i < sparkCount; i++) {
        const ang = time * 2 + i * Math.PI * 2 / sparkCount + atom.phase;
        const sx = atom.x + Math.cos(ang) * baseR * 1.25;
        const sy = atom.y + Math.sin(ang) * baseR * 1.1;
        avSymbol(ctx, sx, sy, 1 + audio.high * 2, i % 2 ? '*' : '+', p.c, opacity * (0.25 + audio.high * 0.45), 0.8);
      }
    }
  },
  drawVirus(ctx, virus, width, height, time, audio, p, controls) {
    const bassResp = avNorm(controls.bassScaleResponse, 66);
    const midResp = avNorm(controls.midRotationResponse, 62);
    const highResp = avNorm(controls.highSparkResponse, 72);
    const driftSpeed = avNorm(controls.driftSpeed, 46);
    const rotSpeed = avNorm(controls.rotationSpeed, 54);
    const wobbleAmount = avNorm(controls.wobbleAmount, 40);
    const interactionStrength = avNorm(controls.interactionStrength, 60);
    const mutationChance = avNorm(controls.mutationChance, 40);
    const opacity = avNorm(controls.sceneOpacity, 72);
    const spikeLen = controls.spikeLength || 18;
    virus.phase += virus.spin * 0.012 * (0.4 + rotSpeed + audio.mid * midResp);
    virus.x += virus.vx * (0.35 + driftSpeed * 1.2) + Math.cos(time * (0.22 + virus.wobble * 0.06) + virus.phase) * wobbleAmount * 0.28;
    virus.y += virus.vy * (0.35 + driftSpeed * 1.2) + Math.sin(time * (0.19 + virus.wobble * 0.06) + virus.phase) * wobbleAmount * 0.28;
    avWrap(virus, width, height, virus.r * 2 + 120);
    let eventInfl = 0;
    for (let i = 0; i < this.events.length; i++) {
      const evt = this.events[i];
      const d = Math.hypot(virus.x - evt.x, virus.y - evt.y);
      if (d < evt.radius + virus.r * 1.6) eventInfl += 0.06 * evt.power;
    }
    const spread = avNorm(controls.spreadAmount, 42);
    const cx = width * 0.5, cy = height * 0.5;
    const cdx = virus.x - cx, cdy = virus.y - cy;
    const cdist = Math.hypot(cdx, cdy) || 1;
    const desiredDist = Math.min(width, height) * (0.08 + spread * 0.18);
    if (cdist < desiredDist) { const push = (desiredDist - cdist) * 0.04; virus.x += cdx / cdist * push; virus.y += cdy / cdist * push; }
    const r = virus.r * (1 + audio.bass * (0.12 + bassResp * 0.22) + eventInfl);
    const pulseColor = virus.type === 'geometric' ? p.a : (virus.type === 'orbital' ? p.c : p.b);
    avGlowPoint(ctx, virus.x, virus.y, Math.max(4, r * 0.28), pulseColor, opacity * 0.32 * virus.opacity);
    if (virus.type === 'spike') {
      const spikes = virus.spikes + Math.floor(audio.high * 2);
      for (let s = 0; s < spikes; s++) {
        const ang = virus.phase + s * Math.PI * 2 / spikes;
        const innerR = r * 0.65;
        const outerR = r + spikeLen * (0.55 + audio.high * (0.35 + highResp * 0.4));
        const ix = virus.x + Math.cos(ang) * innerR;
        const iy = virus.y + Math.sin(ang) * innerR;
        const ox = virus.x + Math.cos(ang) * outerR;
        const oy = virus.y + Math.sin(ang) * outerR;
        avLine(ctx, ix, iy, ox, oy, s % 2 ? p.a : p.c, opacity * (0.1 + audio.high * 0.16), 0.9);
        avGlowPoint(ctx, ox, oy, 1.6 + audio.high * 2.2, s % 2 ? p.a : p.b, opacity * 0.72);
      }
      avArc(ctx, virus.x, virus.y, r * 0.72, 0, Math.PI * 2, p.b, opacity * 0.18, 1.2);
    } else if (virus.type === 'capsule') {
      ctx.save();
      ctx.translate(virus.x, virus.y);
      ctx.rotate(virus.phase * 0.9);
      ctx.strokeStyle = rgba(p.b, opacity * 0.28);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.42);
      ctx.lineTo(r * 0.6, -r * 0.42);
      ctx.arc(r * 0.6, 0, r * 0.42, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-r * 0.6, r * 0.42);
      ctx.arc(-r * 0.6, 0, r * 0.42, Math.PI / 2, -Math.PI / 2);
      ctx.closePath();
      ctx.stroke();
      for (let i = -1; i <= 1; i++) avLine(ctx, -r * 0.34, i * r * 0.2, r * 0.34, i * r * 0.2, p.a, opacity * 0.14, 0.8);
      ctx.restore();
    } else if (virus.type === 'geometric') {
      avPolygon(ctx, virus.x, virus.y, r * 0.86, 6 + Math.floor(audio.mid * 2), virus.phase, p.a, opacity * 0.24, 1.1);
      avPolygon(ctx, virus.x, virus.y, r * 0.48, 6, -virus.phase * 1.1, p.c, opacity * 0.18, 0.9);
      for (let i = 0; i < 6; i++) {
        const ang = virus.phase + i * Math.PI * 2 / 6;
        const nx = virus.x + Math.cos(ang) * r * 0.86;
        const ny = virus.y + Math.sin(ang) * r * 0.86;
        avGlowPoint(ctx, nx, ny, 1.3 + audio.high * 1.8, i % 2 ? p.b : p.c, opacity * 0.62);
      }
    } else if (virus.type === 'orbital') {
      avArc(ctx, virus.x, virus.y, r * 0.78, 0, Math.PI * 2, p.a, opacity * 0.2, 1.1);
      avArc(ctx, virus.x, virus.y, r * 0.52, virus.phase, virus.phase + Math.PI * 1.7, p.c, opacity * 0.16, 0.9);
      const orbitCount = 3 + Math.floor(audio.high * 2);
      for (let i = 0; i < orbitCount; i++) {
        const ang = time * (0.7 + audio.mid * 0.8) + virus.phase + i * Math.PI * 2 / orbitCount;
        const px = virus.x + Math.cos(ang) * r;
        const py = virus.y + Math.sin(ang * 1.1) * r * 0.68;
        avGlowPoint(ctx, px, py, 1.6 + audio.high * 2, i % 2 ? p.c : p.a, opacity * 0.72);
      }
    } else if (virus.type === 'cluster') {
      for (let i = 0; i < 5; i++) {
        const ang = virus.phase + i * Math.PI * 2 / 5;
        const cx = virus.x + Math.cos(ang) * r * 0.56;
        const cy = virus.y + Math.sin(ang) * r * 0.56;
        avGlowPoint(ctx, cx, cy, r * 0.16, i % 2 ? p.b : p.c, opacity * 0.48);
        avLine(ctx, virus.x, virus.y, cx, cy, p.a, opacity * 0.12, 0.8);
      }
      avArc(ctx, virus.x, virus.y, r * 0.24, 0, Math.PI * 2, p.a, opacity * 0.22, 1.1);
    }
    if (Math.random() < 0.001 + mutationChance * 0.004 + audio.beat * 0.008) {
      this.queueEvent('mutation', virus.x, virus.y, 0.5 + mutationChance * 0.8);
    }
    if (interactionStrength > 0.1 && this.atoms.length) {
      const nearestAtom = this.atoms[Math.floor(Math.random() * this.atoms.length)];
      const dx = nearestAtom.x - virus.x; const dy = nearestAtom.y - virus.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < r * 5.2 && Math.random() < 0.025) {
        avLine(ctx, virus.x, virus.y, nearestAtom.x, nearestAtom.y, p.b, opacity * 0.1, 0.8);
      }
    }
    avBox(ctx, virus.x - r * 1.2, virus.y - r * 1.2, r * 2.4, r * 2.4, p.a, opacity * 0.04, 0.7);
  },
  drawEvents(ctx, time, audio, p, controls) {
    const opacity = avNorm(controls.sceneOpacity, 72);
    const fusionChance = avNorm(controls.fusionChance, 26);
    for (let i = this.events.length - 1; i >= 0; i--) {
      const evt = this.events[i];
      evt.age += 0.016 * (1 + audio.mid * 0.6);
      evt.radius += evt.power * (1.5 + audio.bass * 4);
      const alpha = Math.max(0, 1 - evt.age / (1.4 + evt.power * 0.8));
      if (alpha <= 0) { this.events.splice(i, 1); continue; }
      const color = evt.type === 'mutation' ? p.c : (evt.type === 'ignition' ? p.a : p.b);
      avArc(ctx, evt.x, evt.y, evt.radius, 0, Math.PI * 2, color, alpha * opacity * 0.22, 1.2 + evt.power * 0.8);
      if (evt.type === 'mutation') {
        const petals = 6 + Math.floor(evt.power * 6);
        for (let s = 0; s < petals; s++) {
          const ang = evt.seed + time * 0.4 + s * Math.PI * 2 / petals;
          const px = evt.x + Math.cos(ang) * evt.radius;
          const py = evt.y + Math.sin(ang) * evt.radius;
          avSymbol(ctx, px, py, 1 + audio.high * 2, s % 2 ? '*' : '+', p.c, alpha * opacity * 0.6, 0.8);
        }
      } else if (evt.type === 'ignition') {
        avGlowPoint(ctx, evt.x, evt.y, 2 + evt.radius * 0.08, p.a, alpha * opacity * 0.34);
      } else if (evt.type === 'swarm') {
        const points = 5 + Math.floor(evt.power * 8);
        for (let k = 0; k < points; k++) {
          const ang = evt.seed + k * Math.PI * 2 / points;
          const sx = evt.x + Math.cos(ang) * evt.radius * 0.7;
          const sy = evt.y + Math.sin(ang) * evt.radius * 0.7;
          avGlowPoint(ctx, sx, sy, 1 + audio.high * 1.5, p.b, alpha * opacity * 0.35);
        }
      } else if (evt.type === 'fusion') {
        const lines = 3 + Math.floor(fusionChance * 6);
        for (let k = 0; k < lines; k++) {
          const ang = evt.seed + time * 0.2 + k * Math.PI * 2 / lines;
          avLine(ctx, evt.x, evt.y, evt.x + Math.cos(ang) * evt.radius, evt.y + Math.sin(ang) * evt.radius, p.a, alpha * opacity * 0.18, 0.9);
        }
      }
    }
  },
  draw(ctx, width, height, time, audio) {
    this.ensure(width, height);
    this.maybeBeatEvent(width, height, time, audio);
    const p = avScenePalette();
    const controls = VisualState.controls;
    const opacity = avNorm(controls.sceneOpacity, 72);

    ctx.save();
    // background microscopic field
    const hazeCount = Math.max(10, Math.floor(18 * avPerfScale()));
    for (let i = 0; i < hazeCount; i++) {
      const x = ((i * 83.17) % width);
      const y = ((i * 59.93 + time * 14) % height);
      avGlowPoint(ctx, x, y, 0.8 + (i % 4), i % 3 === 0 ? p.a : (i % 3 === 1 ? p.b : p.c), opacity * 0.04);
    }

    // layered micro particles
    this.updateParticles(ctx, width, height, time, audio, p, opacity);

    const all = [];
    this.atoms.forEach((a) => all.push({ kind: 'atom', layer: a.layer, obj: a }));
    this.viruses.forEach((v) => all.push({ kind: 'virus', layer: v.layer, obj: v }));
    all.sort((a, b) => a.layer - b.layer);
    for (let i = 0; i < all.length; i++) {
      const item = all[i];
      if (item.kind === 'atom') this.drawAtom(ctx, item.obj, width, height, time, audio, p, controls);
      else this.drawVirus(ctx, item.obj, width, height, time, audio, p, controls);
    }

    this.drawEvents(ctx, time, audio, p, controls);

    // heavy low-end field ripple
    const bassResp = avNorm(controls.bassScaleResponse, 66);
    if (audio.bass > 0.2) {
      const rippleR = Math.min(width, height) * (0.16 + audio.bass * 0.28 + bassResp * 0.08);
      avArc(ctx, width * 0.5, height * 0.5, rippleR, 0, Math.PI * 2, p.b, opacity * (0.02 + audio.bass * 0.08), 1.0 + audio.beat);
    }
    ctx.restore();
  }
};
