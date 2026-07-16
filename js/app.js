async function boot() {
  try {
    HudController.init();
    ThreeLayer.init();
    PixiLayer.init();
    window.addEventListener('resize', () => { ThreeLayer.resize(); PixiLayer.resize(); });
    requestAnimationFrame(loop);
  } catch (error) {
    console.error('[Maestro V boot failed]', error);
    const pill = document.getElementById('statusPill');
    if (pill) pill.textContent = 'BOOT ERROR';
  }
}

function loop() {
  const time = performance.now() * 0.001;
  AudioEngine.update();
  const audio = AudioEngine.snapshot();
  if (typeof RuntimeMonitor !== 'undefined') RuntimeMonitor.update(time, audio);
  HudController.update();
  ThreeLayer.update(time, audio);
  PixiLayer.update(time, audio);
  requestAnimationFrame(loop);
}

window.addEventListener('DOMContentLoaded', boot);
