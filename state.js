const VisualState = {
  scene: 'matrix',
  paletteIndex: 0,
  perfIndex: 1,
  gradientEnabled: true,
  beatFxEnabled: false,
  beatFxFourEnabled: false,
  beatFxBeatCount: 0,
  beatFxLastPulseAt: 0,
  transitionEnabled: false,
  transitionType: 'sequence',
  transitionSeconds: 18,
  lastSceneSwitchAt: 0,
  controls: {},
  hybridLayers: {},
  lastBeatFxAt: 0,
  colorBeatFxEnabled: false,
  colorBeatFxBeatCount: 0,
  colorBeatFxLastPulseAt: 0,
  lastColorBeatFxAt: 0,
  automationEnabled: false,
  automationBeatCount: 0,
  automationLastPulseAt: 0,
  automationSceneEvery: 32,
  automationEventEvery: 8,
  automationRandomEvery: 16,
  automationLastAction: 'Off',
  customColourEnabled: false,
  customPalette: { name: 'Custom', a: '#79f7ff', b: '#42a5ff', c: '#ff2d8f' },
  textProjectionEnabled: false,
  textMessage: 'MAESTRO\nLIVE VISUAL',
  textFont: 'hudMono',
  textColourSlot: 'a',
  textGlowColourSlot: 'c',
  textProjectionLayer: 'above',
  textAnimationMode: 'pulse',
  textAlign: 'center',

  init() {
    this.controls = {};
    [...DJ_CONFIG.globalControls, ...DJ_CONFIG.audioControls, ...DJ_CONFIG.colorControls, ...DJ_CONFIG.textControls].forEach((control) => {
      this.controls[control.id] = control.value;
    });
    Object.values(DJ_CONFIG.sceneControls).flat().forEach((control) => {
      this.controls[control.id] = control.value;
    });
    this.hybridLayers = {};
    DJ_CONFIG.scenes.forEach((scene) => {
      if (scene.id !== 'hybrid') this.hybridLayers[scene.id] = true;
    });
    this.lastSceneSwitchAt = performance.now ? performance.now() : 0;
  },

  palette() {
    if (this.customColourEnabled) return this.customPalette;
    return DJ_CONFIG.palettes[this.paletteIndex % DJ_CONFIG.palettes.length];
  },

  basePalette() {
    return DJ_CONFIG.palettes[this.paletteIndex % DJ_CONFIG.palettes.length];
  },

  nextPalette() { this.paletteIndex = (this.paletteIndex + 1) % DJ_CONFIG.palettes.length; },

  toggleCustomColours() {
    this.customColourEnabled = !this.customColourEnabled;
  },

  setCustomColour(channel, value) {
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) return;
    if (channel === 'a' || channel === 'b' || channel === 'c') {
      this.customPalette[channel] = value;
    }
  },

  toggleTextProjection() { this.textProjectionEnabled = !this.textProjectionEnabled; },
  setTextMessage(value) { this.textMessage = String(value ?? '').slice(0, 240); },
  setTextFont(value) { if (DJ_CONFIG.textFonts.some((font) => font.id === value)) this.textFont = value; },
  setTextColourSlot(value) { if (['a', 'b', 'c'].includes(value)) this.textColourSlot = value; },
  setTextGlowColourSlot(value) { if (['a', 'b', 'c'].includes(value)) this.textGlowColourSlot = value; },
  setTextProjectionLayer(value) { if (['behind', 'above'].includes(value)) this.textProjectionLayer = value; },
  setTextAnimationMode(value) { if (DJ_CONFIG.textAnimationModes.some((mode) => mode.id === value)) this.textAnimationMode = value; },
  setTextAlign(value) { if (['left', 'center', 'right'].includes(value)) this.textAlign = value; },
  textFontConfig() { return DJ_CONFIG.textFonts.find((font) => font.id === this.textFont) || DJ_CONFIG.textFonts[0]; },
  textAnimationConfig() { return DJ_CONFIG.textAnimationModes.find((mode) => mode.id === this.textAnimationMode) || DJ_CONFIG.textAnimationModes[0]; },
  currentTextHex() { const palette = this.palette(); return palette[this.textColourSlot] || palette.a || '#ffffff'; },
  currentTextGlowHex() { const palette = this.palette(); return palette[this.textGlowColourSlot] || palette.c || palette.a || '#ffffff'; },
  nextPerfMode() { this.perfIndex = (this.perfIndex + 1) % DJ_CONFIG.perfModes.length; },
  perfMode() { return DJ_CONFIG.perfModes[this.perfIndex]; },
  setControl(id, value) { this.controls[id] = Number(value); },

  resetCamera() {
    this.controls.cameraZoom = 100;
    this.controls.cameraTilt = 0;
  },

  adjustCameraZoom(delta) {
    this.controls.cameraZoom = clamp((this.controls.cameraZoom || 100) + delta, 60, 160);
  },

  adjustCameraRotation(delta) {
    this.controls.cameraTilt = clamp((this.controls.cameraTilt || 0) + delta, -45, 45);
  },

  setScene(sceneId) { this.scene = sceneId; this.lastSceneSwitchAt = performance.now(); },
  setTransitionType(value) { this.transitionType = value; },
  setTransitionSeconds(value) { this.transitionSeconds = clamp(Number(value) || 18, 4, 120); },
  toggleHybridLayer(id) { if (id in this.hybridLayers) this.hybridLayers[id] = !this.hybridLayers[id]; },
  setHybridLayer(id, enabled) { if (id in this.hybridLayers) this.hybridLayers[id] = !!enabled; },
  sceneActive(id) { return this.scene === 'hybrid' ? !!this.hybridLayers[id] : this.scene === id; },
  sceneLabel() { const item = DJ_CONFIG.scenes.find((scene) => scene.id === this.scene); return item ? item.label : this.scene; },
  playableScenes() { return DJ_CONFIG.scenes.filter((scene) => scene.id !== 'hybrid').map((scene) => scene.id); },

  nextScene(manualType = null) {
    const type = manualType || this.transitionType;
    const list = this.playableScenes();
    if (!list.length) return this.scene;
    let next = list[0];
    if (type === 'random') {
      const pool = list.filter((id) => id !== this.scene);
      next = pool[Math.floor(Math.random() * pool.length)] || list[0];
    } else {
      const currentIndex = list.indexOf(this.scene);
      next = list[(currentIndex + 1 + list.length) % list.length];
    }
    this.setScene(next);
    return next;
  },

  maybeAdvanceScene(now = performance.now()) {
    if (!this.transitionEnabled) return false;
    if (this.scene === 'hybrid') return false; /* hybrid is a manual destination — auto transitions never pull out of it */
    if (now - this.lastSceneSwitchAt < this.transitionSeconds * 1000) return false;
    this.nextScene();
    return true;
  },

  randomizeVisuals() {
    [...DJ_CONFIG.globalControls, ...DJ_CONFIG.colorControls, ...DJ_CONFIG.textControls].forEach((control) => {
      const span = control.max - control.min;
      const raw = control.min + Math.random() * span;
      const stepped = Math.round(raw / control.step) * control.step;
      this.controls[control.id] = Number(stepped.toFixed(2));
    });
    const activeSceneControls = DJ_CONFIG.sceneControls[this.scene] || [];
    activeSceneControls.forEach((control) => {
      const span = control.max - control.min;
      const raw = control.min + Math.random() * span;
      const stepped = Math.round(raw / control.step) * control.step;
      this.controls[control.id] = Number(stepped.toFixed(2));
    });
  },


  setAutomationSceneEvery(value) { this.automationSceneEvery = clamp(Number(value) || 0, 0, 128); },
  setAutomationEventEvery(value) { this.automationEventEvery = clamp(Number(value) || 0, 0, 64); },
  setAutomationRandomEvery(value) { this.automationRandomEvery = clamp(Number(value) || 0, 0, 128); },
  toggleBeatAutomation() {
    this.automationEnabled = !this.automationEnabled;
    this.automationBeatCount = 0;
    this.automationLastPulseAt = 0;
    this.automationLastAction = this.automationEnabled ? 'Armed' : 'Off';
  },

  detectAutomationPulse(audio, now = performance.now()) {
    const bass = audio.bass || 0;
    const beat = audio.beat || 0;
    const pulseDetected = beat > 0.5 || bass > 0.66;
    if (!pulseDetected || now - this.automationLastPulseAt < 240) return false;
    this.automationLastPulseAt = now;
    this.automationBeatCount = (this.automationBeatCount || 0) + 1;
    return true;
  },

  triggerBeatAutomationEvent(audio = {}, manual = false) {
    const scene = this.scene;
    let triggered = false;
    const highEnergy = (audio.beat || 0) > 0.72 || manual;

    if ((scene === 'firework' || scene === 'hybrid') && typeof FireworkBurstScene !== 'undefined') {
      if (typeof FireworkBurstScene.queueManualBurst === 'function') {
        FireworkBurstScene.queueManualBurst();
        triggered = true;
      } else if (typeof FireworkBurstScene.triggerMegaBurst === 'function') {
        FireworkBurstScene.triggerMegaBurst(window.innerWidth || 1920, window.innerHeight || 1080, performance.now() * 0.001, audio);
        triggered = true;
      }
    }

    if ((scene === 'missile' || scene === 'hybrid') && typeof PixelMissileScene !== 'undefined') {
      if (highEnergy && typeof PixelMissileScene.queueMegaMissile === 'function') PixelMissileScene.queueMegaMissile();
      else if (typeof PixelMissileScene.queueManualMissile === 'function') PixelMissileScene.queueManualMissile();
      triggered = true;
    }

    if ((scene === 'atomic' || scene === 'hybrid') && typeof AtomicViralScene !== 'undefined' && typeof AtomicViralScene.queueManualEvent === 'function') {
      AtomicViralScene.queueManualEvent();
      triggered = true;
    }

    if (scene === 'iris') {
      this.controls.irisPupilPulse = clamp((this.controls.irisPupilPulse || 42) + 8, 0, 100);
      this.controls.irisSymmetryWarp = clamp((this.controls.irisSymmetryWarp || 36) + 6, 0, 100);
      triggered = true;
    }

    if (scene === 'codeglitch') {
      this.controls.codeGlitchAmount = clamp((this.controls.codeGlitchAmount || 52) + 12, 0, 100);
      this.controls.codeRgbSplit = clamp((this.controls.codeRgbSplit || 28) + 10, 0, 100);
      this.controls.codeNoiseBlocks = clamp((this.controls.codeNoiseBlocks || 34) + 10, 0, 120);
      if (typeof CodeGlitchScene !== 'undefined' && CodeGlitchScene && typeof CodeGlitchScene.queueEvent === 'function') CodeGlitchScene.queueEvent(highEnergy ? 'breach' : 'glitch', highEnergy ? 1.25 : 0.85);
      triggered = true;
    }

    if (scene === 'mobius') {
      this.controls.mobiusGravityPulse = clamp((this.controls.mobiusGravityPulse || 66) + 10, 0, 100);
      this.controls.mobiusLensDistortion = clamp((this.controls.mobiusLensDistortion || 52) + 8, 0, 100);
      this.controls.mobiusSignalSpeed = clamp((this.controls.mobiusSignalSpeed || 54) + 6, 0, 100);
      triggered = true;
    }

    if (!triggered) this.randomizeVisuals();
    this.automationLastAction = triggered ? 'Scene event' : 'Visual randomise';
    return this.automationLastAction;
  },

  randomizeActiveSceneControls() {
    const activeSceneControls = DJ_CONFIG.sceneControls[this.scene] || [];
    activeSceneControls.forEach((control) => {
      const span = control.max - control.min;
      const raw = control.min + Math.random() * span;
      const stepped = Math.round(raw / control.step) * control.step;
      this.controls[control.id] = Number(stepped.toFixed(2));
    });
    this.automationLastAction = 'Active scene randomised';
  },

  applyBeatAutomation(audio) {
    if (!this.automationEnabled) return null;
    const now = performance.now();
    if (!this.detectAutomationPulse(audio, now)) return null;

    const beat = this.automationBeatCount;
    let action = null;

    if (this.automationSceneEvery > 0 && this.scene !== 'hybrid' && beat % this.automationSceneEvery === 0) {
      this.nextScene(this.transitionType === 'sequence' ? 'sequence' : 'random');
      action = `Scene: ${this.sceneLabel()}`;
    }

    if (this.automationRandomEvery > 0 && beat % this.automationRandomEvery === 0) {
      this.randomizeActiveSceneControls();
      action = action ? `${action} + randomise` : 'Active scene randomised';
    }

    if (this.automationEventEvery > 0 && beat % this.automationEventEvery === 0) {
      const eventAction = this.triggerBeatAutomationEvent(audio, false);
      action = action ? `${action} + ${eventAction}` : eventAction;
    }

    if (!action) action = `Beat ${beat}`;
    this.automationLastAction = action;
    return action;
  },

  applyBeatFx(audio) {
    if (!this.beatFxEnabled) return;

    const now = performance.now();
    const interval = this.controls.beatFxInterval || 1200;

    if (this.beatFxFourEnabled) {
      const bass = audio.bass || 0;
      const beat = audio.beat || 0;
      const pulseDetected = beat > 0.48 || bass > 0.62;

      if (!pulseDetected || now - this.beatFxLastPulseAt < 220) return;

      this.beatFxLastPulseAt = now;
      this.beatFxBeatCount = (this.beatFxBeatCount || 0) + 1;

      if (this.beatFxBeatCount % 4 !== 0) return;
      this.lastBeatFxAt = now;
      this.applyBeatFxRandomisation(audio, 1.16);
      return;
    }

    if (now - this.lastBeatFxAt < interval) return;
    this.lastBeatFxAt = now;
    this.applyBeatFxRandomisation(audio, 1);
  },

  applyBeatFxRandomisation(audio, modeMultiplier = 1) {
    const strength = ((this.controls.beatFxStrength || 48) / 100) * modeMultiplier;
    const bass = audio.bass || 0;
    const mid = audio.mid || 0;
    const high = audio.high || 0;
    const beat = audio.beat || 0;

    this.controls.density = clamp(70 + bass * 150 * strength + mid * 80, 20, 260);
    this.controls.speed = clamp(0.7 + beat * 2.4 * strength + bass * 0.9, 0.2, 4);
    this.controls.glow = clamp(20 + bass * 65 * strength + high * 25, 0, 100);
    this.controls.pulse = clamp(38 + beat * 86 * strength + bass * 30, 0, 120);
    this.controls.colorCycle = clamp(24 + high * 70 * strength + mid * 30, 0, 100);
    this.controls.jitter = clamp(10 + high * 60 * strength, 0, 80);
  },

  applyColorBeatFx(audio) {
    if (!this.colorBeatFxEnabled) return;

    const now = performance.now();
    const bass = audio.bass || 0;
    const beat = audio.beat || 0;
    const pulseDetected = beat > 0.48 || bass > 0.62;

    if (!pulseDetected || now - this.colorBeatFxLastPulseAt < 220) return;

    this.colorBeatFxLastPulseAt = now;
    this.colorBeatFxBeatCount = (this.colorBeatFxBeatCount || 0) + 1;

    // 4/4 time assumption: 2 bars = 8 pulse counts.
    if (this.colorBeatFxBeatCount % 8 !== 0) return;

    this.lastColorBeatFxAt = now;
    this.applyColorBeatFxChange(audio);
  },

  applyColorBeatFxChange(audio) {
    const bass = audio.bass || 0;
    const mid = audio.mid || 0;
    const high = audio.high || 0;
    const beat = audio.beat || 0;

    if (!this.customColourEnabled) this.nextPalette();

    const hueBase = [-120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180][Math.floor(Math.random() * 11)];
    const hueEnergy = (high - bass) * 60 + (Math.random() * 20 - 10);
    this.controls.hueShift = clamp(hueBase + hueEnergy, -180, 180);
    this.controls.saturation = clamp(92 + high * 56 + Math.random() * 22, 40, 180);
    this.controls.brightness = clamp(94 + beat * 48 + mid * 18 + Math.random() * 10, 40, 180);
    this.controls.contrast = clamp(100 + bass * 26 + high * 24 + Math.random() * 12, 40, 180);
    this.controls.colorCycle = clamp(18 + high * 44 + beat * 18 + Math.random() * 12, 0, 100);
    this.controls.gradient = clamp(10 + bass * 34 + Math.random() * 12, 0, 100);
    this.controls.gradientOpacity = clamp(18 + beat * 34 + high * 18 + Math.random() * 12, 0, 100);
    this.controls.gradientSpeed = clamp(16 + mid * 36 + beat * 20 + Math.random() * 14, 0, 100);
  },
};

