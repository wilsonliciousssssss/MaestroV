/* ============================================================
   MAESTRO V — Alpha Omega Collective brand layer (V107)
   Channel system: one accent colour drives the HUD chrome.
   Canonical values: Alpha Omega Collective tokens (tokens.css).
   No image dependencies — the pixel-glitch ΛΩ mark is drawn
   on canvas (header mark + per-channel favicon).
   ============================================================ */
const MaestroBrand = (() => {
  const STORE_KEY = 'maestrov.channel';
  const INK = '#0E0E10';
  const WHITE = '#F4F4F0';
  const GLITCH_CYAN = '#00DCFF';
  const GLITCH_MAGENTA = '#FF288F';

  const CHANNELS = [
    { id: 'lime',    label: 'Lime',    hex: '#C6F000', on: INK },
    { id: 'cobalt',  label: 'Cobalt',  hex: '#3E6BFF', on: WHITE },
    { id: 'orange',  label: 'Orange',  hex: '#FF5A2C', on: INK },
    { id: 'magenta', label: 'Magenta', hex: '#FF2E9A', on: INK },
    { id: 'teal',    label: 'Teal',    hex: '#7EE8D0', on: INK }
  ];

  let active = CHANNELS[0];

  function readStored() {
    try { return typeof localStorage !== 'undefined' ? localStorage.getItem(STORE_KEY) : null; }
    catch (e) { return null; }
  }
  function writeStored(v) {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(STORE_KEY, v); }
    catch (e) { /* private mode / file:// — channel just won't persist */ }
  }

  function soft(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  }

  function setRootProp(key, value) {
    try {
      const st = document.documentElement && document.documentElement.style;
      if (st && typeof st.setProperty === 'function') st.setProperty(key, value);
    } catch (e) { /* non-browser context */ }
  }

  /* Pixel-glitch ΛΩ on an ink square with a dashed channel frame
     flush to the edge — the Collective icon system, canvas-drawn. */
  function drawMark(cv, size, ch) {
    if (!cv || typeof cv.getContext !== 'function') return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    cv.width = size; cv.height = size;
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, size, size);
    const lw = Math.max(1, Math.round(size / 32));
    ctx.strokeStyle = ch.hex;
    ctx.lineWidth = lw;
    if (typeof ctx.setLineDash === 'function') ctx.setLineDash([Math.max(2, size / 16), Math.max(2, size / 16)]);
    ctx.strokeRect(lw / 2, lw / 2, size - lw, size - lw);
    if (typeof ctx.setLineDash === 'function') ctx.setLineDash([]);
    const f = Math.round(size * 0.5);
    ctx.font = '700 ' + f + 'px "Space Mono", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = size / 2, cy = size / 2 + size * 0.03, off = Math.max(1, size / 32);
    ctx.fillStyle = GLITCH_CYAN;    ctx.fillText('ΛΩ', cx - off, cy);
    ctx.fillStyle = GLITCH_MAGENTA; ctx.fillText('ΛΩ', cx + off, cy);
    ctx.fillStyle = ch.hex;         ctx.fillText('ΛΩ', cx, cy);
  }

  function refreshArt(ch) {
    drawMark(document.getElementById('brandMark'), 52, ch);
    try {
      const link = document.getElementById('favicon');
      const cv = document.createElement('canvas');
      drawMark(cv, 64, ch);
      if (link && typeof cv.toDataURL === 'function') link.href = cv.toDataURL('image/png');
    } catch (e) { /* favicon is decorative — never block boot on it */ }
    const meta = document.getElementById('themeColor');
    if (meta) meta.content = ch.hex;
  }

  function refreshDots() {
    const wrap = document.getElementById('channelDots');
    if (!wrap || !wrap.children) return;
    for (let i = 0; i < wrap.children.length; i++) {
      const b = wrap.children[i];
      if (!b || !b.classList) continue;
      const on = b.dataset ? b.dataset.ch === active.id : false;
      b.classList.toggle('active', on);
      if (typeof b.setAttribute === 'function') b.setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  function setChannel(id) {
    const ch = CHANNELS.find((c) => c.id === id) || CHANNELS[0];
    active = ch;
    setRootProp('--ao-ch', ch.hex);
    setRootProp('--ao-on-ch', ch.on);
    setRootProp('--ao-ch-soft', soft(ch.hex, 0.14));
    refreshArt(ch);
    refreshDots();
    writeStored(ch.id);
  }

  function renderDots() {
    const wrap = document.getElementById('channelDots');
    if (!wrap || typeof document.createElement !== 'function') return;
    CHANNELS.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ch-dot';
      if (!b.dataset) b.dataset = {};
      b.dataset.ch = c.id;
      if (typeof b.setAttribute === 'function') {
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-label', 'Channel: ' + c.label);
        b.setAttribute('title', c.label + ' ' + c.hex);
      }
      if (b.style && typeof b.style.setProperty === 'function') b.style.setProperty('--ch', c.hex);
      else if (b.style) b.style.background = c.hex;
      if (typeof b.addEventListener === 'function') b.addEventListener('click', () => setChannel(c.id));
      wrap.appendChild(b);
    });
  }

  function init() {
    try {
      renderDots();
      setChannel(readStored() || 'lime');
    } catch (e) {
      /* branding must never take the engine down */
      if (typeof console !== 'undefined') console.error('[Maestro V brand init]', e);
    }
  }

  return { init, setChannel, current: () => active, channels: CHANNELS };
})();

if (typeof window !== 'undefined') {
  window.MaestroBrand = MaestroBrand;
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', () => MaestroBrand.init());
  }
}
