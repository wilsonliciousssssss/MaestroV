function mx_scenePalette() { return VisualState.palette(); }
function mx_perfScale() { return VisualState.perfMode().densityScale; }
function mx_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 12) { ctx.shadowBlur = Math.min(22, glow * 0.22); ctx.shadowColor = color; }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function mx_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function mx_drawBox(ctx, x, y, w, h, color, alpha = 0.2, lw = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); ctx.restore();
}
function mx_scenePulse(audio) { return 1 + audio.beat * 0.35 + audio.bass * 0.18; }

const MatrixCodingScene = {
  columns: [],
  ensure(width, height) {
    const count = Math.floor((VisualState.controls.matrixLines || 92) * mx_perfScale());
    if (Math.abs(this.columns.length - count) < 8) return;
    const chars = '01<>[]{}#$%ABCDEFGHIJKLMNOPQRSTUVWXYZ:/\|+-=_*';
    this.columns = Array.from({ length: count }, (_, i) => ({
      x: (i + Math.random()) * width / count,
      y: Math.random() * -height,
      speed: 0.35 + Math.random() * 2.2,
      length: 14 + Math.floor(Math.random() * 46),
      sizeSeed: Math.random(),
      band: i % 3,
      drift: (Math.random() - 0.5) * 0.8,
      phase: Math.random() * Math.PI * 2,
      chars
    }));
  },
  draw(ctx, width, height, time, audio) {
    this.ensure(width, height);
    const p = mx_scenePalette();
    ctx.save();
    // depth ghost columns
    for (let layer = 0; layer < 3; layer++) {
      const alphaLayer = 0.035 + layer * 0.018 + audio.high * 0.018;
      ctx.strokeStyle = rgba(layer === 0 ? p.a : layer === 1 ? p.b : p.c, alphaLayer);
      ctx.lineWidth = 1;
      const offset = (time * (10 + layer * 6)) % 80;
      for (let x = -80 + offset; x < width + 80; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - width * 0.12, height); ctx.stroke(); }
    }
    this.columns.forEach((col, index) => {
      const band = col.band === 0 ? audio.bass : col.band === 1 ? audio.mid : audio.high;
      const fall = (VisualState.controls.speed || 1) * (VisualState.controls.matrixFallSpeed || 1) * col.speed * (1 + band * 2.5);
      col.y += fall;
      col.x += col.drift * (0.2 + audio.mid * 0.8);
      const baseFontSize = VisualState.controls.matrixFontSize || 13;
      const randomAmount = (VisualState.controls.matrixRandomFontSize || 0) / 100;
      const columnScale = 1 + ((col.sizeSeed * 2 - 1) * randomAmount);
      const lineSpacing = clamp(VisualState.controls.matrixLineSpacing || 1.05, 0.8, 2.2);
      const fontSize = clamp(baseFontSize * columnScale * (1 + audio.beat * 0.08), 6, 72);
      if (col.y > height + col.length * fontSize * lineSpacing || col.x < -40 || col.x > width + 40) {
        col.y = -Math.random() * height * 0.8;
        col.x = Math.random() * width;
        col.sizeSeed = Math.random();
      }
      const color = col.band === 0 ? p.a : col.band === 1 ? p.b : p.c;
      const accent = col.band === 0 ? p.c : col.band === 1 ? p.a : p.b;
      const visible = Math.floor(col.length * (0.5 + band * 0.5));
      ctx.font = `${fontSize}px Courier New`;
      for (let j = 0; j < visible; j++) {
        const trail = 1 - j / (visible + 2);
        const alpha = (VisualState.controls.matrixOpacity || 72) / 100 * trail * (0.45 + band * 0.85);
        const x = col.x + Math.sin(time * 1.3 + j * 0.4 + col.phase) * (VisualState.controls.jitter || 18) * 0.04;
        const y = col.y - j * fontSize * lineSpacing;
        if (j === 0) ctx.fillStyle = 'rgba(255,255,255,0.92)';
        else if (j < 3) ctx.fillStyle = rgba(accent, Math.min(0.9, alpha + 0.15));
        else ctx.fillStyle = rgba(color, alpha);
        const chIndex = Math.floor(time * (VisualState.controls.matrixTypingSpeed || 1) * (8 + audio.high * 16) + j * (1 + col.band) + index) % col.chars.length;
        ctx.fillText(col.chars[chIndex], x, y);
        if (j === 0 && audio.beat > 0.25) {
          const px = VisualState.controls.pixelSize || 3;
          mx_drawGlowPoint(ctx, x + fontSize * 0.45, y - fontSize * 0.35, 2 + audio.beat * 3, accent, 0.45);
          ctx.fillStyle = rgba(accent, 0.42 + audio.high * 0.2);
          ctx.fillRect(x + fontSize * 0.7, y - fontSize * 0.58, px, px);
        }
      }
      if (index % 9 === 0) mx_drawLine(ctx, col.x - 8, col.y - visible * fontSize * lineSpacing, col.x + 8, col.y, accent, 0.06 + band * 0.1, 1);
    });
    ctx.restore();
  }
};
