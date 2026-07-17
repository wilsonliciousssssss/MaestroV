function cg_scenePalette() { return VisualState.palette(); }
function cg_perfScale() { return VisualState.perfMode().densityScale; }
function cg_clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function cg_norm(value, fallback = 0) { return cg_clamp((value ?? fallback) / 100, 0, 1); }
function cg_hybridFactor() { return VisualState.scene === 'hybrid' ? 0.66 : 1; }
function cg_count(value, fallback, maxNormal, maxHybrid) {
  const cap = VisualState.scene === 'hybrid' ? maxHybrid : maxNormal;
  return Math.max(0, Math.min(cap, Math.floor((value || fallback) * cg_perfScale() * cg_hybridFactor())));
}
function cg_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.25, width = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
function cg_drawBox(ctx, x, y, w, h, color, alpha = 0.12, lineAlpha = 0.28, lineWidth = 1) {
  ctx.save();
  ctx.fillStyle = rgba(color, alpha);
  ctx.strokeStyle = rgba(color, lineAlpha);
  ctx.lineWidth = lineWidth;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
function cg_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.85) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 8) {
    ctx.shadowBlur = Math.min(22, glow * 0.22 + radius * 0.6);
    ctx.shadowColor = color;
  }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.2, radius), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function cg_rand(min, max) { return min + Math.random() * (max - min); }
function cg_pick(list) { return list[Math.floor(Math.random() * list.length)] || list[0]; }

