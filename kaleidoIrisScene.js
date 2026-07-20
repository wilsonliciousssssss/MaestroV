
function irisLine(ctx, points, color, alpha, width, close = false, dash = null) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  if (close) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
function irisBox(ctx, x, y, w, h, color, alpha = 0.18, width = 1, fillAlpha = 0) {
  ctx.save();
  if (fillAlpha > 0) {
    ctx.fillStyle = rgba(color, fillAlpha);
    ctx.fillRect(x, y, w, h);
  }
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
function polarPoint(angle, radius) { return [Math.cos(angle) * radius, Math.sin(angle) * radius]; }
const KaleidoIrisScene = {
  sparks: [],
  ensure() {
    const target = Math.floor(((VisualState.controls.irisSparkCount || 120) * VisualState.perfMode().densityScale));
    if (Math.abs(this.sparks.length - target) > 8) {
      this.sparks = Array.from({ length: target }, (_, i) => ({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random(),
        phase: Math.random() * Math.PI * 2,
        size: 0.6 + Math.random() * 1.8,
        speed: 0.25 + Math.random() * 1.3,
        lane: i % 4
      }));
    }
  },
  drawShard(ctx, baseAng, spread, r1, r2, r3, color, alpha, width) {
    const p1 = polarPoint(baseAng - spread, r1);
    const p2 = polarPoint(baseAng - spread * 0.25, r2);
    const p3 = polarPoint(baseAng, r3);
    const p4 = polarPoint(baseAng + spread * 0.25, r2);
    const p5 = polarPoint(baseAng + spread, r1);
    irisLine(ctx, [p1, p2, p3, p4, p5], color, alpha, width, true);
  },
  draw(ctx, width, height, time, audio) {
    this.ensure();
    const p = VisualState.palette();
    const cx = width / 2;
    const cy = height / 2;
    const minDim = Math.min(width, height);
    const density = (VisualState.controls.density || 150) / 150;
    const speed = (VisualState.controls.speed || 1.2);
    const symmetry = Math.max(8, Math.round(VisualState.controls.irisSymmetry || 18));
    const petalLength = (VisualState.controls.irisPetalLength || 58) / 100;
    const aperture = (VisualState.controls.irisAperture || 24) / 100;
    const prism = (VisualState.controls.irisPrism || 72) / 100;
    const rotation = (VisualState.controls.irisRotation || 35) / 100;
    const breathing = (VisualState.controls.irisBreathing || 56) / 100;
    const fibreDensity = (VisualState.controls.irisFibreDensity || 64) / 100;
    const portalDepth = (VisualState.controls.irisPortalDepth || 62) / 100;
    const irisOpacity = Math.max(0, (VisualState.controls.irisOpacity || 42) / 100);
    const glow = Math.max(0, (VisualState.controls.irisGlow || 18) / 100);
    const petalMotion = Math.max(0, (VisualState.controls.irisPetalMotion || 54) / 100);
    const morphSpeed = Math.max(0.05, (VisualState.controls.irisMorphSpeed || 48) / 100);
    const innerRotation = Math.max(-1, Math.min(1, ((VisualState.controls.irisInnerRotation ?? 45) - 50) / 50));
    const outerRotation = Math.max(-1, Math.min(1, ((VisualState.controls.irisOuterRotation ?? 35) - 50) / 50));
    const pupilPulse = Math.max(0, (VisualState.controls.irisPupilPulse || 42) / 100);
    const fibreShimmer = Math.max(0, (VisualState.controls.irisFibreShimmer || 55) / 100);
    const symmetryWarp = Math.max(0, (VisualState.controls.irisSymmetryWarp || 36) / 100);

    const beatPulse = 1 + audio.beat * (0.08 + pupilPulse * 0.16) + audio.bass * (0.06 + pupilPulse * 0.14);
    const breathe = 1 + Math.sin(time * (0.75 + breathing * 1.6) * speed) * breathing * (0.03 + petalMotion * 0.03) + audio.beat * 0.025;
    const morphClock = time * speed * (0.45 + morphSpeed * 2.2);
    const morphWave = Math.sin(morphClock * 0.7) * petalMotion;
    const pupilRBase = minDim * (0.046 + aperture * 0.096) * (1 + Math.sin(morphClock * (0.6 + pupilPulse)) * pupilPulse * 0.065 + Math.sin(morphClock * 0.8) * petalMotion * 0.025) * beatPulse;
    /* V112 — beat-quantised aperture snaps + downbeat light burst */
    const bus = typeof BeatBus !== 'undefined' ? BeatBus : null;
    if (bus && bus.active) { this.apTarget = this.apTarget ? 0 : 1; if (bus.downbeat) this.burst = 1; }
    this.ap = (this.ap || 0) + ((this.apTarget || 0) - (this.ap || 0)) * 0.22;
    this.burst = (this.burst || 0) * 0.9;
    const pupilR = pupilRBase * (1 + this.ap * 0.42);
    const irisR = minDim * (0.24 + petalLength * 0.18) * breathe * (1 + morphWave * 0.03);
    const outerR = irisR * (1.15 + portalDepth * 0.23 + petalMotion * 0.04);
    const slice = Math.PI * 2 / symmetry;
    const layers = Math.max(6, Math.floor(8 + density * 4 + audio.mid * 3));
    const alphaBase = 0.55 + irisOpacity * 0.95; /* V112: lifted — was washed out at stage distance */
    const glowBase = 0.15 + glow * 0.85;

    ctx.save();
    ctx.translate(cx, cy);

    // subtle dark portal wash with reduced glow / opacity.
    const bg = ctx.createRadialGradient(0, 0, pupilR * 0.35, 0, 0, outerR * 1.65);
    bg.addColorStop(0, 'rgba(0,0,0,0.94)');
    bg.addColorStop(0.22, rgba(p.b, (0.03 + audio.bass * 0.04) * glowBase));
    bg.addColorStop(0.6, rgba(p.a, (0.015 + audio.mid * 0.02) * glowBase));
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, outerR * 1.7, 0, Math.PI * 2);
    ctx.fill();

    if ((this.burst || 0) > 0.05 && typeof additiveDraw === 'function') {
      additiveDraw(ctx, () => {
        const br = pupilR * (1.2 + (1 - this.burst) * 5.2);
        const flare = ctx.createRadialGradient(0, 0, 0, 0, 0, br);
        flare.addColorStop(0, rgba(p.a, 0.55 * this.burst));
        flare.addColorStop(0.5, rgba(p.b, 0.22 * this.burst));
        flare.addColorStop(1, rgba(p.b, 0));
        ctx.fillStyle = flare;
        ctx.beginPath(); ctx.arc(0, 0, br, 0, Math.PI * 2); ctx.fill();
      });
    }

    // layered iris structure with stronger shape motion and counter rotation.
    const layerRotA = time * rotation * (0.08 + innerRotation * 0.11) * speed;
    const layerRotB = time * rotation * (-0.05 + outerRotation * 0.1) * speed * (0.4 + petalMotion * 0.8);
    for (let layerGroup = 0; layerGroup < 2; layerGroup++) {
      ctx.save();
      ctx.rotate(layerGroup === 0 ? layerRotA : layerRotB);
      const groupAlpha = layerGroup === 0 ? 1 : 0.75;
      for (let i = 0; i < symmetry; i++) {
        const baseAng = i * slice;
        const sliceWarp = Math.sin(morphClock + i * 0.55) * slice * petalMotion * (0.06 + symmetryWarp * 0.22);
        for (let j = 0; j < layers; j++) {
          const t = j / Math.max(1, layers - 1);
          const localWave = Math.sin(morphClock * (0.85 + t * 0.55) + i * 0.42 + j * 0.31);
          const localWave2 = Math.cos(morphClock * (0.55 + t * 0.38) - i * 0.27 + j * 0.25);
          const spread = slice * (0.14 + prism * 0.18 + t * 0.04 + audio.high * 0.018) * (1 + localWave * petalMotion * 0.2);
          const inner = pupilR * (1.12 + t * 1.46) * (1 + localWave2 * petalMotion * 0.015);
          const mid = irisR * (0.34 + t * 0.42) + localWave * (2.4 + petalMotion * 6.2 + audio.mid * 2.4);
          const outer = irisR * (0.52 + t * 0.56) + localWave2 * (2.1 + petalMotion * 7.5 + audio.mid * 1.9);
          const angle = baseAng + sliceWarp * (0.45 + t * 0.75);
          const color = j % 3 === 0 ? p.a : j % 3 === 1 ? p.b : p.c;
          this.drawShard(
            ctx,
            angle,
            spread,
            inner,
            mid,
            outer,
            color,
            (0.06 + t * 0.11 + audio.mid * 0.04) * alphaBase * groupAlpha,
            0.55 + prism * 0.5 + petalMotion * 0.3
          );

          if (j % 2 === 0) {
            const rib1 = polarPoint(angle - spread * 0.35, inner);
            const rib2 = polarPoint(angle + Math.sin(morphClock + j) * petalMotion * 0.04, outer);
            const rib3 = polarPoint(angle + spread * 0.35, inner);
            irisLine(ctx, [rib1, rib2, rib3], color, (0.04 + audio.high * 0.05) * alphaBase * groupAlpha, 0.7 + petalMotion * 0.22);
          }
        }
      }
      ctx.restore();
    }

    // radial fibres shimmer and sway instead of glowing heavily.
    const fibres = Math.floor((90 + fibreDensity * 260) * VisualState.perfMode().densityScale);
    for (let i = 0; i < fibres; i++) {
      const sway = Math.sin(morphClock * (1.0 + fibreShimmer * 1.2) + i * 0.12) * (0.008 + petalMotion * 0.022 + fibreShimmer * 0.028);
      const a = (i / fibres) * Math.PI * 2 + sway;
      const jitter = Math.sin(i * 12.989 + morphClock * (1 + fibreShimmer)) * prism * (0.018 + fibreShimmer * 0.032);
      const inner = pupilR * (1.1 + (i % 6) * 0.032);
      const outer = irisR * (0.55 + (i % 13) / 20 + fibreDensity * 0.12 + Math.sin(morphClock + i * 0.08) * petalMotion * 0.025);
      irisLine(
        ctx,
        [polarPoint(a, inner), polarPoint(a + jitter, outer)],
        i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c,
        (0.035 + audio.high * (0.025 + fibreShimmer * 0.06) + audio.mid * 0.022) * alphaBase,
        0.38 + prism * 0.35
      );
    }

    // technical orbiting frame boxes with subtle motion.
    const frameCount = Math.max(8, Math.round(symmetry * 0.75));
    for (let i = 0; i < frameCount; i++) {
      const a = i * Math.PI * 2 / frameCount + time * rotation * (-0.04 + outerRotation * 0.12) + Math.sin(morphClock + i) * petalMotion * (0.035 + symmetryWarp * 0.08);
      const rr = outerR * (0.74 + Math.sin(time * 0.28 + i + morphClock * 0.2) * (0.02 + petalMotion * 0.03));
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      const size = minDim * (0.008 + prism * 0.012) * (1 + audio.high * 0.18);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + time * 0.18 + i * 0.1);
      irisBox(ctx, -size * 2.5, -size * 2.5, size * 5, size * 5, i % 2 ? p.b : p.c, (0.08 + audio.high * 0.08) * alphaBase, 1);
      if (i % 2 === 0) irisBox(ctx, -size, -size, size * 2, size * 2, p.a, (0.06 + audio.mid * 0.08) * alphaBase, 1);
      ctx.restore();
    }

    // segmented iris rings with lower opacity and motion.
    for (let r = 0; r < 8; r++) {
      const rr = pupilR * 1.52 + r * (outerR - pupilR * 1.52) / 7 + Math.sin(morphClock * (0.65 + innerRotation * 0.3) + r) * (1.1 + petalMotion * 2.1 + symmetryWarp * 2.4 + audio.mid * 1.1);
      ctx.save();
      ctx.strokeStyle = rgba(r % 2 ? p.c : p.a, (0.07 + audio.mid * 0.04 + audio.high * 0.025) * alphaBase);
      ctx.lineWidth = r === 7 ? 1.7 : 0.65 + r * 0.07;
      ctx.setLineDash(r % 2 ? [3, 6] : [8, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // orbiting markers stay crisp and less glowy.
    this.sparks.forEach((spark, i) => {
      const a = spark.angle + time * spark.speed * 0.16 * speed * (spark.lane % 2 ? -1 : 1);
      const rr = pupilR + spark.radius * outerR * (1.35 + portalDepth * 0.42);
      const wobble = Math.sin(time * spark.speed + spark.phase) * minDim * (0.006 + petalMotion * 0.005);
      const x = Math.cos(a) * rr + Math.cos(a * 3.1) * wobble;
      const y = Math.sin(a) * rr + Math.sin(a * 2.7) * wobble;
      const colour = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
      if (spark.lane % 2 === 0) {
        drawStar(ctx, x, y, spark.size * (0.6 + audio.high * 0.18), colour, (0.08 + audio.high * 0.12) * alphaBase, 0.85 + audio.high * 0.45, time * 0.4 + spark.phase);
      } else {
        irisBox(ctx, x - spark.size, y - spark.size, spark.size * 2, spark.size * 2, colour, (0.08 + audio.high * 0.12) * alphaBase, 0.9);
      }
    });

    // pupil core with reduced edge glow.
    const pupil = ctx.createRadialGradient(0, 0, 0, 0, 0, pupilR * (1.45 + portalDepth * 0.28));
    pupil.addColorStop(0, 'rgba(0,0,0,1)');
    pupil.addColorStop(0.65, 'rgba(0,0,0,0.985)');
    pupil.addColorStop(0.82, rgba(p.c, (0.04 + audio.bass * 0.06) * glowBase));
    pupil.addColorStop(1, rgba(p.a, (0.06 + audio.high * 0.05) * glowBase));
    ctx.fillStyle = pupil;
    ctx.beginPath();
    ctx.arc(0, 0, pupilR * (1 + audio.bass * 0.045), 0, Math.PI * 2);
    ctx.fill();

    drawPlus(ctx, 0, 0, pupilR * (0.26 + audio.high * 0.04), p.a, (0.06 + audio.high * 0.1) * alphaBase, 1 + audio.high * 0.35);
    irisBox(ctx, -pupilR * 0.72, -pupilR * 0.72, pupilR * 1.44, pupilR * 1.44, p.c, (0.07 + audio.mid * 0.07) * alphaBase, 1);

    // inward vortex lines animate the iris structure without relying on glow.
    for (let i = 0; i < 24; i++) {
      const start = i * Math.PI * 2 / 24 + time * 0.1 * speed + Math.sin(morphClock + i) * petalMotion * 0.06;
      const color = i % 2 ? p.b : p.a;
      ctx.save();
      ctx.strokeStyle = rgba(color, (0.03 + portalDepth * 0.04 + audio.bass * 0.04 + audio.mid * 0.025) * alphaBase);
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      for (let k = 0; k < 34; k++) {
        const t = k / 33;
        const rr = outerR * (1 - t * 0.84);
        const a = start + t * (1.6 + portalDepth * 2.5 + audio.bass * 0.35 + petalMotion * 0.4);
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // subtle outer frames; reduced opacity to avoid over-brightness.
    const pulseFrame = 14 + audio.bass * 22;
    irisBox(ctx, -outerR - pulseFrame * 0.22, -outerR - pulseFrame * 0.22, (outerR + pulseFrame * 0.22) * 2, (outerR + pulseFrame * 0.22) * 2, p.a, (0.02 + audio.bass * 0.04) * alphaBase, 1);
    irisBox(ctx, -outerR * 0.72, -outerR * 0.72, outerR * 1.44, outerR * 1.44, p.b, (0.02 + audio.mid * 0.035) * alphaBase, 0.9);

    ctx.restore();
  }
};
