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
  if (typeof BeatBus !== 'undefined') BeatBus.update(audio);
  if (typeof RuntimeMonitor !== 'undefined') RuntimeMonitor.update(time, audio);
  HudController.update();
  ThreeLayer.update(time, audio);
  PixiLayer.update(time, audio);
  requestAnimationFrame(loop);
}

function registerServiceWorker() {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    if (typeof location === 'undefined' || location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('[Maestro V] service worker registration failed', error);
    });
  } catch (error) {
    console.warn('[Maestro V] service worker skipped', error);
  }
}

window.addEventListener('DOMContentLoaded', () => { boot(); registerServiceWorker(); });
