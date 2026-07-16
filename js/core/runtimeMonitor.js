const RuntimeMonitor = {
  enabled: true,
  frameCount: 0,
  lastTime: 0,
  lastUpdate: 0,
  fps: 0,
  frameMs: 0,
  scene: '--',
  hybridActiveCount: 0,

  update(now, audio) {
    if (!this.lastTime) this.lastTime = now;
    const delta = Math.max(0.0001, now - this.lastTime);
    this.lastTime = now;
    this.frameCount += 1;
    this.frameMs = delta * 1000;

    if (now - this.lastUpdate >= 0.5) {
      this.fps = Math.round(this.frameCount / (now - this.lastUpdate));
      this.frameCount = 0;
      this.lastUpdate = now;
      this.scene = VisualState.sceneLabel ? VisualState.sceneLabel() : VisualState.scene;
      this.hybridActiveCount = Object.values(VisualState.hybridLayers || {}).filter(Boolean).length;
      this.audio = audio || {};
      this.firework = this.countFirework();
      this.missile = this.countMissile();
      this.atomic = this.countAtomic();
      this.automation = VisualState.automationEnabled ? `On · ${VisualState.automationBeatCount || 0}` : 'Off';
    }
  },

  countFirework() {
    if (typeof FireworkBurstScene === 'undefined' || !FireworkBurstScene) return '0';
    const bursts = Array.isArray(FireworkBurstScene.bursts) ? FireworkBurstScene.bursts.length : 0;
    return `${bursts} bursts`;
  },

  countMissile() {
    if (typeof PixelMissileScene === 'undefined' || !PixelMissileScene) return '0';
    const missiles = Array.isArray(PixelMissileScene.missiles) ? PixelMissileScene.missiles.length : 0;
    const bursts = Array.isArray(PixelMissileScene.bursts) ? PixelMissileScene.bursts.length : 0;
    const debris = Array.isArray(PixelMissileScene.debris) ? PixelMissileScene.debris.length : 0;
    return `${missiles} / ${bursts} / ${debris}`;
  },

  countAtomic() {
    if (typeof AtomicViralScene === 'undefined' || !AtomicViralScene) return '0';
    const atoms = Array.isArray(AtomicViralScene.atoms) ? AtomicViralScene.atoms.length : 0;
    const viruses = Array.isArray(AtomicViralScene.viruses) ? AtomicViralScene.viruses.length : 0;
    const particles = Array.isArray(AtomicViralScene.particles) ? AtomicViralScene.particles.length : 0;
    const events = Array.isArray(AtomicViralScene.events) ? AtomicViralScene.events.length : 0;
    return `${atoms}A ${viruses}V ${particles}P ${events}E`;
  },

  cleanup() {
    const scenes = [window.FireworkBurstScene, window.PixelMissileScene, window.AtomicViralScene, window.MobiusGalaxyScene, window.CodeGlitchScene];
    scenes.forEach((scene) => {
      if (!scene) return;
      if (typeof scene.trimForHybrid === 'function') scene.trimForHybrid();
      else if (typeof scene.reset === 'function') scene.reset();
    });
  },

  snapshot() {
    const audio = this.audio || {};
    return {
      enabled: this.enabled,
      fps: this.fps,
      frameMs: this.frameMs,
      scene: this.scene,
      hybrid: VisualState.scene === 'hybrid' ? `${this.hybridActiveCount} layers` : 'Off',
      audio: audio.enabled ? 'Active' : 'Fallback',
      audioSource: audio.sourceLabel || audio.sourceType || 'Fallback',
      firework: this.firework || '0',
      missile: this.missile || '0',
      atomic: this.atomic || '0',
      automation: this.automation || 'Off'
    };
  }
};