const CodeGlitchScene = {
  panels: [],
  streams: [],
  nodes: [],
  events: [],
  glitchSeed: 0,
  lastKey: '',
  focusIndex: 0,
  labels: [
    'root@maestro', 'render.loop()', 'audio.fft', 'visual.state', 'hybrid.pipeline',
    'glitch.router', 'shader.link', 'sync.monitor', 'pixi.canvas', 'scene.controller',
    'kernel.sync', 'breach.trace', 'packet.router', 'shader.frag', 'node.network'
  ],
  snippets: [
    'const beat = audio.beat;', 'if (mid > 0.5) pulse++;', 'render(frame, palette);',
    'sceneActive("codeglitch")', 'syncStatus("LIVE")', 'node.link(target);',
    'rgbShift += high * 2.0;', 'bassPulse = clamp(bass);', 'cursor ^= 1;',
    'packet.send(glitch);', 'vector.push(symbol);', 'frame.delta *= speed;',
    'fft.low *= pulse;', 'mid.route(signal);', 'high.spark(frame);',
    'frag.rgb += split;', 'uv.x += glitch;', 'noise.seed(time);',
    'access.level = root;', 'firewall.drop(packet);', 'kernel.sync();',
    'scene.mix(hybrid);', 'canvas.trace(node);', 'palette.shift();',
    'memory.patch(core);', 'signal.map(stream);', 'entropy += random();',
    'terminal.flush();', 'if (breach) reroute();', 'scan.line += bass;'
  ],
  chars: '01<>[]{}()/\\|=+-_*#;:.,ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  reset() {
    this.panels = [];
    this.streams = [];
    this.nodes = [];
    this.events = [];
    this.lastKey = '';
    this.glitchSeed = Math.random() * 1000;
    this.focusIndex = 0;
  },
  trimForHybrid() {
    if (this.streams.length > 70) this.streams.splice(0, this.streams.length - 70);
    if (this.nodes.length > 28) this.nodes.splice(0, this.nodes.length - 28);
    if (this.events.length > 8) this.events.splice(0, this.events.length - 8);
  },
  applyPreset(name) {
    const presets = {
      clean: {
        codePanelCount: 4, codeStreamCount: 58, codeScrollSpeed: 1.0, codeSymbolSize: 13,
        codeGlitchAmount: 16, codeLinkDensity: 18, codeWindowJitter: 10, codeRgbSplit: 8,
        codeNoiseBlocks: 10, codeMainFocus: 54, codeCursorAmount: 30, codeScanlineStrength: 24,
        codeBreachPulse: 16, codeBinaryRain: 24, codeSnippetDensity: 74, codePanelOpacity: 72,
        codeGridStrength: 28, codeCorruptionSpread: 16, codeMode: 0
      },
      rain: {
        codePanelCount: 5, codeStreamCount: 170, codeScrollSpeed: 2.6, codeSymbolSize: 12,
        codeGlitchAmount: 32, codeLinkDensity: 24, codeWindowJitter: 24, codeRgbSplit: 18,
        codeNoiseBlocks: 28, codeMainFocus: 26, codeCursorAmount: 58, codeScanlineStrength: 42,
        codeBreachPulse: 34, codeBinaryRain: 86, codeSnippetDensity: 42, codePanelOpacity: 68,
        codeGridStrength: 40, codeCorruptionSpread: 32, codeMode: 1
      },
      breach: {
        codePanelCount: 6, codeStreamCount: 128, codeScrollSpeed: 2.1, codeSymbolSize: 13,
        codeGlitchAmount: 82, codeLinkDensity: 42, codeWindowJitter: 76, codeRgbSplit: 72,
        codeNoiseBlocks: 86, codeMainFocus: 48, codeCursorAmount: 66, codeScanlineStrength: 76,
        codeBreachPulse: 88, codeBinaryRain: 52, codeSnippetDensity: 54, codePanelOpacity: 82,
        codeGridStrength: 62, codeCorruptionSpread: 82, codeMode: 2
      },
      network: {
        codePanelCount: 5, codeStreamCount: 72, codeScrollSpeed: 1.4, codeSymbolSize: 12,
        codeGlitchAmount: 34, codeLinkDensity: 72, codeWindowJitter: 34, codeRgbSplit: 22,
        codeNoiseBlocks: 22, codeMainFocus: 34, codeCursorAmount: 38, codeScanlineStrength: 36,
        codeBreachPulse: 42, codeBinaryRain: 34, codeSnippetDensity: 38, codePanelOpacity: 70,
        codeGridStrength: 76, codeCorruptionSpread: 40, codeMode: 3
      },
      corrupt: {
        codePanelCount: 3, codeStreamCount: 112, codeScrollSpeed: 2.2, codeSymbolSize: 15,
        codeGlitchAmount: 94, codeLinkDensity: 52, codeWindowJitter: 88, codeRgbSplit: 88,
        codeNoiseBlocks: 110, codeMainFocus: 84, codeCursorAmount: 80, codeScanlineStrength: 90,
        codeBreachPulse: 94, codeBinaryRain: 70, codeSnippetDensity: 62, codePanelOpacity: 88,
        codeGridStrength: 72, codeCorruptionSpread: 92, codeMode: 4
      }
    };
    const selected = presets[name] || presets.breach;
    Object.entries(selected).forEach(([id, value]) => VisualState.setControl(id, value));
    this.reset();
  },
  queueEvent(type = 'glitch', power = 1) {
    this.events.push({
      type,
      power,
      age: 0,
      life: type === 'breach' ? 1.1 : type === 'core' ? 1.4 : 0.75,
      seed: Math.random() * 999,
      x: Math.random(),
      y: Math.random()
    });
    if (this.events.length > 12) this.events.shift();
    return type;
  },
  ensure(width, height) {
    const panelCount = Math.round(VisualState.controls.codePanelCount || 5);
    const streamCount = cg_count(VisualState.controls.codeStreamCount, 110, 190, 70);
    const nodeCount = cg_count(VisualState.controls.codeLinkDensity, 32, 64, 28);
    const mode = Math.round(VisualState.controls.codeMode || 1);
    const key = [width, height, panelCount, streamCount, nodeCount, mode].join(':');
    if (this.lastKey === key) return;
    this.lastKey = key;
    this.panels = [];
    this.streams = [];
    this.nodes = [];
    this.events = this.events.slice(-6);
    this.glitchSeed = Math.random() * 1000;
    this.focusIndex = Math.floor(Math.random() * Math.max(1, panelCount));

    const cols = panelCount <= 3 ? panelCount : Math.ceil(Math.sqrt(panelCount));
    const rows = Math.ceil(panelCount / cols);
    const marginX = width * 0.055;
    const marginY = height * 0.1;
    const gutterX = width * 0.018;
    const gutterY = height * 0.024;
    const panelW = Math.max(180, (width - marginX * 2 - gutterX * (cols - 1)) / cols);
    const panelH = Math.max(120, (height - marginY * 2 - gutterY * (rows - 1)) / rows);

    for (let i = 0; i < panelCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const focusBoost = i === this.focusIndex ? 1 + cg_norm(VisualState.controls.codeMainFocus, 38) * 0.18 : 1;
      this.panels.push({
        x: marginX + col * (panelW + gutterX),
        y: marginY + row * (panelH + gutterY),
        w: panelW * cg_rand(0.86, 1.02) * focusBoost,
        h: panelH * cg_rand(0.8, 1.0) * focusBoost,
        hueSlot: i % 3,
        title: this.labels[i % this.labels.length],
        jitterSeed: Math.random() * 10,
        scrollBias: cg_rand(0.8, 1.3),
        focus: i === this.focusIndex
      });
    }

    for (let i = 0; i < streamCount; i++) {
      const panelIndex = i % this.panels.length;
      const panel = this.panels[panelIndex];
      this.streams.push({
        panelIndex,
        lane: cg_rand(12, Math.max(18, panel.w - 22)),
        y: cg_rand(-panel.h, panel.h),
        speed: cg_rand(18, 88),
        len: Math.floor(cg_rand(5, 20)),
        phase: Math.random() * Math.PI * 2,
        glyphSeed: Math.random() * 1000,
        opacity: cg_rand(0.25, 0.85),
        rain: Math.random() < cg_norm(VisualState.controls.codeBinaryRain, 52)
      });
    }

    for (let i = 0; i < nodeCount; i++) {
      const panelIndex = i % this.panels.length;
      const panel = this.panels[panelIndex];
      this.nodes.push({
        panelIndex,
        x: panel.x + cg_rand(12, Math.max(16, panel.w - 12)),
        y: panel.y + cg_rand(22, Math.max(26, panel.h - 18)),
        drift: cg_rand(0.2, 1.4),
        linkTo: (i + 1 + Math.floor(cg_rand(0, Math.max(1, nodeCount - 1)))) % Math.max(1, nodeCount),
        size: cg_rand(1.2, 3.4)
      });
    }
  },
  randomChar(seed, binaryOnly = false) {
    if (binaryOnly) return Math.sin(seed) > 0 ? '1' : '0';
    const idx = Math.floor(Math.abs(Math.sin(seed)) * this.chars.length) % this.chars.length;
    return this.chars[idx];
  },
  activeEventPower(type = null) {
    return this.events.reduce((sum, evt) => {
      if (type && evt.type !== type) return sum;
      const t = Math.max(0, 1 - evt.age / evt.life);
      return sum + t * evt.power;
    }, 0);
  },
  drawScanlines(ctx, width, height, time, audio, p) {
    const strength = cg_norm(VisualState.controls.codeScanlineStrength, 46);
    const breach = this.activeEventPower();
    const gap = Math.max(3, 8 - strength * 4);
    for (let y = 0; y < height; y += gap) {
      const wobble = Math.sin(time * 3 + y * 0.04) * (audio.mid * 2 + breach * 3);
      cg_drawLine(ctx, 0, y + wobble, width, y, y % 2 ? p.a : p.b, 0.018 + strength * 0.035 + audio.high * 0.025, 0.55);
    }
  },
  drawCodeText(ctx, panelIndex, panel, time, audio, color) {
    const symbolSize = VisualState.controls.codeSymbolSize || 13;
    const scrollSpeed = (VisualState.controls.codeScrollSpeed || 1.6) * (0.65 + audio.mid * 0.9);
    const highFlicker = 0.12 + audio.high * 0.55 + this.activeEventPower('glitch') * 0.18;
    const snippetDensity = cg_norm(VisualState.controls.codeSnippetDensity, 54);
    const cursorAmount = cg_norm(VisualState.controls.codeCursorAmount, 44);
    const binaryRain = cg_norm(VisualState.controls.codeBinaryRain, 52);

    ctx.save();
    ctx.beginPath();
    ctx.rect(panel.x + 8, panel.y + 20, panel.w - 16, panel.h - 30);
    ctx.clip();
    ctx.font = `600 ${symbolSize}px Consolas, 'Courier New', monospace`;
    ctx.textBaseline = 'top';

    this.streams.forEach((stream, idx) => {
      if (stream.panelIndex !== panelIndex) return;
      const x = panel.x + stream.lane;
      const yBase = panel.y + 26 + ((stream.y + time * stream.speed * scrollSpeed * panel.scrollBias) % (panel.h + stream.len * symbolSize));
      const binaryOnly = stream.rain || Math.random() < binaryRain * 0.1;
      for (let j = 0; j < stream.len; j++) {
        const y = yBase - j * symbolSize * 0.92;
        const alpha = cg_clamp(stream.opacity - j * 0.048 + (j === 0 ? highFlicker : 0), 0.04, 0.95);
        ctx.fillStyle = rgba(color, alpha);
        const seed = stream.glyphSeed + idx * 12.31 + j * 1.77 + time * (1.5 + audio.high * 4.5 + this.activeEventPower() * 3);
        ctx.fillText(this.randomChar(seed, binaryOnly), x + Math.sin(seed) * audio.high * 2.2, y);
      }
    });

    const lineCount = Math.max(1, Math.floor(panel.h / (52 - snippetDensity * 24)));
    ctx.font = `500 ${Math.max(10, symbolSize - 1)}px Consolas, 'Courier New', monospace`;
    for (let i = 0; i < lineCount; i++) {
      const y = panel.y + 28 + i * 28 + Math.sin(time * 0.8 + i + panel.jitterSeed) * audio.mid * 4;
      const line = this.snippets[(i + Math.floor(time * 0.4) + panelIndex * 3) % this.snippets.length];
      ctx.fillStyle = rgba(color, 0.12 + snippetDensity * 0.16 + i * 0.01 + audio.mid * 0.08);
      ctx.fillText(line, panel.x + 12, y);
      if (cursorAmount > 0.1 && i % Math.max(1, Math.floor(4 - cursorAmount * 3)) === 0) {
        const cursorOn = Math.sin(time * (5 + cursorAmount * 10) + i + panelIndex) > -0.15;
        if (cursorOn) {
          const cx = panel.x + 12 + Math.min(panel.w - 36, line.length * symbolSize * 0.52);
          ctx.fillStyle = rgba(color, 0.2 + cursorAmount * 0.45 + audio.high * 0.2);
          ctx.fillRect(cx, y + 1, 7 + audio.high * 5, Math.max(8, symbolSize - 2));
        }
      }
    }
    ctx.restore();
  },
  drawLinks(ctx, time, audio, palette) {
    const linkDensity = Math.round(VisualState.controls.codeLinkDensity || 32);
    const maxCount = VisualState.scene === 'hybrid' ? Math.min(this.nodes.length, 28) : Math.min(this.nodes.length, linkDensity);
    for (let i = 0; i < maxCount; i++) {
      const node = this.nodes[i];
      const target = this.nodes[node.linkTo % this.nodes.length];
      if (!target) continue;
      const eventPower = this.activeEventPower('breach');
      const driftX = Math.sin(time * (0.4 + node.drift) + i) * (4 + audio.mid * 12 + eventPower * 10);
      const driftY = Math.cos(time * (0.35 + node.drift) + i * 0.6) * (3 + audio.bass * 10 + eventPower * 8);
      const x1 = node.x + driftX;
      const y1 = node.y + driftY;
      const x2 = target.x - driftX * 0.45;
      const y2 = target.y - driftY * 0.45;
      const color = i % 3 === 0 ? palette.a : i % 3 === 1 ? palette.b : palette.c;
      cg_drawLine(ctx, x1, y1, x2, y2, color, 0.05 + audio.mid * 0.2 + eventPower * 0.08, 0.7 + audio.mid * 1.6);
      const pulseT = (Math.sin(time * (4 + eventPower * 5) + i) * 0.5 + 0.5);
      const px = x1 + (x2 - x1) * pulseT;
      const py = y1 + (y2 - y1) * pulseT;
      cg_drawGlowPoint(ctx, px, py, node.size + audio.high * 2.2 + eventPower * 2, color, 0.24 + audio.high * 0.35 + eventPower * 0.18);
    }
  },
  drawCentralCore(ctx, width, height, time, audio, p) {
    const focus = cg_norm(VisualState.controls.codeMainFocus, 38);
    const corePower = this.activeEventPower('core') + this.activeEventPower('breach') * 0.5;
    if (focus < 0.18 && corePower < 0.05) return;
    const cx = width * 0.5;
    const cy = height * 0.5;
    const size = Math.min(width, height) * (0.08 + focus * 0.12 + audio.bass * 0.04 + corePower * 0.06);
    cg_drawBox(ctx, cx - size, cy - size * 0.38, size * 2, size * 0.76, p.c, 0.015 + focus * 0.05 + corePower * 0.04, 0.08 + focus * 0.18 + corePower * 0.2, 1.1 + audio.bass * 1.5);
    cg_drawLine(ctx, cx - size * 1.15, cy, cx + size * 1.15, cy, p.a, 0.08 + audio.bass * 0.12 + corePower * 0.12, 1 + audio.bass * 2);
    cg_drawLine(ctx, cx, cy - size * 0.6, cx, cy + size * 0.6, p.b, 0.06 + audio.mid * 0.1 + corePower * 0.1, 1);
  },
  drawGlitch(ctx, width, height, time, audio, palette) {
    const glitch = cg_norm(VisualState.controls.codeGlitchAmount, 52);
    const rgbSplit = cg_norm(VisualState.controls.codeRgbSplit, 28);
    const noiseBlocks = cg_count(VisualState.controls.codeNoiseBlocks, 34, 96, 34);
    const spread = cg_norm(VisualState.controls.codeCorruptionSpread, 48);
    const breachPulse = cg_norm(VisualState.controls.codeBreachPulse, 48);
    const eventPower = this.activeEventPower();
    const barCount = Math.floor(4 + glitch * 12 + audio.bass * 8 + audio.high * 10 + eventPower * 10);
    for (let i = 0; i < barCount; i++) {
      const barY = (Math.sin(time * (0.8 + i * 0.11) + this.glitchSeed + i) * 0.5 + 0.5) * height;
      const barH = 2 + ((i * 7) % 10) + audio.bass * 10 + eventPower * 6;
      const barW = width * (0.16 + ((i * 13) % 50) / 100 + glitch * 0.3 + spread * 0.16);
      const x = (Math.sin(time * 1.7 + i * 2.1) * 0.5 + 0.5) * (width - barW);
      const offset = (Math.sin(time * 16 + i) * 4 + audio.high * 12 + eventPower * 9) * rgbSplit;
      ctx.fillStyle = rgba(palette.a, 0.05 + audio.high * 0.12 + eventPower * 0.04);
      ctx.fillRect(x - offset, barY, barW, barH);
      ctx.fillStyle = rgba(palette.c, 0.04 + audio.high * 0.09 + eventPower * 0.03);
      ctx.fillRect(x + offset, barY + 1, barW, Math.max(1, barH - 1));
      ctx.fillStyle = rgba(palette.b, 0.03 + audio.bass * 0.08 + breachPulse * eventPower * 0.08);
      ctx.fillRect(x, barY - 1, barW, 1);
    }

    for (let i = 0; i < noiseBlocks + Math.floor(eventPower * 20); i++) {
      const w = cg_rand(4, 28 + glitch * 18 + spread * 18);
      const h = cg_rand(2, 10 + audio.high * 12 + eventPower * 9);
      const x = cg_rand(0, width - w);
      const y = cg_rand(0, height - h);
      const color = i % 3 === 0 ? palette.a : i % 3 === 1 ? palette.b : palette.c;
      ctx.fillStyle = rgba(color, 0.04 + Math.random() * 0.12 + eventPower * 0.08);
      ctx.fillRect(x, y, w, h);
      if (Math.random() < 0.18 + audio.high * 0.3 + eventPower * 0.25) {
        ctx.fillStyle = rgba(color, 0.16 + audio.high * 0.18 + eventPower * 0.1);
        ctx.fillRect(x + w + 2, y - 1, 2, h + 2);
      }
    }
  },
  updateEvents(audio) {
    this.events = this.events.filter((evt) => evt.age < evt.life);
    this.events.forEach((evt) => {
      evt.age += 0.016 * (1 + (audio.mid || 0) * 0.45);
    });
  },
  draw(ctx, width, height, time, audio) {
    this.ensure(width, height);
    this.updateEvents(audio);
    const palette = cg_scenePalette();
    const bass = audio.bass || 0;
    const mid = audio.mid || 0;
    const high = audio.high || 0;
    const jitter = cg_norm(VisualState.controls.codeWindowJitter, 38);
    const panelOpacity = cg_norm(VisualState.controls.codePanelOpacity, 72);
    const gridStrength = cg_norm(VisualState.controls.codeGridStrength, 44);
    const mode = Math.round(VisualState.controls.codeMode || 1);

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = rgba('#03060b', 0.075 + bass * 0.05);
    ctx.fillRect(0, 0, width, height);

    const step = mode === 3 ? 18 : 24;
    for (let x = 0; x < width; x += step) cg_drawLine(ctx, x, 0, x, height, palette.a, gridStrength * (0.025 + high * 0.018), 0.55);
    for (let y = 0; y < height; y += step) cg_drawLine(ctx, 0, y + Math.sin(time + y * 0.02) * bass * 2.5, width, y, palette.b, gridStrength * (0.018 + bass * 0.02), 0.55);

    this.drawLinks(ctx, time, audio, palette);
    this.drawCentralCore(ctx, width, height, time, audio, palette);

    this.panels.forEach((panel, idx) => {
      const col = panel.hueSlot === 0 ? palette.a : panel.hueSlot === 1 ? palette.b : palette.c;
      const eventPower = this.activeEventPower();
      const wobbleX = Math.sin(time * (0.9 + panel.jitterSeed) + idx) * jitter * 16 * mid + eventPower * Math.sin(time * 18 + idx) * 10;
      const wobbleY = Math.cos(time * (0.8 + panel.jitterSeed) + idx * 1.3) * jitter * 10 * bass + eventPower * Math.cos(time * 14 + idx) * 6;
      const x = panel.x + wobbleX;
      const y = panel.y + wobbleY;
      const focusBoost = panel.focus ? 1 + cg_norm(VisualState.controls.codeMainFocus, 38) * 0.1 : 1;
      const pulseW = panel.w * focusBoost * (1 + bass * 0.012 + eventPower * 0.014);
      const pulseH = panel.h * focusBoost * (1 + bass * 0.01 + eventPower * 0.012);
      cg_drawBox(ctx, x, y, pulseW, pulseH, col, panelOpacity * (0.025 + mid * 0.042 + (panel.focus ? 0.02 : 0)), 0.18 + high * 0.18 + eventPower * 0.15, 1);
      cg_drawBox(ctx, x + 4, y + 4, pulseW - 8, 18, col, panelOpacity * (0.055 + bass * 0.08), 0.0, 0);

      ctx.save();
      ctx.font = `700 ${Math.max(11, (VisualState.controls.codeSymbolSize || 13) - 1)}px Consolas, 'Courier New', monospace`;
      ctx.fillStyle = rgba(col, 0.64 + (panel.focus ? 0.18 : 0));
      ctx.fillText(panel.title, x + 10, y + 4);
      ctx.fillStyle = rgba(palette.c, 0.72 * ((Math.sin(time * 5 + idx) * 0.5 + 0.5) * 0.6 + 0.4 + high * 0.18 + eventPower * 0.18));
      ctx.fillRect(x + pulseW - 20, y + 6, 8 + high * 5 + eventPower * 4, 8);
      ctx.restore();

      this.drawCodeText(ctx, idx, { ...panel, x, y, w: pulseW, h: pulseH }, time, audio, col);

      for (let b = 0; b < 8; b++) {
        const meterH = (Math.sin(time * 4 + b + idx) * 0.5 + 0.5) * (pulseH - 42) * (0.25 + mid * 0.75 + eventPower * 0.22);
        ctx.fillStyle = rgba(palette.b, 0.07 + b * 0.01 + mid * 0.08);
        ctx.fillRect(x + pulseW - 10 - b * 5, y + pulseH - 8 - meterH, 3, meterH);
      }
    });

    for (let i = 0; i < 3 + Math.floor(this.activeEventPower() * 3); i++) {
      const y = height * (0.25 + i * 0.2) + Math.sin(time * (1.3 + i * 0.4)) * bass * 14;
      cg_drawLine(ctx, width * 0.04, y, width * 0.96, y + Math.sin(time * 2 + i) * high * 18, palette.c, 0.04 + bass * 0.1 + this.activeEventPower() * 0.05, 1 + bass * 2.4);
    }

    this.drawScanlines(ctx, width, height, time, audio, palette);
    this.drawGlitch(ctx, width, height, time, audio, palette);
    ctx.restore();
  }
};

window.CodeGlitchScene = CodeGlitchScene;
