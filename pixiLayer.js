const PixiLayer = {
  canvas: null,
  ctx: null,
  lastErrors: {},

  init() {
    this.canvas = document.getElementById('pixiCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
  },

  resize() {
    resizeCanvasToDisplaySize(this.canvas, this.ctx);
  },

  update(time, audio) {
    this.resize();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scene = VisualState.scene;

    // IMPORTANT V57 FIX:
    // The upper 2D canvas previously faded with black fill. That made lower 3D
    // scenes such as DNA and Mobius appear to stop working because the upper
    // canvas became opaque. This now fades pixels to transparency instead.
    this.fadeTransparent(width, height);

    const pulseAudio = this.enhanceAudioWithPulse(audio);
    if (VisualState.gradientEnabled && this.hasActivePixiScene()) {
      this.safeDraw('gradient', () => this.drawGradient(width, height, time, pulseAudio));
    }

    if (VisualState.textProjectionEnabled && VisualState.textProjectionLayer === 'behind') {
      this.safeDraw('textProjectionBehind', () => this.drawProjectedText(width, height, time, pulseAudio));
    }

    this.withHybridAlpha(() => {
      this.withCamera(width, height, () => {
        if (VisualState.sceneActive('matrix')) this.safeDraw('matrix', () => MatrixCodingScene.draw(this.ctx, width, height, time, pulseAudio));
        if (VisualState.sceneActive('codeglitch')) this.safeDraw('codeglitch', () => this.drawHybridSafeScene('codeglitch', CodeGlitchScene, width, height, time, pulseAudio));
        if (VisualState.sceneActive('constellation')) this.safeDraw('constellation', () => DataConstellationScene.draw(this.ctx, width, height, time, pulseAudio));
        if (VisualState.sceneActive('orbit')) this.safeDraw('orbit', () => OrbitGeometryScene.draw(this.ctx, width, height, time, pulseAudio));
        if (VisualState.sceneActive('obsidian')) this.safeDraw('obsidian', () => ObsidianGraphScene.draw(this.ctx, width, height, time, pulseAudio));
        if (VisualState.sceneActive('missile')) this.safeDraw('missile', () => this.drawHybridSafeScene('missile', PixelMissileScene, width, height, time, pulseAudio));
        if (VisualState.sceneActive('laser')) this.safeDraw('laser', () => LaserPerspectiveScene.draw(this.ctx, width, height, time, pulseAudio));
        if (VisualState.sceneActive('chladni')) this.safeDraw('chladni', () => ChladniPlateScene.draw(this.ctx, width, height, time, pulseAudio));
        if (VisualState.sceneActive('slash')) this.safeDraw('slash', () => SlashFabricScene.draw(this.ctx, width, height, time, pulseAudio));
        if (VisualState.sceneActive('atomic')) this.safeDraw('atomic', () => this.drawHybridSafeScene('atomic', AtomicViralScene, width, height, time, pulseAudio));
        if (VisualState.sceneActive('iris')) this.safeDraw('iris', () => KaleidoIrisScene.draw(this.ctx, width, height, time, pulseAudio));
        if (VisualState.sceneActive('firework')) this.safeDraw('firework', () => this.drawHybridSafeScene('firework', FireworkBurstScene, width, height, time, pulseAudio));
      });
    });

    if (this.hasActivePixiScene()) this.safeDraw('scanlines', () => this.drawScanlines(width, height));
    if (VisualState.textProjectionEnabled && VisualState.textProjectionLayer === 'above') this.safeDraw('textProjectionAbove', () => this.drawProjectedText(width, height, time, pulseAudio));
  },

  hasActivePixiScene() {
    return ['matrix', 'codeglitch', 'constellation', 'orbit', 'obsidian', 'missile', 'laser', 'slash', 'atomic', 'iris', 'firework']
      .some((sceneId) => VisualState.sceneActive(sceneId));
  },

  enhanceAudioWithPulse(audio) {
    const pulseBoost = 1 + (VisualState.controls.pulse || 0) / 120;
    return {
      ...audio,
      beat: clamp((audio.beat || 0) * pulseBoost, 0, 1),
      bass: clamp((audio.bass || 0) * (0.92 + pulseBoost * 0.08), 0, 1),
      mid: clamp((audio.mid || 0) * (0.94 + pulseBoost * 0.06), 0, 1),
      high: clamp((audio.high || 0) * (0.94 + pulseBoost * 0.06), 0, 1)
    };
  },

  withHybridAlpha(drawFn) {
    const isHybrid = VisualState.scene === 'hybrid';
    const mix = isHybrid ? clamp((VisualState.controls.hybridMix || 66) / 100, 0.1, 1) : 1;
    this.ctx.save();
    this.ctx.globalAlpha *= mix;
    drawFn();
    this.ctx.restore();
  },

  withCamera(width, height, drawFn) {
    const zoom = (VisualState.controls.cameraZoom || 100) / 100;
    const rotation = (VisualState.controls.cameraTilt || 0) * Math.PI / 180;
    this.ctx.save();
    this.ctx.translate(width / 2, height / 2);
    this.ctx.rotate(rotation);
    this.ctx.scale(zoom, zoom);
    this.ctx.translate(-width / 2, -height / 2);
    drawFn();
    this.ctx.restore();
  },

  drawHybridSafeScene(sceneName, sceneObject, width, height, time, audio) {
    if (!sceneObject || typeof sceneObject.draw !== 'function') return;

    // V86: Firework and Missile are high-state scenes. In Hybrid Mix, drawing them
    // together with every other layer can over-spawn particles and produce console
    // errors / frame stalls. Clamp their state and use a slightly reduced audio feed.
    const isHybrid = VisualState.scene === 'hybrid';
    if (isHybrid) {
      if (sceneName === 'firework') {
        if (Array.isArray(sceneObject.bursts) && sceneObject.bursts.length > 10) sceneObject.bursts.splice(0, sceneObject.bursts.length - 10);
      }
      if (sceneObject && typeof sceneObject.trimForHybrid === 'function') sceneObject.trimForHybrid();
      if (sceneName === 'atomic') {
        if (Array.isArray(sceneObject.atoms) && sceneObject.atoms.length > 16) sceneObject.atoms.splice(0, sceneObject.atoms.length - 16);
        if (Array.isArray(sceneObject.viruses) && sceneObject.viruses.length > 12) sceneObject.viruses.splice(0, sceneObject.viruses.length - 12);
        if (Array.isArray(sceneObject.particles) && sceneObject.particles.length > 140) sceneObject.particles.splice(0, sceneObject.particles.length - 140);
        if (Array.isArray(sceneObject.events) && sceneObject.events.length > 10) sceneObject.events.splice(0, sceneObject.events.length - 10);
      }
      if (sceneName === 'missile') {
        if (Array.isArray(sceneObject.missiles) && sceneObject.missiles.length > 14) sceneObject.missiles.splice(0, sceneObject.missiles.length - 14);
        if (Array.isArray(sceneObject.bursts) && sceneObject.bursts.length > 10) sceneObject.bursts.splice(0, sceneObject.bursts.length - 10);
        if (Array.isArray(sceneObject.debris) && sceneObject.debris.length > 220) sceneObject.debris.splice(0, sceneObject.debris.length - 220);
        if (Array.isArray(sceneObject.empPulses) && sceneObject.empPulses.length > 5) sceneObject.empPulses.splice(0, sceneObject.empPulses.length - 5);
      }
    }

    const sceneAudio = isHybrid
      ? {
          ...audio,
          beat: clamp((audio.beat || 0) * 0.82, 0, 1),
          bass: clamp((audio.bass || 0) * 0.86, 0, 1),
          mid: clamp((audio.mid || 0) * 0.88, 0, 1),
          high: clamp((audio.high || 0) * (sceneName === 'atomic' ? 0.84 : sceneName === 'codeglitch' ? 0.82 : 0.9), 0, 1)
        }
      : audio;

    sceneObject.draw(this.ctx, width, height, time, sceneAudio);
  },

  fadeTransparent(width, height) {
    const trailAlpha = clamp((VisualState.controls.trails || 22) / 100, 0.06, 0.85);
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`;
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.restore();
    this.ctx.globalCompositeOperation = 'source-over';
  },

  safeDraw(sceneName, drawFn) {
    try {
      drawFn();
    } catch (error) {
      if (!this.lastErrors[sceneName] || performance.now() - this.lastErrors[sceneName] > 2000) {
        console.warn(`[Maestro V106] Scene draw skipped: ${sceneName}`, error);
        this.lastErrors[sceneName] = performance.now();
      }
    }
  },

  drawGradient(width, height, time, audio) {
    const p = VisualState.palette();
    const amount = (VisualState.controls.gradient || 0) / 100;
    if (amount <= 0) return;
    const speed = (VisualState.controls.gradientSpeed || 38) / 100;
    const shift = (Math.sin(time * speed) * 0.5 + 0.5) * width * 0.35;
    const g = this.ctx.createLinearGradient(shift, 0, width - shift, height);
    const opacity = (VisualState.controls.gradientOpacity || 30) / 100;
    g.addColorStop(0, rgba(p.a, amount * opacity * 0.18 * (1 + audio.bass * 0.55)));
    g.addColorStop(0.5, rgba(p.b, amount * opacity * 0.135));
    g.addColorStop(1, rgba(p.c, amount * opacity * 0.18 * (1 + audio.high * 0.55)));
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, width, height);
  },

  drawProjectedText(width, height, time, audio) {
    const message = (VisualState.textMessage || '').trim();
    if (!message) return;

    const sourceLines = message.split(/\r?\n/).filter(Boolean).slice(0, 8);
    if (!sourceLines.length) return;

    const baseFontSize = clamp(VisualState.controls.textSize || 72, 20, 180);
    const letterSpacing = clamp(VisualState.controls.textLetterSpacing || 0, 0, 40);
    const lineSpacing = clamp(VisualState.controls.textLineSpacing || 1.15, 0.8, 2.4);
    const family = VisualState.textFontConfig().family;
    const colourHex = VisualState.currentTextHex();
    const glowHex = VisualState.currentTextGlowHex();
    const opacityControl = clamp((VisualState.controls.textOpacity ?? 92) / 100, 0, 1);
    const glowBase = VisualState.controls.textGlow ?? 54;
    const rotationDeg = clamp(VisualState.controls.textRotation || 0, -180, 180);
    const offsetX = clamp(VisualState.controls.textOffsetX || 0, -100, 100) * 0.5 * width / 100;
    const offsetY = clamp(VisualState.controls.textOffsetY || 0, -100, 100) * 0.5 * height / 100;
    const baseScaleX = clamp((VisualState.controls.textScaleX ?? 100) / 100, 0.2, 2.2);
    const baseScaleY = clamp((VisualState.controls.textScaleY ?? 100) / 100, 0.2, 2.2);
    const mode = VisualState.textAnimationMode || 'pulse';

    const animated = this.resolveTextAnimation(mode, sourceLines, baseFontSize, time, audio);
    const lines = animated.lines;
    if (!lines.length) return;

    const fontSize = animated.fontSize;
    const blockOffsetX = animated.offsetX || 0;
    const blockOffsetY = animated.offsetY || 0;
    const scaleX = baseScaleX * (animated.scaleX ?? animated.scale ?? 1);
    const scaleY = baseScaleY * (animated.scaleY ?? animated.scale ?? 1);
    const extraRotation = animated.rotation || 0;
    const lineAdvance = fontSize * lineSpacing;
    const totalHeight = fontSize + Math.max(0, lines.length - 1) * lineAdvance;
    const lineWidths = lines.map((line) => this.measureSpacedLine(line, letterSpacing).width);
    const maxWidth = Math.max(...lineWidths, 1);
    const align = VisualState.textAlign || 'center';
    const alpha = clamp(opacityControl * animated.alpha, 0, 1);
    const glow = clamp(glowBase * 0.65 + (VisualState.controls.pulse || 0) * 0.08 + (audio.bass || 0) * 22 + (audio.high || 0) * 12 + animated.glowBoost, 0, 100);

    this.ctx.save();
    this.ctx.translate(width * 0.5 + offsetX + blockOffsetX, height * 0.5 + offsetY + blockOffsetY);
    this.ctx.rotate((rotationDeg + extraRotation) * Math.PI / 180);
    this.ctx.scale(scaleX, scaleY);
    this.ctx.font = `700 ${fontSize}px ${family}`;
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    this.ctx.lineWidth = Math.max(1, fontSize * 0.028);
    this.ctx.shadowColor = rgba(glowHex, Math.min(1, alpha));
    this.ctx.shadowBlur = glow;
    this.ctx.strokeStyle = rgba('#000000', clamp(0.24 + alpha * 0.32, 0.25, 0.72));
    this.ctx.fillStyle = rgba(colourHex, alpha);

    let y = -totalHeight * 0.5;
    lines.forEach((line, index) => {
      const metrics = { width: lineWidths[index] || 0 };
      let x = -maxWidth * 0.5;
      if (align === 'center') x = -metrics.width * 0.5;
      if (align === 'right') x = maxWidth * 0.5 - metrics.width;
      x += animated.lineOffsetX?.[index] || 0;
      const lineY = y + (animated.lineOffsetY?.[index] || 0);
      this.strokeSpacedText(line, x, lineY, letterSpacing);
      this.fillSpacedText(line, x, lineY, letterSpacing);
      y += lineAdvance;
    });

    if (mode === 'scan') {
      const scanHeight = Math.max(6, fontSize * 0.22);
      const travel = totalHeight + scanHeight * 2;
      const scanY = -totalHeight * 0.5 - scanHeight + ((time * (1.1 + this.textAnimSpeed() * 0.02)) % travel);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(-maxWidth, scanY, maxWidth * 2, scanHeight);
      this.ctx.clip();
      this.ctx.fillStyle = rgba(glowHex, clamp(alpha * 0.45, 0, 0.65));
      this.ctx.shadowColor = rgba(glowHex, Math.min(1, alpha));
      this.ctx.shadowBlur = glow + 18;
      let scanLineY = -totalHeight * 0.5;
      lines.forEach((line, index) => {
        const metrics = { width: lineWidths[index] || 0 };
        let x = -maxWidth * 0.5;
        if (align === 'center') x = -metrics.width * 0.5;
        if (align === 'right') x = maxWidth * 0.5 - metrics.width;
        this.fillSpacedText(line, x, scanLineY, letterSpacing);
        scanLineY += lineAdvance;
      });
      this.ctx.restore();
    }

    this.ctx.restore();
  },

  textAnimSpeed() {
    return clamp((VisualState.controls.textAnimationSpeed ?? 100) / 100, 0.1, 3);
  },

  resolveTextAnimation(mode, lines, baseFontSize, time, audio) {
    const beat = audio.beat || 0;
    const speed = this.textAnimSpeed();
    const state = {
      lines: lines.slice(),
      fontSize: baseFontSize,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      glowBoost: 0,
      lineOffsetX: [],
      lineOffsetY: []
    };

    if (mode === 'pulse') {
      const pulseWave = Math.sin(time * (1.6 + speed * 0.85)) * 0.5 + 0.5;
      state.scale = 1 + pulseWave * 0.04 + beat * 0.07;
      state.alpha = 0.86 + pulseWave * 0.1 + beat * 0.08;
      state.glowBoost = beat * 12;
      return state;
    }

    if (mode === 'flicker') {
      const flicker = Math.sin(time * 23.7 * speed) * 0.5 + 0.5;
      const randomPulse = Math.sin(time * 61.3 * speed + lines.join('').length) * 0.5 + 0.5;
      state.alpha = clamp(0.68 + flicker * 0.22 + randomPulse * 0.16 + beat * 0.08, 0.25, 1);
      state.glowBoost = 6 + randomPulse * 18;
      return state;
    }

    if (mode === 'scan') {
      const sweep = Math.sin(time * (1.2 + speed * 0.9));
      state.alpha = 0.82 + beat * 0.08;
      state.offsetY = sweep * 5;
      state.glowBoost = 10;
      return state;
    }

    if (mode === 'drift') {
      state.offsetX = Math.sin(time * (0.7 + speed * 0.6)) * 26;
      state.offsetY = Math.cos(time * (0.52 + speed * 0.45)) * 18;
      state.scale = 1 + Math.sin(time * 0.95 * speed) * 0.02;
      state.alpha = 0.82 + beat * 0.08;
      return state;
    }

    if (mode === 'typeOn') {
      const fullText = lines.join('\n');
      const cps = Math.max(4, Math.round(6 + speed * 12 + (audio.high || 0) * 8));
      const holdFrames = 28;
      const totalFrames = fullText.length + holdFrames;
      const index = Math.floor((time * cps) % Math.max(1, totalFrames));
      const visibleCount = Math.min(fullText.length, index);
      const visibleText = fullText.slice(0, visibleCount);
      state.lines = visibleText.split('\n').filter((line, idx, arr) => line.length > 0 || idx < arr.length - 1);
      if (!state.lines.length) state.lines = [''];
      state.alpha = 0.9;
      state.glowBoost = 4 + beat * 8;
      return state;
    }

    if (mode === 'wave') {
      state.alpha = 0.86 + beat * 0.08;
      state.lineOffsetX = lines.map((_, index) => Math.sin(time * 2.4 * speed + index * 0.85) * 24);
      state.lineOffsetY = lines.map((_, index) => Math.cos(time * 1.7 * speed + index * 0.65) * 4);
      state.glowBoost = 8 + beat * 10;
      return state;
    }

    if (mode === 'glitch') {
      const glitch = Math.sin(time * 39 * speed) > 0.72 ? 1 : 0;
      state.alpha = glitch ? 0.62 + beat * 0.2 : 0.9;
      state.offsetX = glitch ? Math.sin(time * 97) * 16 : 0;
      state.lineOffsetX = lines.map((_, index) => glitch ? Math.sin(time * 51 + index * 7) * 18 : 0);
      state.scaleX = glitch ? 1 + Math.sin(time * 77) * 0.05 : 1;
      state.glowBoost = glitch ? 26 : 8;
      return state;
    }

    if (mode === 'zoom') {
      const zoomWave = Math.sin(time * 2.2 * speed) * 0.5 + 0.5;
      state.scale = 0.88 + zoomWave * 0.22 + beat * 0.08;
      state.alpha = 0.78 + zoomWave * 0.18;
      state.glowBoost = zoomWave * 20;
      return state;
    }

    if (mode === 'spin') {
      state.rotation = Math.sin(time * 1.2 * speed) * 8 + beat * 4;
      state.scale = 1 + Math.sin(time * 1.6 * speed) * 0.025;
      state.alpha = 0.84 + beat * 0.1;
      state.glowBoost = 8 + beat * 12;
      return state;
    }

    if (mode === 'bounce') {
      const bounce = Math.abs(Math.sin(time * 2.8 * speed));
      state.offsetY = -bounce * 34;
      state.scaleY = 1 + bounce * 0.12 + beat * 0.04;
      state.scaleX = 1 - bounce * 0.04;
      state.alpha = 0.86 + bounce * 0.1;
      state.glowBoost = bounce * 18;
      return state;
    }

    return state;
  },

  measureSpacedLine(line, letterSpacing) {
    const chars = Array.from(line || '');
    if (!chars.length) return { width: 0 };
    let width = 0;
    chars.forEach((char, index) => {
      width += this.ctx.measureText(char).width;
      if (index < chars.length - 1) width += letterSpacing;
    });
    return { width };
  },

  strokeSpacedText(line, x, y, letterSpacing) {
    let cursorX = x;
    Array.from(line || '').forEach((char) => {
      this.ctx.strokeText(char, cursorX, y);
      cursorX += this.ctx.measureText(char).width + letterSpacing;
    });
  },

  fillSpacedText(line, x, y, letterSpacing) {
    let cursorX = x;
    Array.from(line || '').forEach((char) => {
      this.ctx.fillText(char, cursorX, y);
      cursorX += this.ctx.measureText(char).width + letterSpacing;
    });
  },

  drawScanlines(width, height) {
    const s = VisualState.controls.scanlines || 0;
    if (s <= 0) return;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    this.ctx.lineWidth = 1;
    const step = Math.max(4, 42 - s * 0.28);
    for (let y = 0; y < height; y += step) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
  }
};


// V89: lightweight runtime cleanup hook used when switching scenes.
window.SceneRuntimeTools = {
  resetForSceneChange(nextScene, previousScene) {
    const statefulScenes = [window.FireworkBurstScene, window.PixelMissileScene, window.AtomicViralScene, window.MobiusGalaxyScene];
    statefulScenes.forEach((scene) => {
      if (scene && typeof scene.trimForHybrid === 'function') scene.trimForHybrid();
    });
  }
};