function clamp(value, minValue, maxValue) { return Math.max(minValue, Math.min(maxValue, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const value = parseInt(clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
  };
}

const _crgbCache = { sig: '', map: new Map() };
function controlledRgb(hex) {
  const controls = VisualState && VisualState.controls ? VisualState.controls : {};
  const time = performance && performance.now ? performance.now() * 0.001 : 0;
  const cycleRaw = Math.sin(time * (0.2 + (controls.colorCycle || 0) / 70)) * ((controls.colorCycle || 0) * 0.28);
  const cycle = Math.round(cycleRaw * 2) / 2; /* 0.5° hue buckets — visually identical, cacheable */
  const sig = (controls.hueShift || 0) + '|' + (controls.saturation || 100) + '|' + (controls.brightness || 100) + '|' + (controls.contrast || 100) + '|' + cycle;
  if (sig !== _crgbCache.sig) { _crgbCache.sig = sig; _crgbCache.map.clear(); }
  const cached = _crgbCache.map.get(hex);
  if (cached) return cached;
  const base = hexToRgb(hex);
  const hsl = rgbToHsl(base.r, base.g, base.b);
  const hue = hsl.h + (controls.hueShift || 0) + cycle;
  const sat = clamp(hsl.s * ((controls.saturation || 100) / 100), 0, 1);
  const light = clamp(hsl.l * ((controls.brightness || 100) / 100), 0, 1);
  const rgb = hslToRgb(hue, sat, light);
  const contrast = clamp((controls.contrast || 100) / 100, 0.4, 1.8);
  const out = {
    r: Math.round(clamp((rgb.r - 128) * contrast + 128, 0, 255)),
    g: Math.round(clamp((rgb.g - 128) * contrast + 128, 0, 255)),
    b: Math.round(clamp((rgb.b - 128) * contrast + 128, 0, 255))
  };
  _crgbCache.map.set(hex, out);
  return out;
}

function rgba(hex, alpha = 1) {
  const c = controlledRgb(hex);
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}
function clearCanvas(ctx, canvas, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore(); }
function resizeCanvasToDisplaySize(canvas, ctx) { const dpr = Math.min(window.devicePixelRatio || 1, window.MAESTRO_DPR_CAP || 2); const width = Math.floor(window.innerWidth * dpr); const height = Math.floor(window.innerHeight * dpr); if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; } ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
/* V112 — shared beat clock: rising-edge beat detection + bar phase, so scenes
   can land events ON the kick instead of on arbitrary timers. */
const BeatBus = {
  active: false, count: 0, downbeat: false, _prev: 0,
  update(audio) {
    const b = (audio && audio.beat) || 0;
    this.active = b > 0.5 && this._prev <= 0.5;
    if (this.active) { this.count += 1; this.downbeat = this.count % 4 === 1; }
    else this.downbeat = false;
    this._prev = b;
  }
};
if (typeof window !== 'undefined') window.BeatBus = BeatBus;

/* V112 — additive neon pass: run fn with 'lighter' compositing for true flashes. */
function additiveDraw(ctx, fn) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  try { fn(); } finally { ctx.restore(); }
}

VisualState.init();
