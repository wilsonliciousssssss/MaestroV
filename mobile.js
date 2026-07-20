/* ============================================================
   MAESTRO V — responsive / touch layer (V110)
   Desktop-first app; this module adapts it for phones + tablets.
   Tiers: phone portrait = Live mode (quick bar + bottom-sheet HUD,
   Lite perf, DPR cap) · phone landscape + tablet = drawer with
   touch sizing (CSS layer) · desktop = untouched.
   All DOM work is guarded so the node smoke test can load this file.
   ============================================================ */
const MaestroMobile = (() => {
  const PHONE_MAX = 700;

  function isTouch() {
    try {
      if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) return true;
      if (typeof matchMedia === 'function') return matchMedia('(pointer: coarse)').matches;
    } catch (e) { /* non-browser context */ }
    return false;
  }

  function isPhone() {
    try {
      return isTouch() && typeof innerWidth === 'number' && innerWidth <= PHONE_MAX;
    } catch (e) { return false; }
  }

  function syncBodyClasses() {
    if (typeof document === 'undefined' || !document.body || !document.body.classList) return;
    document.body.classList.toggle('touch-ui', isTouch());
    document.body.classList.toggle('phone-ui', isPhone());
  }

  /* Phones start in the lightest engine profile; the user can raise it. */
  function applyMobileDefaults(force) {
    if (!force && !isPhone()) return;
    if (typeof VisualState === 'undefined') return;
    VisualState.perfIndex = 0; /* Lite */
    if (VisualState.controls) {
      if ((VisualState.controls.density || 0) > 110) VisualState.setControl('density', 110);
      if ((VisualState.controls.glow || 0) > 26) VisualState.setControl('glow', 26);
    }
  }

  /* Phone GPUs pay per pixel — cap the canvas backing store below the global 2x. */
  function capDpr() {
    if (isPhone() && typeof window !== 'undefined') window.MAESTRO_DPR_CAP = 1.5;
  }

  /* Collapse heavy panels before HudController.init() builds the toggles. */
  function simplifyPanels() {
    if (!isPhone() || typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return;
    const keepOpen = ['Performance', 'Scene Controls'];
    document.querySelectorAll('.panel[data-panel-title]').forEach((panel) => {
      const title = panel.getAttribute('data-panel-title');
      if (keepOpen.indexOf(title) !== -1) return;
      panel.classList.add('panel-collapsed');
      panel.classList.remove('panel-open', 'panel-live');
    });
  }

  function proxyClick(id) {
    const el = document.getElementById(id);
    if (el && typeof el.click === 'function') el.click();
  }

  function cycleScene(step) {
    if (typeof DJ_CONFIG === 'undefined' || typeof VisualState === 'undefined') return;
    const scenes = DJ_CONFIG.scenes || [];
    if (!scenes.length) return;
    const i = Math.max(0, scenes.findIndex((s) => s.id === VisualState.scene));
    const next = scenes[(i + step + scenes.length) % scenes.length];
    const select = document.getElementById('sceneSelect');
    if (select) select.value = next.id;
    if (select && typeof Event === 'function' && typeof select.dispatchEvent === 'function') {
      select.dispatchEvent(new Event('change'));
    } else {
      VisualState.setScene(next.id);
      if (typeof HudController !== 'undefined') {
        if (HudController.renderSceneControls) HudController.renderSceneControls();
        if (HudController.sync) HudController.sync();
      }
    }
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    } catch (e) { /* iOS Safari has no Fullscreen API — button is hidden there */ }
  }

  /* Live quick bar — the phone "simple UI": the five actions that matter mid-set. */
  function buildQuickBar() {
    if (!document.body || typeof document.createElement !== 'function') return;
    const bar = document.createElement('div');
    bar.id = 'quickBar';
    bar.className = 'quick-bar';
    const items = [
      { id: 'qbMic',  label: 'MIC',  title: 'Start microphone',        act: () => proxyClick('startMicButton') },
      { id: 'qbFx',   label: 'FX',   title: 'Toggle Beat FX',          act: () => proxyClick('beatFxButton') },
      { id: 'qbPrev', label: '◀', title: 'Previous scene',        act: () => cycleScene(-1) },
      { id: 'qbNext', label: '▶', title: 'Next scene',            act: () => cycleScene(1) },
      { id: 'qbRnd',  label: 'RND',  title: 'Randomise visuals',       act: () => proxyClick('randomizeButton') },
      { id: 'qbFull', label: '⛶', title: 'Fullscreen',            act: toggleFullscreen }
    ];
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.id = it.id;
      b.textContent = it.label;
      if (typeof b.setAttribute === 'function') {
        b.setAttribute('aria-label', it.title);
        b.setAttribute('title', it.title);
      }
      if (typeof b.addEventListener === 'function') b.addEventListener('click', it.act);
      bar.appendChild(b);
    });
    document.body.appendChild(bar);
    /* iPhone Safari: no Fullscreen API — hide the button (installed PWA is already fullscreen). */
    if (!document.documentElement || !document.documentElement.requestFullscreen) {
      const fs = document.getElementById('qbFull');
      if (fs) fs.hidden = true;
    }
  }

  /* Bottom-sheet grip: tap to toggle half-height / near-full-height. */
  function buildSheetGrip() {
    const hud = document.getElementById('hud');
    if (!hud || typeof document.createElement !== 'function') return;
    const grip = document.createElement('button');
    grip.type = 'button';
    grip.className = 'sheet-grip';
    if (typeof grip.setAttribute === 'function') grip.setAttribute('aria-label', 'Expand or shrink the tools sheet');
    if (typeof grip.addEventListener === 'function') grip.addEventListener('click', () => {
      const tall = hud.classList.toggle('hud-tall');
      if (document.body && document.body.classList) document.body.classList.toggle('sheet-tall', tall);
    });
    if (typeof hud.insertBefore === 'function' && hud.firstChild) hud.insertBefore(grip, hud.firstChild);
    else hud.appendChild(grip);
  }

  /* Hide the quick bar while the HUD is open (belt for browsers without :has()). */
  function watchHudOpen() {
    const hud = document.getElementById('hud');
    const tab = document.getElementById('hudTab');
    if (!hud || !document.body) return;
    const sync = () => {
      const open = hud.classList.contains('open');
      document.body.classList.toggle('hud-open', open);
      if (!open) { hud.classList.remove('hud-tall'); document.body.classList.remove('sheet-tall'); }
    };
    if (tab && typeof tab.addEventListener === 'function') tab.addEventListener('click', () => setTimeout(sync, 0));
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('keydown', (e) => { if ((e.key || '').toLowerCase() === 'h') setTimeout(sync, 0); });
    }
    sync();
  }

  /* Stage gestures: pinch = camera zoom, two-finger horizontal drag = rotate. */
  function bindGestures() {
    const stage = document.getElementById('stage');
    if (!stage || typeof stage.addEventListener !== 'function') return;
    let dist = 0;
    let midX = 0;
    const measure = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const centreX = (t) => (t[0].clientX + t[1].clientX) / 2;
    stage.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 2) { dist = measure(e.touches); midX = centreX(e.touches); }
    }, { passive: true });
    stage.addEventListener('touchmove', (e) => {
      if (!e.touches || e.touches.length !== 2 || typeof VisualState === 'undefined') return;
      e.preventDefault();
      const d = measure(e.touches);
      const x = centreX(e.touches);
      VisualState.adjustCameraZoom((d - dist) * 0.12);
      VisualState.adjustCameraRotation((x - midX) * 0.12);
      dist = d;
      midX = x;
      if (typeof HudController !== 'undefined' && HudController.syncSliderValues) HudController.syncSliderValues();
    }, { passive: false });
  }

  function init() {
    try {
      if (!isTouch()) return;
      syncBodyClasses();
      capDpr();
      applyMobileDefaults();
      simplifyPanels();
      buildQuickBar();
      buildSheetGrip();
      watchHudOpen();
      bindGestures();
      if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
        window.addEventListener('resize', () => {
          syncBodyClasses();
          /* rotating into portrait phone should re-apply the light profile + DPR cap */
          if (isPhone()) { capDpr(); applyMobileDefaults(); }
        });
      }
    } catch (e) {
      if (typeof console !== 'undefined') console.error('[Maestro V mobile init]', e);
    }
  }

  return { init, isTouch, isPhone, applyMobileDefaults, cycleScene };
})();

if (typeof window !== 'undefined') {
  window.MaestroMobile = MaestroMobile;
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', () => MaestroMobile.init());
  }
}
