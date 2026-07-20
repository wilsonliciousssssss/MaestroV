const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = __dirname;

const store = {};
const listeners = {};

const ctx = new Proxy({}, {
  get(target, prop) {
    if (prop in target) return target[prop];
    if (prop === 'canvas') return { width: 1280, height: 720 };
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => ({ addColorStop(){} });
    if (prop === 'measureText') return (text='') => ({ width: String(text).length * 12 });
    if (prop === 'globalAlpha') return 1;
    return (...args) => {};
  },
  set(target, prop, value) { target[prop] = value; return true; }
});

function createElementStub(tag = 'div', id = '') {
  const el = {
    id,
    tagName: String(tag).toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
    className: '',
    type: '',
    rows: 0,
    placeholder: '',
    children: [],
    options: [],
    selectedIndex: 0,
    width: 1280,
    height: 720,
    classList: {
      _set: new Set(id === 'hud' ? ['open'] : []),
      toggle(c, v) { if (v === undefined) { this._set.has(c) ? this._set.delete(c) : this._set.add(c); } else { v ? this._set.add(c) : this._set.delete(c); } },
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    },
    setAttribute() {},
    appendChild(child) {
      this.children.push(child);
      if (this.tagName === 'SELECT') {
        this.options.push(child);
        if (this.value === '') this.value = child.value;
      }
      return child;
    },
    append(...children) { children.forEach((c) => this.appendChild(c)); },
    addEventListener(type, fn) { listeners[(id || tag) + ':' + type] = fn; this['on' + type] = fn; },
    getContext() { return ctx; },
    setPointerCapture() {},
    releasePointerCapture() {}
  };
  return el;
}

function elStub(id = '') {
  if (!store[id]) {
    const lower = String(id).toLowerCase();
    const tag = lower.includes('canvas') ? 'canvas' : (lower.includes('select') ? 'select' : (lower.includes('input') || lower.includes('textarea') ? 'input' : 'div'));
    store[id] = createElementStub(tag, id);
  }
  return store[id];
}

global.window = global;
global.performance = { _t: 0, now() { this._t += 16; return this._t; } };
global.navigator = { mediaDevices: {} };
global.innerWidth = 1280;
global.innerHeight = 720;
global.devicePixelRatio = 1;
global.document = {
  fullscreenElement: null,
  documentElement: { requestFullscreen(){} },
  activeElement: null,
  getElementById: elStub,
  createElement: (tag) => createElementStub(tag),
  addEventListener() {},
  exitFullscreen() {}
};
global.addEventListener = () => {};
global.requestAnimationFrame = () => {};
global.MediaStream = function(tracks){ this.getTracks = () => tracks || []; this.getAudioTracks = () => tracks || []; };

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="\.\/([^"]+)"><\/script>/g)].map(m => m[1]);
for (const file of scripts) {
  const code = fs.readFileSync(path.join(ROOT, file.split('?')[0]), 'utf8');
  vm.runInThisContext(code, { filename: file });
}

HudController.init();
ThreeLayer.init();
PixiLayer.init();

['textProjectionToggleButton','textBehindSceneButton','textAboveSceneButton','textMessageInput','textFontSelect','textColourSlotSelect','textGlowColourSlotSelect','textAnimationSelect','textAlignSelect'].forEach((id) => {
  if (!document.getElementById(id)) throw new Error(`Missing ${id}`);
});

listeners['textProjectionToggleButton:click']();
if (!VisualState.textProjectionEnabled) throw new Error('Text projection toggle failed');

const animationSelect = document.getElementById('textAnimationSelect');
if (animationSelect.options.length !== 10) throw new Error('Expected 10 text animation modes');
animationSelect.value = 'glitch';
listeners['textAnimationSelect:change']();
if (VisualState.textAnimationMode !== 'glitch') throw new Error('Text animation mode update failed');

const alignSelect = document.getElementById('textAlignSelect');
alignSelect.value = 'right';
listeners['textAlignSelect:change']();
if (VisualState.textAlign !== 'right') throw new Error('Text align update failed');

['textScaleX','textScaleY','textAnimationSpeed'].forEach((controlId) => {
  if (!(controlId in VisualState.controls)) throw new Error(`Missing control ${controlId}`);
});
VisualState.setControl('textScaleX', 125);
VisualState.setControl('textScaleY', 80);
VisualState.setControl('textAnimationSpeed', 160);
if (VisualState.controls.textScaleX !== 125) throw new Error('Text scale X failed');
if (VisualState.controls.textScaleY !== 80) throw new Error('Text scale Y failed');
if (VisualState.controls.textAnimationSpeed !== 160) throw new Error('Text animation speed failed');

