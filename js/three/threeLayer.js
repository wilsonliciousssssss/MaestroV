const ThreeLayer = {
  canvas: null,
  ctx: null,
  lastErrors: {},

  init() {
    this.canvas = document.getElementById('threeCanvas');
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

    // Lower canvas owns the black stage background.
    this.ctx.fillStyle = 'rgba(0,0,0,0.16)';
    this.ctx.fillRect(0, 0, width, height);

    const pulseAudio = this.enhanceAudioWithPulse(audio);
    this.withHybridAlpha(() => {
      this.withCamera(width, height, () => {
        if (VisualState.sceneActive('dna')) this.safeDraw('dna', () => DnaOscilloscopeScene.draw(this.ctx, width, height, time, pulseAudio));
        if (VisualState.sceneActive('mobius')) this.safeDraw('mobius', () => (window.MobiusGalaxyScene || MobiusGalaxyScene).draw(this.ctx, width, height, time, pulseAudio));
      });
    });
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
    const depth = isHybrid ? clamp((VisualState.controls.hybridSceneDepth || 70) / 100, 0.15, 1) : 1;
    this.ctx.save();
    this.ctx.globalAlpha *= depth;
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

  safeDraw(sceneName, drawFn) {
    try {
      drawFn();
    } catch (error) {
      if (!this.lastErrors[sceneName] || performance.now() - this.lastErrors[sceneName] > 2000) {
        console.warn(`[Maestro V106] 3D scene draw skipped: ${sceneName}`, error);
        this.lastErrors[sceneName] = performance.now();
      }
    }
  }
};
