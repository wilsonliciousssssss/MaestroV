const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.join(__dirname, '..');

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
console.log('Maestro V (V107) runtime smoke test passed');