for (const mode of ['pulse', 'flicker', 'scan', 'drift', 'typeOn', 'wave', 'glitch', 'zoom', 'spin', 'bounce']) {
  VisualState.setTextAnimationMode(mode);
  PixiLayer.drawProjectedText(1280, 720, 1.35, { bass: .7, mid: .5, high: .4, beat: .6, bpm: 128 });
}

for (const sceneObj of DJ_CONFIG.scenes) {
  VisualState.setScene(sceneObj.id);
  HudController.renderSceneControls();
  ThreeLayer.update(1.2, { bass: .7, mid: .5, high: .4, beat: .6, bpm: 128 });
  PixiLayer.update(1.2, { bass: .7, mid: .5, high: .4, beat: .6, bpm: 128 });
  console.log('OK', sceneObj.id);
}
if (typeof MaestroBrand === 'undefined') throw new Error('MaestroBrand missing');
MaestroBrand.init();
if (MaestroBrand.current().id !== 'lime') throw new Error('Default channel should be lime');
MaestroBrand.setChannel('magenta');
if (MaestroBrand.current().hex !== '#FF2E9A') throw new Error('Channel switch failed');
MaestroBrand.setChannel('lime');
console.log('OK brand channel system');
if (typeof MaestroMobile === 'undefined') throw new Error('MaestroMobile missing');
if (typeof MaestroMobile.isPhone() !== 'boolean') throw new Error('isPhone should return boolean');
const prevPerf = VisualState.perfIndex, prevDensity = VisualState.controls.density;
VisualState.setControl('density', 200);
MaestroMobile.applyMobileDefaults(true);
if (VisualState.perfMode().name !== 'Lite') throw new Error('Mobile perf default should be Lite');
if (VisualState.controls.density > 110) throw new Error('Mobile density trim failed');
MaestroMobile.cycleScene(1);
VisualState.perfIndex = prevPerf; VisualState.setControl('density', prevDensity);
console.log('OK mobile responsive layer');
/* V112 asserts */
if (typeof BeatBus === 'undefined') throw new Error('BeatBus missing');
BeatBus.update({ beat: 0.9 });
if (!BeatBus.active || BeatBus.count !== 1) throw new Error('BeatBus edge detect failed');
BeatBus.update({ beat: 0.9 });
if (BeatBus.active) throw new Error('BeatBus should require a falling edge');
BeatBus.update({ beat: 0.1 });
BeatBus.update({ beat: 0.8 });
if (BeatBus.count !== 2) throw new Error('BeatBus count failed');
for (let i = 0; i < 40; i++) { if (VisualState.nextScene('random') === 'hybrid') throw new Error('nextScene returned hybrid'); }
VisualState.setScene('hybrid');
VisualState.transitionEnabled = true;
VisualState.lastSceneSwitchAt = -1e9;
if (VisualState.maybeAdvanceScene(1e9) !== false || VisualState.scene !== 'hybrid') throw new Error('auto transition must not leave hybrid');
VisualState.transitionEnabled = false;
/* exercise the kick paths of upgraded scenes with an active beat frame */
for (const id of ['orbit', 'dna', 'obsidian', 'laser', 'iris', 'firework', 'missile', 'slash']) {
  BeatBus.update({ beat: 0.1 });
  BeatBus.update({ beat: 0.95 });
  VisualState.setScene(id);
  ThreeLayer.update(2.2, { bass: .8, mid: .5, high: .7, beat: .95, bpm: 128 });
  PixiLayer.update(2.2, { bass: .8, mid: .5, high: .7, beat: .95, bpm: 128 });
}
console.log('OK V112 upgrades (hybrid guard, BeatBus, kick paths)');
/* V113: run the refined scenes across a mode-change with active beats */
let _drawErrs = 0; const _origErr = console.error; console.error = (...a) => { if (String(a[0]).includes('Scene draw skipped')) _drawErrs++; _origErr.apply(console, a); };
for (const id of ['orbit', 'chladni', 'laser']) {
  VisualState.setScene(id);
  for (let f = 0; f < 8; f++) {
    BeatBus.update({ beat: f % 2 ? 0.95 : 0.1 });
    PixiLayer.update(2 + f, { bass: .7, mid: .5, high: .6, beat: f % 2 ? 0.95 : 0.1, bpm: 128 });
  }
}
console.error = _origErr;
if (_drawErrs > 0) throw new Error('A refined scene threw during draw (' + _drawErrs + ' skips) — check chladni/orbit/laser');
console.log('OK V113 refined scenes (chladni metamorphosis, orbit, laser) — 0 draw skips');
console.log('Maestro V runtime smoke test passed');
