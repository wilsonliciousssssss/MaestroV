const HudController = {
  sliders: new Map(),
  layerButtons: new Map(),

  init() {
    this.cache();
    this.populateScenes();
    this.populateTransitionType();
    this.populateTextFonts();
    this.populateTextAnimations();
    this.renderHybridLayers();
    this.renderControlGroup('visualControls', DJ_CONFIG.globalControls);
    this.renderControlGroup('audioControls', DJ_CONFIG.audioControls);
    this.renderControlGroup('colorControls', DJ_CONFIG.colorControls);
    this.renderControlGroup('textControls', DJ_CONFIG.textControls);
    this.renderSceneControls();
    this.initCollapsiblePanels();
    this.bindButtons();
    this.bindKeyboard();
    this.bindCameraControls();
    this.sync();
  },

  cache() {
    this.hud = document.getElementById('hud');
    this.hudTab = document.getElementById('hudTab');
    this.sceneSelect = document.getElementById('sceneSelect');
    this.status = document.getElementById('controlStatus');
    this.liveSceneName = document.getElementById('liveSceneName');
    this.liveAudioState = document.getElementById('liveAudioState');
    this.livePerfState = document.getElementById('livePerfState');
    this.stage = document.getElementById('stage');
    this.cameraDragActive = false;
    this.cameraDragLastX = 0;
    this.transitionTypeSelect = document.getElementById('transitionTypeSelect');
    this.transitionSecondsInput = document.getElementById('transitionSecondsInput');
    this.sceneMixerControls = document.getElementById('sceneMixerControls');
    this.textProjectionToggleButton = document.getElementById('textProjectionToggleButton');
    this.textBehindSceneButton = document.getElementById('textBehindSceneButton');
    this.textAboveSceneButton = document.getElementById('textAboveSceneButton');
    this.textMessageInput = document.getElementById('textMessageInput');
    this.textFontSelect = document.getElementById('textFontSelect');
    this.textColourSlotSelect = document.getElementById('textColourSlotSelect');
    this.textGlowColourSlotSelect = document.getElementById('textGlowColourSlotSelect');
    this.textAnimationSelect = document.getElementById('textAnimationSelect');
    this.textAlignSelect = document.getElementById('textAlignSelect');
    this.customColourInputs = {
      a: document.getElementById('customColorA'),
      b: document.getElementById('customColorB'),
      c: document.getElementById('customColorC')
    };
    this.customColourBoxes = {
      a: document.getElementById('customColorBoxA'),
      b: document.getElementById('customColorBoxB'),
      c: document.getElementById('customColorBoxC')
    };
    this.automationToggleButton = document.getElementById('automationToggleButton');
    this.automationTriggerEventButton = document.getElementById('automationTriggerEventButton');
    this.automationRandomiseButton = document.getElementById('automationRandomiseButton');
    this.automationSceneEveryInput = document.getElementById('automationSceneEveryInput');
    this.automationEventEveryInput = document.getElementById('automationEventEveryInput');
    this.automationRandomEveryInput = document.getElementById('automationRandomEveryInput');
    this.automationReadout = document.getElementById('automationReadout');
    this.automationBeatCounter = document.getElementById('automationBeatCounter');
    this.monitorToggleButton = document.getElementById('monitorToggleButton');
    this.runtimeCleanupButton = document.getElementById('runtimeCleanupButton');
    this.monitorFps = document.getElementById('monitorFps');
    this.monitorFrameMs = document.getElementById('monitorFrameMs');
    this.monitorScene = document.getElementById('monitorScene');
    this.monitorHybrid = document.getElementById('monitorHybrid');
    this.monitorAudio = document.getElementById('monitorAudio');
    this.monitorAudioSource = document.getElementById('monitorAudioSource');
    this.monitorFirework = document.getElementById('monitorFirework');
    this.monitorMissile = document.getElementById('monitorMissile');
    this.monitorAtomic = document.getElementById('monitorAtomic');
    this.monitorAutomation = document.getElementById('monitorAutomation');
    this.sceneUiControls = document.getElementById('sceneUiControls');
    this.fireworkShapeSelect = null;
    this.fireworkStageSelect = null;
    this.fireworkRandomButton = null;
    this.fireworkShapeRandomButton = null;
    this.fireworkTriggerButton = null;
    this.irisPresetSelect = null;
    this.irisRandomButton = null;
    this.atomicPresetSelect = null;
    this.atomicPresetButtons = [];
    this.atomicRandomButton = null;
    this.atomicEventButton = null;
    this.mobiusPresetSelect = null;
    this.mobiusPresetButtons = [];
    this.codeGlitchPresetSelect = null;
    this.codeGlitchPresetButtons = [];
    this.codeGlitchEventButton = null;
    this.codeGlitchPresetSelect = null;
    this.codeGlitchPresetButtons = [];
    this.codeGlitchEventButton = null;
    this.missileBarrageSelect = null;
    this.missileSplitSelect = null;
    this.missileExplosionSelect = null;
    this.missileTypeSelect = null;
  },

  populateScenes() {
    this.sceneSelect.innerHTML = '';
    DJ_CONFIG.scenes.forEach((scene, index) => {
      const option = document.createElement('option');
      option.value = scene.id;
      option.textContent = `${index + 1}. ${scene.label}`;
      this.sceneSelect.appendChild(option);
    });
    this.sceneSelect.value = VisualState.scene;
  },

  populateTransitionType() {
    if (this.transitionTypeSelect) this.transitionTypeSelect.value = VisualState.transitionType;
    if (this.transitionSecondsInput) this.transitionSecondsInput.value = VisualState.transitionSeconds;
  },

  populateTextFonts() {
    if (this.textFontSelect) {
      this.textFontSelect.innerHTML = '';
      DJ_CONFIG.textFonts.forEach((font) => {
        const option = document.createElement('option');
        option.value = font.id;
        option.textContent = font.label;
        this.textFontSelect.appendChild(option);
      });
      this.textFontSelect.value = VisualState.textFont;
    }
    if (this.textColourSlotSelect) this.textColourSlotSelect.value = VisualState.textColourSlot;
    if (this.textGlowColourSlotSelect) this.textGlowColourSlotSelect.value = VisualState.textGlowColourSlot;
    if (this.textMessageInput) this.textMessageInput.value = VisualState.textMessage;
  },

  populateTextAnimations() {
    if (this.textAnimationSelect) {
      this.textAnimationSelect.innerHTML = '';
      DJ_CONFIG.textAnimationModes.forEach((mode) => {
        const option = document.createElement('option');
        option.value = mode.id;
        option.textContent = mode.label;
        this.textAnimationSelect.appendChild(option);
      });
      this.textAnimationSelect.value = VisualState.textAnimationMode;
    }
    if (this.textAlignSelect) this.textAlignSelect.value = VisualState.textAlign;
  },

  renderHybridLayers() {
    if (!this.sceneMixerControls) return;
    this.sceneMixerControls.innerHTML = '';
    this.layerButtons.clear();
    DJ_CONFIG.scenes.filter((scene) => scene.id !== 'hybrid').forEach((scene) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'toggle-chip';
      button.textContent = scene.label;
      button.addEventListener('click', () => {
        VisualState.toggleHybridLayer(scene.id);
        this.syncLayerButtons();
        this.setStatus(`${scene.label}: ${VisualState.hybridLayers[scene.id] ? 'on' : 'off'} in hybrid mix`);
      });
      this.layerButtons.set(scene.id, button);
      this.sceneMixerControls.appendChild(button);
    });
    this.syncLayerButtons();
  },

  renderControlGroup(containerId, controls) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    controls.forEach((control) => container.appendChild(this.createSlider(control)));
  },

  renderSceneControls() {
    const controls = DJ_CONFIG.sceneControls[VisualState.scene] || [];
    this.renderSceneUiControls();
    this.renderControlGroup('sceneControls', controls);
  },

  renderSceneUiControls() {
    const container = this.sceneUiControls;
    if (!container) return;
    container.innerHTML = '';
    this.fireworkShapeSelect = null;
    this.fireworkStageSelect = null;
    this.fireworkRandomButton = null;
    this.fireworkShapeRandomButton = null;
    this.fireworkTriggerButton = null;
    this.irisPresetSelect = null;
    this.irisRandomButton = null;
    this.atomicPresetSelect = null;
    this.atomicPresetButtons = [];
    this.atomicRandomButton = null;
    this.atomicEventButton = null;
    this.mobiusPresetSelect = null;
    this.mobiusPresetButtons = [];
    this.codeGlitchPresetSelect = null;
    this.codeGlitchPresetButtons = [];
    this.codeGlitchEventButton = null;
    this.codeGlitchPresetSelect = null;
    this.codeGlitchPresetButtons = [];
    this.codeGlitchEventButton = null;
    this.missileBarrageSelect = null;
    this.missileSplitSelect = null;
    this.missileExplosionSelect = null;
    this.missileTypeSelect = null;

    if (VisualState.scene === 'codeglitch') {
      this.renderCodeGlitchSceneUi(container);
      return;
    }

    if (VisualState.scene === 'iris') {
      this.renderIrisSceneUi(container);
      return;
    }

    if (VisualState.scene === 'atomic') {
      this.renderAtomicSceneUi(container);
      return;
    }

    if (VisualState.scene === 'mobius') {
      this.renderMobiusSceneUi(container);
      return;
    }

    if (VisualState.scene === 'missile') {
      this.renderMissileSceneUi(container);
      return;
    }

    if (VisualState.scene !== 'firework') return;

    const module = document.createElement('div');
    module.className = 'scene-ui-module';

    const title = document.createElement('div');
    title.className = 'module-title';
    title.textContent = 'Firework Scene UI';

    const note = document.createElement('div');
    note.className = 'panel-note';
    note.textContent = 'Direct scene controls for multistage fireworks, burst shape mode, one-stage / two-stage / three-stage random firework variations, full random-stage mode, dust behaviour, and manual triggering.';

    const selectGrid = document.createElement('div');
    selectGrid.className = 'scene-ui-grid';

    const stageWrap = document.createElement('div');
    const stageLabel = document.createElement('label');
    stageLabel.setAttribute('for', 'fireworkStageSelect');
    stageLabel.textContent = 'Multistage Fireworks';
    const stageSelect = document.createElement('select');
    stageSelect.id = 'fireworkStageSelect';
    [
      { value: '0', label: 'Random Stage' },
      { value: '1', label: 'Single Stage' },
      { value: '2', label: 'Two Stage' },
      { value: '3', label: 'Three Stage' }
    ].forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      stageSelect.appendChild(option);
    });
    stageSelect.value = String(Math.round(VisualState.controls.fireworkStageDepth ?? 0));
    stageSelect.addEventListener('change', () => {
      VisualState.setControl('fireworkStageDepth', Number(stageSelect.value));
      this.syncSliderValues();
      this.setStatus(`Multistage Fireworks: ${stageSelect.options[stageSelect.selectedIndex]?.text || stageSelect.value}`);
    });
    stageWrap.append(stageLabel, stageSelect);

    const shapeWrap = document.createElement('div');
    const shapeLabel = document.createElement('label');
    shapeLabel.setAttribute('for', 'fireworkShapeSelect');
    shapeLabel.textContent = 'Burst Shape Mode';
    const shapeSelect = document.createElement('select');
    shapeSelect.id = 'fireworkShapeSelect';
    [
      { value: '0', label: 'Random' },
      { value: '1', label: 'Sphere' },
      { value: '2', label: 'Fan' },
      { value: '3', label: 'Chrysanthemum' },
      { value: '4', label: 'Spiral' }
    ].forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      shapeSelect.appendChild(option);
    });
    shapeSelect.value = String(Math.round(VisualState.controls.fireworkShapeMode || 0));
    shapeSelect.addEventListener('change', () => {
      VisualState.setControl('fireworkShapeMode', Number(shapeSelect.value));
      this.syncSliderValues();
      this.setStatus(`Burst Shape Mode: ${shapeSelect.options[shapeSelect.selectedIndex]?.text || shapeSelect.value}`);
    });
    shapeWrap.append(shapeLabel, shapeSelect);
    selectGrid.append(stageWrap, shapeWrap);

    const buttonGrid = document.createElement('div');
    buttonGrid.className = 'button-grid';
    const randomButton = document.createElement('button');
    randomButton.type = 'button';
    randomButton.textContent = 'Random Fireworks';
    randomButton.addEventListener('click', () => {
      this.randomizeFireworkControls();
    });
    const randomStage1Button = document.createElement('button');
    randomStage1Button.type = 'button';
    randomStage1Button.textContent = 'Random 1 Stage';
    randomStage1Button.addEventListener('click', () => {
      this.randomizeFireworkControls(1);
    });
    const randomStage2Button = document.createElement('button');
    randomStage2Button.type = 'button';
    randomStage2Button.textContent = 'Random 2 Stage';
    randomStage2Button.addEventListener('click', () => {
      this.randomizeFireworkControls(2);
    });
    const randomStage3Button = document.createElement('button');
    randomStage3Button.type = 'button';
    randomStage3Button.textContent = 'Random 3 Stage';
    randomStage3Button.addEventListener('click', () => {
      this.randomizeFireworkControls(3);
    });
    const randomStageModeButton = document.createElement('button');
    randomStageModeButton.type = 'button';
    randomStageModeButton.textContent = 'Random Stage Mode';
    randomStageModeButton.addEventListener('click', () => {
      VisualState.setControl('fireworkStageDepth', 0);
      if (this.fireworkStageSelect) this.fireworkStageSelect.value = '0';
      this.syncSliderValues();
      this.setStatus('Multistage Fireworks: Random Stage');
    });
    const shapeRandomButton = document.createElement('button');
    shapeRandomButton.type = 'button';
    shapeRandomButton.textContent = 'Random Shape';
    shapeRandomButton.addEventListener('click', () => {
      const next = 1 + Math.floor(Math.random() * 4);
      VisualState.setControl('fireworkShapeMode', next);
      if (this.fireworkShapeSelect) this.fireworkShapeSelect.value = String(next);
      this.syncSliderValues();
      this.setStatus(`Burst Shape Mode: ${this.fireworkShapeSelect?.options[this.fireworkShapeSelect.selectedIndex]?.text || next}`);
    });
    const triggerButton = document.createElement('button');
    triggerButton.type = 'button';
    triggerButton.textContent = 'Trigger Firework';
    triggerButton.addEventListener('click', () => {
      if (typeof FireworkBurstScene !== 'undefined' && FireworkBurstScene && typeof FireworkBurstScene.queueManualBurst === 'function') {
        FireworkBurstScene.queueManualBurst();
        this.setStatus('Manual firework triggered');
      }
    });
    buttonGrid.append(randomButton, randomStage1Button, randomStage2Button, randomStage3Button, randomStageModeButton, shapeRandomButton, triggerButton);

    module.append(title, note, selectGrid, buttonGrid);
    container.appendChild(module);
    this.fireworkShapeSelect = shapeSelect;
    this.fireworkStageSelect = stageSelect;
    this.fireworkRandomButton = randomButton;
    this.fireworkShapeRandomButton = shapeRandomButton;
    this.fireworkTriggerButton = triggerButton;
  },


  renderMissileSceneUi(container) {
    const module = document.createElement('div');
    module.className = 'scene-ui-module';

    const title = document.createElement('div');
    title.className = 'module-title';
    title.textContent = 'Missile Scene UI';

    const note = document.createElement('div');
    note.className = 'panel-note';
    note.textContent = 'Barrage mode, split mode, explosion mode, missile type modes, cluster splits, EMP pulses, debris, and manual missile / mega-missile triggering for Pixel Missile Barrage.';

    const selectGrid = document.createElement('div');
    selectGrid.className = 'scene-ui-grid';

    const barrageWrap = document.createElement('div');
    const barrageLabel = document.createElement('label');
    barrageLabel.setAttribute('for', 'missileBarrageSelect');
    barrageLabel.textContent = 'Barrage Mode';
    const barrageSelect = document.createElement('select');
    barrageSelect.id = 'missileBarrageSelect';
    [
      { value: '0', label: 'Random Barrage' },
      { value: '1', label: 'Vertical Barrage' },
      { value: '2', label: 'Side Barrage' },
      { value: '3', label: 'Crossfire Barrage' }
    ].forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      barrageSelect.appendChild(option);
    });
    barrageSelect.value = String(Math.round(VisualState.controls.missileBarrageMode ?? 0));
    barrageSelect.addEventListener('change', () => {
      VisualState.setControl('missileBarrageMode', Number(barrageSelect.value));
      this.syncSliderValues();
      this.setStatus(`Barrage Mode: ${barrageSelect.options[barrageSelect.selectedIndex]?.text || barrageSelect.value}`);
    });
    barrageWrap.append(barrageLabel, barrageSelect);

    const splitWrap = document.createElement('div');
    const splitLabel = document.createElement('label');
    splitLabel.setAttribute('for', 'missileSplitSelect');
    splitLabel.textContent = 'Split Mode';
    const splitSelect = document.createElement('select');
    splitSelect.id = 'missileSplitSelect';
    [
      { value: '0', label: 'Random Split' },
      { value: '1', label: 'Rare Split' },
      { value: '2', label: 'Normal Split' },
      { value: '3', label: 'Heavy Split' }
    ].forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      splitSelect.appendChild(option);
    });
    splitSelect.value = String(Math.round(VisualState.controls.missileSplitMode ?? 2));
    splitSelect.addEventListener('change', () => {
      VisualState.setControl('missileSplitMode', Number(splitSelect.value));
      this.syncSliderValues();
      this.setStatus(`Split Mode: ${splitSelect.options[splitSelect.selectedIndex]?.text || splitSelect.value}`);
    });
    splitWrap.append(splitLabel, splitSelect);

    const explosionWrap = document.createElement('div');
    const explosionLabel = document.createElement('label');
    explosionLabel.setAttribute('for', 'missileExplosionSelect');
    explosionLabel.textContent = 'Explosion Mode';
    const explosionSelect = document.createElement('select');
    explosionSelect.id = 'missileExplosionSelect';
    [
      { value: '0', label: 'Random Explosion' },
      { value: '1', label: 'EMP Rings' },
      { value: '2', label: 'Burst Sphere' },
      { value: '3', label: 'Shrapnel' },
      { value: '4', label: 'Ring Pulse' }
    ].forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      explosionSelect.appendChild(option);
    });
    explosionSelect.value = String(Math.round(VisualState.controls.missileExplosionMode ?? 0));
    explosionSelect.addEventListener('change', () => {
      VisualState.setControl('missileExplosionMode', Number(explosionSelect.value));
      this.syncSliderValues();
      this.setStatus(`Explosion Mode: ${explosionSelect.options[explosionSelect.selectedIndex]?.text || explosionSelect.value}`);
    });
    explosionWrap.append(explosionLabel, explosionSelect);


    const typeWrap = document.createElement('div');
    const typeLabel = document.createElement('label');
    typeLabel.setAttribute('for', 'missileTypeSelect');
    typeLabel.textContent = 'Missile Type';
    const typeSelect = document.createElement('select');
    typeSelect.id = 'missileTypeSelect';
    [
      { value: '0', label: 'Random Type' },
      { value: '1', label: 'Standard' },
      { value: '2', label: 'Fast Dart' },
      { value: '3', label: 'Heavy Rocket' },
      { value: '4', label: 'Cluster Missile' },
      { value: '5', label: 'Guided Missile' }
    ].forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      typeSelect.appendChild(option);
    });
    typeSelect.value = String(Math.round(VisualState.controls.missileTypeMode ?? 0));
    typeSelect.addEventListener('change', () => {
      VisualState.setControl('missileTypeMode', Number(typeSelect.value));
      this.syncSliderValues();
      this.setStatus(`Missile Type: ${typeSelect.options[typeSelect.selectedIndex]?.text || typeSelect.value}`);
    });
    typeWrap.append(typeLabel, typeSelect);

    selectGrid.append(barrageWrap, splitWrap, explosionWrap, typeWrap);

    const buttonGrid = document.createElement('div');
    buttonGrid.className = 'button-grid';

    const randomButton = document.createElement('button');
    randomButton.type = 'button';
    randomButton.textContent = 'Random Missiles';
    randomButton.addEventListener('click', () => this.randomizeMissileControls());

    const barrageButton = document.createElement('button');
    barrageButton.type = 'button';
    barrageButton.textContent = 'Random Barrage';
    barrageButton.addEventListener('click', () => {
      const next = Math.floor(Math.random() * 4);
      VisualState.setControl('missileBarrageMode', next);
      if (this.missileBarrageSelect) this.missileBarrageSelect.value = String(next);
      this.syncSliderValues();
      this.setStatus(`Barrage Mode: ${this.missileBarrageSelect?.options[this.missileBarrageSelect.selectedIndex]?.text || next}`);
    });


    const typeButton = document.createElement('button');
    typeButton.type = 'button';
    typeButton.textContent = 'Random Type';
    typeButton.addEventListener('click', () => {
      const next = Math.floor(Math.random() * 6);
      VisualState.setControl('missileTypeMode', next);
      if (this.missileTypeSelect) this.missileTypeSelect.value = String(next);
      this.syncSliderValues();
      this.setStatus(`Missile Type: ${this.missileTypeSelect?.options[this.missileTypeSelect.selectedIndex]?.text || next}`);
    });

    const explosionButton = document.createElement('button');
    explosionButton.type = 'button';
    explosionButton.textContent = 'Random Explosion';
    explosionButton.addEventListener('click', () => {
      const next = Math.floor(Math.random() * 5);
      VisualState.setControl('missileExplosionMode', next);
      if (this.missileExplosionSelect) this.missileExplosionSelect.value = String(next);
      this.syncSliderValues();
      this.setStatus(`Explosion Mode: ${this.missileExplosionSelect?.options[this.missileExplosionSelect.selectedIndex]?.text || next}`);
    });

    const triggerButton = document.createElement('button');
    triggerButton.type = 'button';
    triggerButton.textContent = 'Trigger Missile';
    triggerButton.addEventListener('click', () => {
      if (typeof PixelMissileScene !== 'undefined' && PixelMissileScene && typeof PixelMissileScene.queueManualMissile === 'function') {
        PixelMissileScene.queueManualMissile();
        this.setStatus('Manual missile triggered');
      }
    });

        const megaTriggerButton = document.createElement('button');
    megaTriggerButton.type = 'button';
    megaTriggerButton.textContent = 'Trigger Mega Missile';
    megaTriggerButton.addEventListener('click', () => {
      if (typeof PixelMissileScene !== 'undefined' && PixelMissileScene && typeof PixelMissileScene.queueMegaMissile === 'function') {
        PixelMissileScene.queueMegaMissile();
        this.setStatus('Mega missile triggered');
      }
    });

    buttonGrid.append(randomButton, barrageButton, typeButton, explosionButton, triggerButton, megaTriggerButton);
    module.append(title, note, selectGrid, buttonGrid);
    container.appendChild(module);

    this.missileBarrageSelect = barrageSelect;
    this.missileSplitSelect = splitSelect;
    this.missileExplosionSelect = explosionSelect;
    this.missileTypeSelect = typeSelect;
  },

  randomizeMissileControls() {
    const ids = ['missileRate', 'missileCount', 'fragmentCount', 'explosionSize', 'missileScatter', 'missileTrailLength', 'missileGuidance', 'missileReticleSize', 'missileEngineFlicker', 'launchShockwave', 'targetLockStrength', 'impactWarningPulse', 'megaMissilePower', 'clusterSplitAmount', 'heavyRocketChance', 'debrisAmount', 'debrisGravity', 'debrisLifetime', 'empRadius', 'empRingCount', 'interferenceStrength'];
    ids.forEach((id) => {
      const control = (DJ_CONFIG.sceneControls.missile || []).find((item) => item.id === id);
      if (!control) return;
      const span = control.max - control.min;
      const raw = control.min + Math.random() * span;
      const stepped = Math.round(raw / control.step) * control.step;
      VisualState.setControl(id, Number(stepped.toFixed(2)));
    });
    VisualState.setControl('missileBarrageMode', Math.floor(Math.random() * 4));
    VisualState.setControl('missileSplitMode', Math.floor(Math.random() * 4));
    VisualState.setControl('missileExplosionMode', Math.floor(Math.random() * 5));
    VisualState.setControl('missileTypeMode', Math.floor(Math.random() * 6));
    if (this.missileBarrageSelect) this.missileBarrageSelect.value = String(Math.round(VisualState.controls.missileBarrageMode ?? 0));
    if (this.missileSplitSelect) this.missileSplitSelect.value = String(Math.round(VisualState.controls.missileSplitMode ?? 2));
    if (this.missileExplosionSelect) this.missileExplosionSelect.value = String(Math.round(VisualState.controls.missileExplosionMode ?? 0));
    if (this.missileTypeSelect) this.missileTypeSelect.value = String(Math.round(VisualState.controls.missileTypeMode ?? 0));
    this.syncSliderValues();
    this.setStatus('Missile scene randomised');
  },


  renderCodeGlitchSceneUi(container) {
    const module = document.createElement('div');
    module.className = 'scene-ui-module codeglitch-ui-module';

    const title = document.createElement('div');
    title.className = 'module-title';
    title.textContent = 'Code Glitch Scene UI';

    const note = document.createElement('div');
    note.className = 'panel-note';
    note.textContent = 'Preset-driven coding terminal scene with manual glitch, breach and corrupt-core triggers, cursor/scan effects, richer snippets and hybrid-safe performance caps.';

    const selectGrid = document.createElement('div');
    selectGrid.className = 'scene-ui-grid';

    const presetWrap = document.createElement('div');
    const presetLabel = document.createElement('label');
    presetLabel.setAttribute('for', 'codeGlitchPresetSelect');
    presetLabel.textContent = 'Glitch Preset';
    const presetSelect = document.createElement('select');
    presetSelect.id = 'codeGlitchPresetSelect';
    const presetOptions = [
      { value: 'clean', label: 'Clean Terminal' },
      { value: 'rain', label: 'Hacker Rain' },
      { value: 'breach', label: 'System Breach' },
      { value: 'network', label: 'Data Network' },
      { value: 'corrupt', label: 'Corrupt Core' }
    ];
    presetOptions.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      presetSelect.appendChild(option);
    });
    presetSelect.value = 'breach';
    presetSelect.addEventListener('change', () => this.applyCodeGlitchPreset(presetSelect.value));
    presetWrap.append(presetLabel, presetSelect);

    const infoWrap = document.createElement('div');
    const infoLabel = document.createElement('label');
    infoLabel.textContent = 'Audio Mapping';
    const info = document.createElement('div');
    info.className = 'panel-note compact-note';
    info.textContent = 'Low = terminal pulse & sweep bands · Mid = network reroute & panel drift · High = cursor flicker, RGB split and scrambling.';
    infoWrap.append(infoLabel, info);

    selectGrid.append(presetWrap, infoWrap);

    const presetGrid = document.createElement('div');
    presetGrid.className = 'codeglitch-preset-grid';
    const presetButtons = [];
    presetOptions.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'codeglitch-preset-button';
      button.textContent = item.label;
      button.addEventListener('click', () => this.applyCodeGlitchPreset(item.value));
      presetGrid.appendChild(button);
      presetButtons.push({ id: item.value, button });
    });

    const actionGrid = document.createElement('div');
    actionGrid.className = 'button-grid scene-action-grid';

    const randomButton = document.createElement('button');
    randomButton.type = 'button';
    randomButton.textContent = 'Random Glitch';
    randomButton.addEventListener('click', () => this.randomizeCodeGlitchControls());

    const glitchButton = document.createElement('button');
    glitchButton.type = 'button';
    glitchButton.textContent = 'Glitch Burst';
    glitchButton.addEventListener('click', () => this.triggerCodeGlitchEvent('glitch'));

    const breachButton = document.createElement('button');
    breachButton.type = 'button';
    breachButton.textContent = 'System Breach';
    breachButton.addEventListener('click', () => this.triggerCodeGlitchEvent('breach'));

    const coreButton = document.createElement('button');
    coreButton.type = 'button';
    coreButton.textContent = 'Corrupt Core';
    coreButton.addEventListener('click', () => this.triggerCodeGlitchEvent('core'));

    actionGrid.append(randomButton, glitchButton, breachButton, coreButton);
    module.append(title, note, selectGrid, presetGrid, actionGrid);
    container.appendChild(module);

    this.codeGlitchPresetSelect = presetSelect;
    this.codeGlitchPresetButtons = presetButtons;
    this.codeGlitchEventButton = glitchButton;
    this.updateCodeGlitchPresetButtons('breach');
  },

  updateCodeGlitchPresetButtons(activePreset) {
    (this.codeGlitchPresetButtons || []).forEach((entry) => {
      if (!entry || !entry.button) return;
      entry.button.classList.toggle('active', entry.id === activePreset);
    });
  },

  applyCodeGlitchPreset(preset) {
    if (typeof CodeGlitchScene !== 'undefined' && CodeGlitchScene && typeof CodeGlitchScene.applyPreset === 'function') {
      CodeGlitchScene.applyPreset(preset);
    }
    this.syncSliderValues();
    if (this.codeGlitchPresetSelect) this.codeGlitchPresetSelect.value = preset;
    this.updateCodeGlitchPresetButtons(preset);
    this.setStatus(`Code Glitch preset: ${preset}`);
  },

  triggerCodeGlitchEvent(type) {
    if (typeof CodeGlitchScene !== 'undefined' && CodeGlitchScene && typeof CodeGlitchScene.queueEvent === 'function') {
      CodeGlitchScene.queueEvent(type, type === 'breach' ? 1.25 : type === 'core' ? 1.4 : 0.95);
    }
    if (type === 'breach') {
      VisualState.setControl('codeGlitchAmount', Math.min(100, (VisualState.controls.codeGlitchAmount || 52) + 10));
      VisualState.setControl('codeRgbSplit', Math.min(100, (VisualState.controls.codeRgbSplit || 28) + 10));
      VisualState.setControl('codeNoiseBlocks', Math.min(120, (VisualState.controls.codeNoiseBlocks || 34) + 10));
    }
    this.syncSliderValues();
    this.setStatus(`Code Glitch event: ${type}`);
  },

  randomizeCodeGlitchControls() {
    const ranges = {
      codePanelCount: [2, 8], codeStreamCount: [40, 180], codeScrollSpeed: [0.6, 3.8],
      codeSymbolSize: [10, 18], codeGlitchAmount: [10, 96], codeLinkDensity: [10, 70],
      codeWindowJitter: [0, 88], codeRgbSplit: [0, 90], codeNoiseBlocks: [8, 100],
      codeMainFocus: [0, 90], codeCursorAmount: [8, 92], codeScanlineStrength: [8, 92],
      codeBreachPulse: [8, 96], codeBinaryRain: [10, 92], codeSnippetDensity: [12, 86],
      codePanelOpacity: [38, 94], codeGridStrength: [8, 86], codeCorruptionSpread: [8, 96],
      codeMode: [0, 4]
    };
    Object.entries(ranges).forEach(([id, [min, max]]) => {
      const step = id === 'codeScrollSpeed' ? 0.1 : 1;
      const raw = min + Math.random() * (max - min);
      const value = Math.round(raw / step) * step;
      VisualState.setControl(id, Number(value.toFixed(2)));
    });
    if (typeof CodeGlitchScene !== 'undefined' && CodeGlitchScene && typeof CodeGlitchScene.reset === 'function') CodeGlitchScene.reset();
    this.syncSliderValues();
    this.updateCodeGlitchPresetButtons('');
    this.setStatus('Code Glitch scene randomised');
  },

  renderMobiusSceneUi(container) {
    const module = document.createElement('div');
    module.className = 'scene-ui-module mobius-ui-module';

    const title = document.createElement('div');
    title.className = 'module-title';
    title.textContent = 'Mobius Galaxy Scene UI';

    const note = document.createElement('div');
    note.className = 'panel-note';
    note.textContent = 'Preset-driven 3D ribbon, surface grid, wormhole gravity, signal particles, galaxy dust, and audio-reactive topology motion.';

    const selectGrid = document.createElement('div');
    selectGrid.className = 'scene-ui-grid';

    const presetWrap = document.createElement('div');
    const presetLabel = document.createElement('label');
    presetLabel.setAttribute('for', 'mobiusPresetSelect');
    presetLabel.textContent = 'Mobius Preset';
    const presetSelect = document.createElement('select');
    presetSelect.id = 'mobiusPresetSelect';
    const presetOptions = [
      { value: 'topology', label: 'Clean Topology' },
      { value: 'wormhole', label: 'Galaxy Wormhole' },
      { value: 'data', label: 'Data Mobius' },
      { value: 'neon', label: 'Neon Ribbon' },
      { value: 'chaos', label: 'Chaos Twist' }
    ];
    presetOptions.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      presetSelect.appendChild(option);
    });
    presetSelect.value = 'wormhole';
    presetSelect.addEventListener('change', () => this.applyMobiusPreset(presetSelect.value));
    presetWrap.append(presetLabel, presetSelect);

    const infoWrap = document.createElement('div');
    const infoLabel = document.createElement('label');
    infoLabel.textContent = 'Audio Mapping';
    const info = document.createElement('div');
    info.className = 'panel-note compact-note';
    info.textContent = 'Low = gravity/ribbon scale · Mid = twist, rotation & signal speed · High = edge shimmer, sparks & RGB-like flicker.';
    infoWrap.append(infoLabel, info);

    selectGrid.append(presetWrap, infoWrap);

    const presetGrid = document.createElement('div');
    presetGrid.className = 'mobius-preset-grid';
    const presetButtons = [];
    presetOptions.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mobius-preset-button';
      button.textContent = item.label;
      button.addEventListener('click', () => this.applyMobiusPreset(item.value));
      presetGrid.appendChild(button);
      presetButtons.push({ id: item.value, button });
    });

    const actionGrid = document.createElement('div');
    actionGrid.className = 'button-grid scene-action-grid';

    const randomButton = document.createElement('button');
    randomButton.type = 'button';
    randomButton.textContent = 'Random Mobius';
    randomButton.addEventListener('click', () => this.randomizeMobiusControls());

    const randomPresetButton = document.createElement('button');
    randomPresetButton.type = 'button';
    randomPresetButton.textContent = 'Random Preset';
    randomPresetButton.addEventListener('click', () => {
      const options = presetOptions.map((item) => item.value);
      const choice = options[Math.floor(Math.random() * options.length)] || 'wormhole';
      this.applyMobiusPreset(choice);
    });

    const pulseButton = document.createElement('button');
    pulseButton.type = 'button';
    pulseButton.textContent = 'Gravity Pulse';
    pulseButton.addEventListener('click', () => {
      VisualState.setControl('mobiusGravityPulse', Math.min(100, (VisualState.controls.mobiusGravityPulse || 66) + 14));
      VisualState.setControl('mobiusLensDistortion', Math.min(100, (VisualState.controls.mobiusLensDistortion || 52) + 10));
      this.syncSliderValues();
      this.setStatus('Mobius gravity pulse boosted');
    });

    actionGrid.append(randomButton, randomPresetButton, pulseButton);
    module.append(title, note, selectGrid, presetGrid, actionGrid);
    container.appendChild(module);

    this.mobiusPresetSelect = presetSelect;
    this.mobiusPresetButtons = presetButtons;
    this.updateMobiusPresetButtons('wormhole');
  },

  updateMobiusPresetButtons(activePreset) {
    (this.mobiusPresetButtons || []).forEach((entry) => {
      if (!entry || !entry.button) return;
      entry.button.classList.toggle('active', entry.id === activePreset);
    });
  },

  applyMobiusPreset(preset) {
    if (typeof MobiusGalaxyScene !== 'undefined' && MobiusGalaxyScene && typeof MobiusGalaxyScene.applyPreset === 'function') {
      MobiusGalaxyScene.applyPreset(preset);
    }
    this.syncSliderValues();
    if (this.mobiusPresetSelect) this.mobiusPresetSelect.value = preset;
    this.updateMobiusPresetButtons(preset);
    this.setStatus(`Mobius preset: ${preset}`);
  },

  randomizeMobiusControls() {
    const ranges = {
      mobiusDensity: [80, 280], galaxyPoints: [90, 460], mobiusRotation: [0.4, 2.8],
      mobiusRibbonWidth: [14, 76], mobiusTwistAmount: [20, 95], mobiusDepthStrength: [24, 96],
      mobiusSurfaceGrid: [10, 92], mobiusSignalParticles: [20, 150], mobiusSignalSpeed: [18, 94],
      galaxySpiral: [20, 96], mobiusDustAmount: [20, 200], mobiusGravityPulse: [18, 96],
      mobiusLensDistortion: [10, 92], mobiusMode: [0, 4]
    };
    Object.entries(ranges).forEach(([id, [min, max]]) => {
      const step = id === 'mobiusRotation' ? 0.1 : 1;
      const raw = min + Math.random() * (max - min);
      const value = Math.round(raw / step) * step;
      VisualState.setControl(id, Number(value.toFixed(2)));
    });
    if (typeof MobiusGalaxyScene !== 'undefined' && MobiusGalaxyScene && typeof MobiusGalaxyScene.reset === 'function') MobiusGalaxyScene.reset();
    this.syncSliderValues();
    this.updateMobiusPresetButtons('');
    this.setStatus('Mobius scene randomised');
  },

  renderAtomicSceneUi(container) {
    const module = document.createElement('div');
    module.className = 'scene-ui-module atomic-ui-module';

    const title = document.createElement('div');
    title.className = 'module-title';
    title.textContent = 'Atomic Viral Scene UI';

    const note = document.createElement('div');
    note.className = 'panel-note';
    note.textContent = 'Stronger preset layout, random scene controls, manual random trigger event, dot-size control in sliders, wider spread behaviour, and hybrid-ready atomic optimisation.';

    const selectGrid = document.createElement('div');
    selectGrid.className = 'scene-ui-grid';

    const presetWrap = document.createElement('div');
    const presetLabel = document.createElement('label');
    presetLabel.setAttribute('for', 'atomicPresetSelect');
    presetLabel.textContent = 'Atomic Preset';
    const presetSelect = document.createElement('select');
    presetSelect.id = 'atomicPresetSelect';
    const presetOptions = [
      { value: 'lab', label: 'Microscopic Lab' },
      { value: 'swarm', label: 'Viral Swarm' },
      { value: 'reactor', label: 'Atomic Reactor' },
      { value: 'fusion', label: 'Bio-Tech Fusion' },
      { value: 'storm', label: 'Mutation Storm' }
    ];
    presetOptions.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      presetSelect.appendChild(option);
    });
    presetSelect.value = 'fusion';
    presetSelect.addEventListener('change', () => this.applyAtomicPreset(presetSelect.value));
    presetWrap.append(presetLabel, presetSelect);

    const infoWrap = document.createElement('div');
    const infoLabel = document.createElement('label');
    infoLabel.textContent = 'Audio Mapping';
    const info = document.createElement('div');
    info.className = 'panel-note compact-note';
    info.textContent = 'Low = scale pulse & field ripple · Mid = orbit rotation, link lines & structure turns · High = sparks, flicker & micro particles.';
    infoWrap.append(infoLabel, info);

    selectGrid.append(presetWrap, infoWrap);

    const presetGrid = document.createElement('div');
    presetGrid.className = 'atomic-preset-grid';
    const presetButtons = [];
    presetOptions.forEach((item) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'atomic-preset-button';
      button.textContent = item.label;
      button.addEventListener('click', () => this.applyAtomicPreset(item.value));
      presetGrid.appendChild(button);
      presetButtons.push({ id: item.value, button });
    });

    const actionGrid = document.createElement('div');
    actionGrid.className = 'button-grid scene-action-grid';

    const randomButton = document.createElement('button');
    randomButton.type = 'button';
    randomButton.textContent = 'Random Atomic Scene';
    randomButton.addEventListener('click', () => this.randomizeAtomicControls());

    const randomPresetButton = document.createElement('button');
    randomPresetButton.type = 'button';
    randomPresetButton.textContent = 'Random Preset';
    randomPresetButton.addEventListener('click', () => {
      const options = presetOptions.map((item) => item.value);
      const choice = options[Math.floor(Math.random() * options.length)] || 'fusion';
      this.applyAtomicPreset(choice);
    });

    const eventButton = document.createElement('button');
    eventButton.type = 'button';
    eventButton.textContent = 'Trigger Random Event';
    eventButton.addEventListener('click', () => {
      if (typeof AtomicViralScene !== 'undefined' && AtomicViralScene && typeof AtomicViralScene.queueManualEvent === 'function') {
        const type = AtomicViralScene.queueManualEvent();
        this.setStatus(`Atomic event: ${type}`);
      }
    });

    const mutationButton = document.createElement('button');
    mutationButton.type = 'button';
    mutationButton.textContent = 'Trigger Mutation';
    mutationButton.addEventListener('click', () => {
      if (typeof AtomicViralScene !== 'undefined' && AtomicViralScene && typeof AtomicViralScene.queueManualEvent === 'function') {
        AtomicViralScene.queueManualEvent('mutation');
        this.setStatus('Atomic event: mutation');
      }
    });

    const fusionButton = document.createElement('button');
    fusionButton.type = 'button';
    fusionButton.textContent = 'Trigger Fusion';
    fusionButton.addEventListener('click', () => {
      if (typeof AtomicViralScene !== 'undefined' && AtomicViralScene && typeof AtomicViralScene.queueManualEvent === 'function') {
        AtomicViralScene.queueManualEvent('fusion');
        this.setStatus('Atomic event: fusion');
      }
    });

    actionGrid.append(randomButton, randomPresetButton, eventButton, mutationButton, fusionButton);
    module.append(title, note, selectGrid, presetGrid, actionGrid);
    container.appendChild(module);

    this.atomicPresetSelect = presetSelect;
    this.atomicPresetButtons = presetButtons;
    this.atomicRandomButton = randomButton;
    this.atomicEventButton = eventButton;
    this.updateAtomicPresetButtons('fusion');
  },

  updateAtomicPresetButtons(activePreset) {
    (this.atomicPresetButtons || []).forEach((entry) => {
      if (!entry || !entry.button) return;
      entry.button.classList.toggle('active', entry.id === activePreset);
    });
  },

  applyAtomicPreset(preset) {
    const presets = {
      lab: {
        atomCount: 14, virusCount: 6, microParticleAmount: 80, dotSize: 5, spreadAmount: 48, largeObjectChance: 18,
        driftSpeed: 26, rotationSpeed: 34, orbitSpeed: 38, pulseStrength: 26, wobbleAmount: 18,
        bassScaleResponse: 42, midRotationResponse: 46, highSparkResponse: 40, beatBurstStrength: 28,
        coreSize: 32, spikeLength: 14, orbitCount: 3, linkLineAmount: 36, sceneOpacity: 58,
        interactionStrength: 36, mutationChance: 18, fusionChance: 12, swarmChance: 14
      },
      swarm: {
        atomCount: 12, virusCount: 16, microParticleAmount: 140, dotSize: 8, spreadAmount: 52, largeObjectChance: 28,
        driftSpeed: 48, rotationSpeed: 56, orbitSpeed: 44, pulseStrength: 58, wobbleAmount: 48,
        bassScaleResponse: 68, midRotationResponse: 58, highSparkResponse: 64, beatBurstStrength: 74,
        coreSize: 34, spikeLength: 26, orbitCount: 2, linkLineAmount: 54, sceneOpacity: 78,
        interactionStrength: 68, mutationChance: 56, fusionChance: 32, swarmChance: 74
      },
      reactor: {
        atomCount: 22, virusCount: 8, microParticleAmount: 120, dotSize: 6, spreadAmount: 44, largeObjectChance: 36,
        driftSpeed: 34, rotationSpeed: 72, orbitSpeed: 78, pulseStrength: 46, wobbleAmount: 22,
        bassScaleResponse: 58, midRotationResponse: 74, highSparkResponse: 70, beatBurstStrength: 62,
        coreSize: 42, spikeLength: 18, orbitCount: 4, linkLineAmount: 64, sceneOpacity: 76,
        interactionStrength: 52, mutationChance: 24, fusionChance: 20, swarmChance: 28
      },
      fusion: {
        atomCount: 18, virusCount: 10, microParticleAmount: 130, dotSize: 7, spreadAmount: 42, largeObjectChance: 34,
        driftSpeed: 46, rotationSpeed: 54, orbitSpeed: 58, pulseStrength: 52, wobbleAmount: 40,
        bassScaleResponse: 66, midRotationResponse: 62, highSparkResponse: 72, beatBurstStrength: 70,
        coreSize: 38, spikeLength: 18, orbitCount: 3, linkLineAmount: 56, sceneOpacity: 72,
        interactionStrength: 60, mutationChance: 40, fusionChance: 26, swarmChance: 38
      },
      storm: {
        atomCount: 24, virusCount: 18, microParticleAmount: 190, dotSize: 9, spreadAmount: 58, largeObjectChance: 44,
        driftSpeed: 62, rotationSpeed: 84, orbitSpeed: 76, pulseStrength: 74, wobbleAmount: 56,
        bassScaleResponse: 82, midRotationResponse: 84, highSparkResponse: 90, beatBurstStrength: 88,
        coreSize: 46, spikeLength: 30, orbitCount: 5, linkLineAmount: 74, sceneOpacity: 86,
        interactionStrength: 78, mutationChance: 78, fusionChance: 52, swarmChance: 80
      }
    };
    const selected = presets[preset] || presets.fusion;
    Object.entries(selected).forEach(([id, value]) => VisualState.setControl(id, value));
    this.syncSliderValues();
    if (this.atomicPresetSelect) this.atomicPresetSelect.value = preset;
    this.updateAtomicPresetButtons(preset);
    this.setStatus(`Atomic preset: ${preset}`);
  },

  randomizeAtomicControls() {
    const ranges = {
      atomCount: [8, 40], virusCount: [4, 22], microParticleAmount: [50, 220], dotSize: [3, 12], spreadAmount: [20, 70], largeObjectChance: [10, 60],
      driftSpeed: [12, 72], rotationSpeed: [24, 90], orbitSpeed: [20, 90], pulseStrength: [20, 84], wobbleAmount: [10, 62],
      bassScaleResponse: [28, 92], midRotationResponse: [26, 92], highSparkResponse: [30, 96], beatBurstStrength: [24, 94],
      coreSize: [24, 54], spikeLength: [10, 34], orbitCount: [2, 5], linkLineAmount: [18, 82], sceneOpacity: [48, 90],
      interactionStrength: [20, 82], mutationChance: [8, 84], fusionChance: [4, 54], swarmChance: [10, 84]
    };
    Object.entries(ranges).forEach(([id, [min, max]]) => {
      const value = id === 'orbitCount'
        ? Math.round(min + Math.random() * (max - min))
        : Math.round(min + Math.random() * (max - min));
      VisualState.setControl(id, value);
    });
    this.syncSliderValues();
    this.updateAtomicPresetButtons('');
    this.setStatus('Atomic Viral scene randomised');
  },

  renderIrisSceneUi(container) {
    const module = document.createElement('div');
    module.className = 'scene-ui-module';

    const title = document.createElement('div');
    title.className = 'module-title';
    title.textContent = 'Iris Scene UI';

    const note = document.createElement('div');
    note.className = 'panel-note';
    note.textContent = 'Named iris presets plus quick randomisation for opacity, glow, pupil, fibre shimmer and morph motion.';

    const selectGrid = document.createElement('div');
    selectGrid.className = 'scene-ui-grid';

    const presetWrap = document.createElement('div');
    const presetLabel = document.createElement('label');
    presetLabel.setAttribute('for', 'irisPresetSelect');
    presetLabel.textContent = 'Iris Preset';
    const presetSelect = document.createElement('select');
    presetSelect.id = 'irisPresetSelect';
    [
      { value: 'soft', label: 'Soft Iris' },
      { value: 'mechanical', label: 'Mechanical Iris' },
      { value: 'organic', label: 'Organic Iris' },
      { value: 'aggressive', label: 'Aggressive Iris' }
    ].forEach((item) => {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      presetSelect.appendChild(option);
    });
    presetSelect.value = 'soft';
    presetSelect.addEventListener('change', () => {
      this.applyIrisPreset(presetSelect.value);
    });
    presetWrap.append(presetLabel, presetSelect);

    const infoWrap = document.createElement('div');
    const infoLabel = document.createElement('label');
    infoLabel.textContent = 'Preset Focus';
    const info = document.createElement('div');
    info.className = 'panel-note compact-note';
    info.textContent = 'Soft = low glow, Mechanical = crisp rings, Organic = shape morph, Aggressive = high motion.';
    infoWrap.append(infoLabel, info);

    selectGrid.append(presetWrap, infoWrap);

    const buttonGrid = document.createElement('div');
    buttonGrid.className = 'button-grid';

    const randomButton = document.createElement('button');
    randomButton.type = 'button';
    randomButton.textContent = 'Random Iris';
    randomButton.addEventListener('click', () => this.randomizeIrisControls());

    const reduceButton = document.createElement('button');
    reduceButton.type = 'button';
    reduceButton.textContent = 'Low Glow Iris';
    reduceButton.addEventListener('click', () => this.applyIrisPreset('soft'));

    buttonGrid.append(randomButton, reduceButton);
    module.append(title, note, selectGrid, buttonGrid);
    container.appendChild(module);

    this.irisPresetSelect = presetSelect;
    this.irisRandomButton = randomButton;
  },

  applyIrisPreset(preset) {
    const presets = {
      soft: {
        irisOpacity: 28, irisGlow: 6, irisPetalMotion: 34, irisMorphSpeed: 28,
        irisInnerRotation: 42, irisOuterRotation: 38, irisPupilPulse: 26,
        irisFibreShimmer: 34, irisSymmetryWarp: 18, irisSparkCount: 70,
        irisFibreDensity: 48, irisPortalDepth: 44, irisPrism: 48
      },
      mechanical: {
        irisOpacity: 38, irisGlow: 10, irisPetalMotion: 28, irisMorphSpeed: 38,
        irisInnerRotation: 62, irisOuterRotation: 28, irisPupilPulse: 22,
        irisFibreShimmer: 42, irisSymmetryWarp: 14, irisSparkCount: 95,
        irisFibreDensity: 58, irisPortalDepth: 52, irisPrism: 70
      },
      organic: {
        irisOpacity: 46, irisGlow: 14, irisPetalMotion: 72, irisMorphSpeed: 55,
        irisInnerRotation: 48, irisOuterRotation: 43, irisPupilPulse: 58,
        irisFibreShimmer: 66, irisSymmetryWarp: 54, irisSparkCount: 110,
        irisFibreDensity: 78, irisPortalDepth: 60, irisPrism: 62
      },
      aggressive: {
        irisOpacity: 58, irisGlow: 24, irisPetalMotion: 88, irisMorphSpeed: 78,
        irisInnerRotation: 78, irisOuterRotation: 18, irisPupilPulse: 78,
        irisFibreShimmer: 88, irisSymmetryWarp: 76, irisSparkCount: 150,
        irisFibreDensity: 88, irisPortalDepth: 78, irisPrism: 86
      }
    };
    const selected = presets[preset] || presets.soft;
    Object.entries(selected).forEach(([id, value]) => VisualState.setControl(id, value));
    this.syncSliderValues();
    if (this.irisPresetSelect) this.irisPresetSelect.value = preset;
    this.setStatus(`Iris preset: ${preset}`);
  },

  randomizeIrisControls() {
    const ranges = {
      irisOpacity: [18, 62], irisGlow: [0, 30], irisPetalMotion: [15, 90], irisMorphSpeed: [15, 90],
      irisInnerRotation: [15, 85], irisOuterRotation: [10, 85], irisPupilPulse: [10, 85],
      irisFibreShimmer: [20, 95], irisSymmetryWarp: [0, 85], irisSparkCount: [45, 180],
      irisFibreDensity: [35, 95], irisPortalDepth: [35, 85], irisPrism: [35, 95]
    };
    Object.entries(ranges).forEach(([id, [min, max]]) => {
      VisualState.setControl(id, Math.round(min + Math.random() * (max - min)));
    });
    this.syncSliderValues();
    this.setStatus('Iris scene randomised');
  },

  randomizeFireworkControls(forcedStageDepth = null) {
    const ids = ['fireworkRate', 'fireworkMaxBursts', 'fireworkSize', 'fireworkScatter', 'fireworkLineBurst', 'fireworkShapeMode', 'fireworkStageDepth', 'fireworkChildBurstAmount', 'fireworkDustAmount', 'fireworkDustSize', 'fireworkMegaSensitivity'];
    ids.forEach((id) => {
      const control = (DJ_CONFIG.sceneControls.firework || []).find((item) => item.id === id);
      if (!control) return;
      let value = control.value;
      if (id === 'fireworkShapeMode') {
        value = Math.floor(Math.random() * 5);
      } else if (id === 'fireworkStageDepth') {
        value = forcedStageDepth ?? (1 + Math.floor(Math.random() * 3));
      } else if (id === 'fireworkChildBurstAmount') {
        value = 1 + Math.floor(Math.random() * 10);
      } else if (id === 'fireworkDustAmount') {
        value = Math.floor(Math.random() * 81);
      } else if (id === 'fireworkDustSize') {
        value = 1 + Math.floor(Math.random() * 20);
      } else {
        const span = control.max - control.min;
        const raw = control.min + Math.random() * span;
        const stepped = Math.round(raw / control.step) * control.step;
        value = Number(stepped.toFixed(2));
      }
      VisualState.setControl(id, value);
    });
    if (this.fireworkShapeSelect) this.fireworkShapeSelect.value = String(Math.round(VisualState.controls.fireworkShapeMode || 0));
    if (this.fireworkStageSelect) this.fireworkStageSelect.value = String(Math.round(VisualState.controls.fireworkStageDepth ?? 0));
    this.syncSliderValues();
    const stageMsg = forcedStageDepth ? ` (${forcedStageDepth} stage)` : ((VisualState.controls.fireworkStageDepth ?? 0) === 0 ? ' (random stage)' : '');
    this.setStatus(`Firework scene randomised${stageMsg}`);
  },

  createSlider(control) {
    const row = document.createElement('div');
    row.className = 'slider-row';
    const label = document.createElement('span');
    label.textContent = control.label;
    const input = document.createElement('input');
    input.type = 'range'; input.min = control.min; input.max = control.max; input.step = control.step;
    input.value = VisualState.controls[control.id] ?? control.value; input.setAttribute('aria-label', control.label);
    const value = document.createElement('strong'); value.textContent = this.format(input.value, control.step);
    input.addEventListener('input', () => {
      VisualState.setControl(control.id, input.value);
      value.textContent = this.format(input.value, control.step);
      this.setStatus(`${control.label}: ${value.textContent}`);
    });
    row.append(label, input, value);
    this.sliders.set(control.id, { input, value, control });
    return row;
  },

  bindButtons() {
    this.bind('hudTab', () => this.toggleHud());
    this.bind('startMicButton', async () => {
      const ok = await AudioEngine.startMicrophone();
      this.setStatus(ok ? 'Microphone active' : 'Mic blocked: using fallback');
      this.sync();
    });
    this.bind('startSystemAudioButton', async () => {
      const ok = await AudioEngine.startSystemAudio();
      this.setStatus(ok ? 'Sound card / tab audio active' : 'System audio unavailable or no audio selected');
      this.sync();
    });
    this.bind('audioSourceButton', async () => {
      const ok = await AudioEngine.cycleSource();
      this.setStatus(ok ? `Audio source: ${AudioEngine.sourceLabel()}` : AudioEngine.status);
      this.sync();
    });
    this.bind('beatFxButton', () => {
      VisualState.beatFxEnabled = !VisualState.beatFxEnabled;
      this.setStatus(VisualState.beatFxEnabled ? 'Continuous Beat FX on' : 'Continuous Beat FX off');
      this.sync();
    });
    this.bind('beatFxFourButton', () => {
      VisualState.beatFxFourEnabled = !VisualState.beatFxFourEnabled;
      VisualState.beatFxBeatCount = 0;
      VisualState.beatFxLastPulseAt = 0;
      this.setStatus(VisualState.beatFxFourEnabled ? 'Beat FX reacts every 4 beat/bass pulses' : 'Beat FX interval mode');
      this.sync();
    });
    this.bind('colorBeatFxButton', () => {
      VisualState.colorBeatFxEnabled = !VisualState.colorBeatFxEnabled;
      VisualState.colorBeatFxBeatCount = 0;
      VisualState.colorBeatFxLastPulseAt = 0;
      this.setStatus(VisualState.colorBeatFxEnabled ? '2-bar colour beat FX on' : '2-bar colour beat FX off');
      this.sync();
    });
    this.bind('automationToggleButton', () => {
      VisualState.toggleBeatAutomation();
      this.setStatus(VisualState.automationEnabled ? 'Beat automation on' : 'Beat automation off');
      this.sync();
    });
    this.bind('automationTriggerEventButton', () => {
      const action = VisualState.triggerBeatAutomationEvent(AudioEngine.snapshot(), true);
      this.setStatus(`Automation: ${action}`);
      this.sync();
    });
    this.bind('automationRandomiseButton', () => {
      VisualState.randomizeActiveSceneControls();
      this.syncSliderValues();
      this.setStatus('Automation: active scene randomised');
      this.sync();
    });
    this.bind('monitorToggleButton', () => {
      if (typeof RuntimeMonitor !== 'undefined') RuntimeMonitor.enabled = !RuntimeMonitor.enabled;
      this.setStatus(typeof RuntimeMonitor !== 'undefined' && RuntimeMonitor.enabled ? 'Performance monitor on' : 'Performance monitor off');
      this.sync();
    });
    this.bind('runtimeCleanupButton', () => {
      if (typeof RuntimeMonitor !== 'undefined') RuntimeMonitor.cleanup();
      this.setStatus('Runtime cleanup applied');
      this.sync();
    });
    this.bind('randomizeButton', () => {
      VisualState.randomizeVisuals();
      this.syncSliderValues();
      this.setStatus('Visual controls randomised');
    });
    this.bind('perfButton', () => {
      VisualState.nextPerfMode();
      this.setStatus(`Performance: ${VisualState.perfMode().name}`);
      this.sync();
    });
    this.bind('resetCameraButton', () => {
      VisualState.resetCamera();
      this.syncSliderValues();
      this.setStatus('Camera reset: zoom 100 / rotate 0');
      this.sync();
    });
    this.bind('cyclePaletteButton', () => {
      VisualState.nextPalette();
      this.setStatus(`Palette: ${VisualState.palette().name}`);
      this.sync();
    });
    this.bind('customColourToggleButton', () => {
      VisualState.toggleCustomColours();
      this.setStatus(VisualState.customColourEnabled ? 'Custom scene colours active' : 'Preset palette active');
      this.sync();
    });
    this.bind('textProjectionToggleButton', () => {
      VisualState.toggleTextProjection();
      this.setStatus(VisualState.textProjectionEnabled ? 'Text projection on' : 'Text projection off');
      this.sync();
    });
    this.bind('textBehindSceneButton', () => {
      VisualState.setTextProjectionLayer('behind');
      this.setStatus('Text layer: behind scene');
      this.sync();
    });
    this.bind('textAboveSceneButton', () => {
      VisualState.setTextProjectionLayer('above');
      this.setStatus('Text layer: above scene');
      this.sync();
    });
    this.bindCustomColourInputs();
    this.bindTextProjectionInputs();
    this.bind('toggleGradientButton', () => {
      VisualState.gradientEnabled = !VisualState.gradientEnabled;
      this.setStatus(VisualState.gradientEnabled ? 'Gradient on' : 'Gradient off');
      this.sync();
    });
    this.bind('transitionToggleButton', () => {
      VisualState.transitionEnabled = !VisualState.transitionEnabled;
      VisualState.lastSceneSwitchAt = performance.now();
      this.setStatus(VisualState.transitionEnabled ? 'Auto transition on' : 'Auto transition off');
      this.sync();
    });
    this.bind('transitionTriggerButton', () => {
      const next = VisualState.nextScene();
      this.sceneSelect.value = next;
      this.renderSceneControls();
      this.setStatus(`Scene: ${VisualState.sceneLabel()}`);
      this.sync();
    });
    this.sceneSelect.addEventListener('change', () => {
      VisualState.setScene(this.sceneSelect.value);
      this.renderSceneControls();
      this.setStatus(`Scene: ${VisualState.sceneLabel()}`);
      this.sync();
    });
    this.automationSceneEveryInput?.addEventListener('input', () => {
      VisualState.setAutomationSceneEvery(this.automationSceneEveryInput.value);
      this.automationSceneEveryInput.value = VisualState.automationSceneEvery;
      this.setStatus(`Automation scene every ${VisualState.automationSceneEvery} beats`);
      this.sync();
    });
    this.automationEventEveryInput?.addEventListener('input', () => {
      VisualState.setAutomationEventEvery(this.automationEventEveryInput.value);
      this.automationEventEveryInput.value = VisualState.automationEventEvery;
      this.setStatus(`Automation event every ${VisualState.automationEventEvery} beats`);
      this.sync();
    });
    this.automationRandomEveryInput?.addEventListener('input', () => {
      VisualState.setAutomationRandomEvery(this.automationRandomEveryInput.value);
      this.automationRandomEveryInput.value = VisualState.automationRandomEvery;
      this.setStatus(`Automation randomise every ${VisualState.automationRandomEvery} beats`);
      this.sync();
    });
    this.transitionTypeSelect?.addEventListener('change', () => {
      VisualState.setTransitionType(this.transitionTypeSelect.value);
      this.setStatus(`Transition: ${VisualState.transitionType}`);
      this.sync();
    });
    this.transitionSecondsInput?.addEventListener('input', () => {
      VisualState.setTransitionSeconds(this.transitionSecondsInput.value);
      this.transitionSecondsInput.value = VisualState.transitionSeconds;
      this.setStatus(`Transition gap: ${VisualState.transitionSeconds}s`);
    });
  },

  bindTextProjectionInputs() {
    this.textMessageInput?.addEventListener('input', () => {
      VisualState.setTextMessage(this.textMessageInput.value);
      this.setStatus('Projected text updated');
    });
    this.textFontSelect?.addEventListener('change', () => {
      VisualState.setTextFont(this.textFontSelect.value);
      this.setStatus(`Text font: ${VisualState.textFontConfig().label}`);
      this.sync();
    });
    this.textColourSlotSelect?.addEventListener('change', () => {
      VisualState.setTextColourSlot(this.textColourSlotSelect.value);
      this.setStatus(`Text colour source: ${this.textColourSlotSelect.options[this.textColourSlotSelect.selectedIndex]?.text || this.textColourSlotSelect.value}`);
      this.sync();
    });
    this.textGlowColourSlotSelect?.addEventListener('change', () => {
      VisualState.setTextGlowColourSlot(this.textGlowColourSlotSelect.value);
      this.setStatus(`Text glow colour: ${this.textGlowColourSlotSelect.options[this.textGlowColourSlotSelect.selectedIndex]?.text || this.textGlowColourSlotSelect.value}`);
      this.sync();
    });
    this.textAnimationSelect?.addEventListener('change', () => {
      VisualState.setTextAnimationMode(this.textAnimationSelect.value);
      this.setStatus(`Text animation: ${VisualState.textAnimationConfig().label}`);
      this.sync();
    });
    this.textAlignSelect?.addEventListener('change', () => {
      VisualState.setTextAlign(this.textAlignSelect.value);
      this.setStatus(`Text alignment: ${this.textAlignSelect.value}`);
      this.sync();
    });
  },

  bindCustomColourInputs() {
    Object.entries(this.customColourInputs || {}).forEach(([channel, input]) => {
      if (!input) return;
      input.value = VisualState.customPalette[channel];
      input.addEventListener('input', () => {
        VisualState.setCustomColour(channel, input.value);
        VisualState.customColourEnabled = true;
        this.setStatus(`Custom ${channel.toUpperCase()} colour: ${input.value}`);
        this.sync();
      });
      input.addEventListener('change', () => {
        VisualState.setCustomColour(channel, input.value);
        VisualState.customColourEnabled = true;
        this.setStatus(`Custom ${channel.toUpperCase()} colour selected`);
        this.sync();
      });
    });
  },

  bind(id, handler) { const el = document.getElementById(id); if (el) el.addEventListener('click', handler); },

  bindCameraControls() {
    if (!this.stage) return;

    this.stage.addEventListener('wheel', (event) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      VisualState.adjustCameraZoom(direction * 4);
      this.syncSliderValues();
      this.setStatus(`Camera zoom: ${Math.round(VisualState.controls.cameraZoom || 100)}`);
    }, { passive: false });

    this.stage.addEventListener('contextmenu', (event) => event.preventDefault());

    this.stage.addEventListener('pointerdown', (event) => {
      if (event.button === 2 || event.shiftKey) {
        this.cameraDragActive = true;
        this.cameraDragLastX = event.clientX;
        this.stage.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      }
    });

    this.stage.addEventListener('pointermove', (event) => {
      if (!this.cameraDragActive) return;
      const dx = event.clientX - this.cameraDragLastX;
      this.cameraDragLastX = event.clientX;
      VisualState.adjustCameraRotation(dx * 0.15);
      this.syncSliderValues();
      this.setStatus(`Camera rotate: ${Math.round(VisualState.controls.cameraTilt || 0)}°`);
    });

    const stopDrag = (event) => {
      if (!this.cameraDragActive) return;
      this.cameraDragActive = false;
      this.stage.releasePointerCapture?.(event.pointerId);
    };
    this.stage.addEventListener('pointerup', stopDrag);
    this.stage.addEventListener('pointercancel', stopDrag);
    this.stage.addEventListener('pointerleave', stopDrag);
  },

  bindKeyboard() {
    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (key === 'h') this.toggleHud();
      if (key === 'm') document.getElementById('startMicButton')?.click();
      if (key === 's') document.getElementById('startSystemAudioButton')?.click();
      if (key === 'b') document.getElementById('beatFxButton')?.click();
      if (key === 'g') document.getElementById('beatFxFourButton')?.click();
      if (key === 'v') document.getElementById('colorBeatFxButton')?.click();
      if (key === 'r') document.getElementById('randomizeButton')?.click();
      if (key === 'c') document.getElementById('resetCameraButton')?.click();
      if (key === 'f') document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
      if (/^[1-9]$/.test(key)) this.selectSceneByIndex(Number(key) - 1);
      if (key === '0') this.selectSceneById('atomic');
      if (key === '-' || key === '=') this.selectSceneById('hybrid');
    });
  },

  selectSceneByIndex(index) {
    const scene = DJ_CONFIG.scenes[index];
    if (!scene) return;
    this.selectSceneById(scene.id);
  },

  selectSceneById(id) {
    VisualState.setScene(id); this.sceneSelect.value = id; this.renderSceneControls(); this.setStatus(`Scene: ${VisualState.sceneLabel()}`); this.sync();
  },

  toggleHud() { this.hud.classList.toggle('open'); this.sync(); },

  updateMonitorReadouts() {
    if (typeof RuntimeMonitor === 'undefined') return;
    const snap = RuntimeMonitor.snapshot();
    if (this.monitorFps) this.monitorFps.textContent = RuntimeMonitor.enabled ? String(snap.fps || '--') : 'Off';
    if (this.monitorFrameMs) this.monitorFrameMs.textContent = RuntimeMonitor.enabled ? `${Math.round(snap.frameMs || 0)} ms` : '-- ms';
    if (this.monitorScene) this.monitorScene.textContent = snap.scene || '--';
    if (this.monitorHybrid) this.monitorHybrid.textContent = snap.hybrid || 'Off';
    if (this.monitorAudio) this.monitorAudio.textContent = snap.audio || 'Fallback';
    if (this.monitorAudioSource) this.monitorAudioSource.textContent = snap.audioSource || 'Fallback';
    if (this.monitorFirework) this.monitorFirework.textContent = snap.firework || '0';
    if (this.monitorMissile) this.monitorMissile.textContent = snap.missile || '0';
    if (this.monitorAtomic) this.monitorAtomic.textContent = snap.atomic || '0';
    if (this.monitorAutomation) this.monitorAutomation.textContent = snap.automation || 'Off';
  },

  update() {
    const audio = AudioEngine.snapshot();
    VisualState.applyBeatFx(audio);
    VisualState.applyColorBeatFx(audio);
    const automationAction = VisualState.applyBeatAutomation(audio);
    if (automationAction) {
      this.sceneSelect.value = VisualState.scene;
      this.renderSceneControls();
      this.setStatus(`Automation: ${automationAction}`);
    }
    if (VisualState.maybeAdvanceScene()) {
      this.sceneSelect.value = VisualState.scene;
      this.renderSceneControls();
      this.setStatus(`Scene: ${VisualState.sceneLabel()}`);
    }
    this.setMeter('bass', audio.bass); this.setMeter('mid', audio.mid); this.setMeter('high', audio.high);
    document.getElementById('bpmReadout').textContent = audio.bpm || '--';
    document.getElementById('beatReadout').textContent = `${Math.round(audio.beat * 100)}%`;
    const sourceReadout = document.getElementById('audioSourceReadout');
    if (sourceReadout) sourceReadout.textContent = audio.sourceLabel || 'Fallback';
    const beatFxModeReadout = document.getElementById('beatFxModeReadout');
    if (beatFxModeReadout) {
      beatFxModeReadout.textContent = VisualState.beatFxFourEnabled
        ? `4-Beat ${VisualState.beatFxBeatCount % 4}/4`
        : 'Interval';
    }
    const colorBeatFxReadout = document.getElementById('colorBeatFxReadout');
    if (colorBeatFxReadout) {
      colorBeatFxReadout.textContent = VisualState.colorBeatFxEnabled
        ? `2-Bar ${VisualState.colorBeatFxBeatCount % 8}/8`
        : 'Off';
    }
    if (this.automationReadout) this.automationReadout.textContent = VisualState.automationEnabled ? (VisualState.automationLastAction || 'On') : 'Off';
    if (this.automationBeatCounter) this.automationBeatCounter.textContent = String(VisualState.automationBeatCount || 0);
    this.updateMonitorReadouts();
    this.syncSliderValues(false); this.sync();
  },

  setMeter(prefix, value) {
    const percent = Math.round(clamp(value, 0, 1) * 100);
    document.getElementById(`${prefix}Readout`).textContent = `${percent}%`;
    document.getElementById(`${prefix}Meter`).style.width = `${percent}%`;
  },

  updateLiveCockpit() {
    if (this.liveSceneName) {
      const scene = DJ_CONFIG.scenes.find((item) => item.id === VisualState.scene);
      this.liveSceneName.textContent = scene?.label || VisualState.scene || 'Scene';
    }
    if (this.liveAudioState) {
      const enabled = typeof AudioEngine !== 'undefined' && AudioEngine.enabled;
      this.liveAudioState.textContent = enabled ? (AudioEngine.sourceLabel ? AudioEngine.sourceLabel() : 'Active') : 'Ready';
    }
    if (this.livePerfState) {
      const perf = VisualState.perfMode ? VisualState.perfMode() : null;
      this.livePerfState.textContent = perf?.label || perf?.name || 'Balanced';
    }
  },

  initCollapsiblePanels() {
    const panels = Array.from(document.querySelectorAll ? document.querySelectorAll('.hud .panel[data-panel-title]') : []);
    panels.forEach((panel) => {
      if (!panel || panel.dataset.v96Ready === '1') return;
      const heading = panel.querySelector ? panel.querySelector('h2') : null;
      if (!heading) return;
      const title = heading.textContent.trim();
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'panel-toggle';
      toggle.setAttribute('aria-expanded', String(!panel.classList.contains('panel-collapsed')));
      toggle.innerHTML = `<span>${title}</span><i>${panel.classList.contains('panel-collapsed') ? '+' : '−'}</i>`;
      heading.replaceWith(toggle);
      toggle.addEventListener('click', () => {
        const collapsed = panel.classList.toggle('panel-collapsed');
        toggle.setAttribute('aria-expanded', String(!collapsed));
        const icon = toggle.querySelector ? toggle.querySelector('i') : null;
        if (icon) icon.textContent = collapsed ? '+' : '−';
      });
      panel.dataset.v96Ready = '1';
    });
  },

  syncLayerButtons() {
    this.layerButtons.forEach((button, id) => {
      const active = !!VisualState.hybridLayers[id];
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  },

  syncSliderValues(updateAll = true) {
    this.sliders.forEach(({ input, value, control }, id) => {
      if (!updateAll && document.activeElement === input) return;
      const nextValue = VisualState.controls[id];
      if (nextValue == null) return;
      input.value = nextValue; value.textContent = this.format(nextValue, control.step);
    });
  },

  sync() {
    document.getElementById('startMicButton').textContent = AudioEngine.sourceType === 'microphone' && AudioEngine.enabled ? 'Mic On' : 'Start Mic';
    document.getElementById('startMicButton').classList.toggle('active', AudioEngine.sourceType === 'microphone' && AudioEngine.enabled);
    const systemAudioButton = document.getElementById('startSystemAudioButton');
    if (systemAudioButton) {
      systemAudioButton.textContent = AudioEngine.sourceType === 'system' && AudioEngine.enabled ? 'Sound Card On' : 'Sound Card';
      systemAudioButton.classList.toggle('active', AudioEngine.sourceType === 'system' && AudioEngine.enabled);
    }
    const audioSourceButton = document.getElementById('audioSourceButton');
    if (audioSourceButton) {
      audioSourceButton.textContent = `Source: ${AudioEngine.sourceLabel()}`;
      audioSourceButton.classList.toggle('active', AudioEngine.enabled);
    }
    document.getElementById('beatFxButton').textContent = VisualState.beatFxEnabled ? 'Beat FX On' : 'Beat FX Off';
    document.getElementById('beatFxButton').classList.toggle('active', VisualState.beatFxEnabled);
    const beatFxFourButton = document.getElementById('beatFxFourButton');
    if (beatFxFourButton) {
      beatFxFourButton.textContent = VisualState.beatFxFourEnabled ? '4-Beat FX On' : '4-Beat FX Off';
      beatFxFourButton.classList.toggle('active', VisualState.beatFxFourEnabled);
    }
    const colorBeatFxButton = document.getElementById('colorBeatFxButton');
    if (colorBeatFxButton) {
      colorBeatFxButton.textContent = VisualState.colorBeatFxEnabled ? '2-Bar Colour FX On' : '2-Bar Colour FX Off';
      colorBeatFxButton.classList.toggle('active', VisualState.colorBeatFxEnabled);
    }
    const monitorToggleButton = document.getElementById('monitorToggleButton');
    if (monitorToggleButton && typeof RuntimeMonitor !== 'undefined') {
      monitorToggleButton.textContent = RuntimeMonitor.enabled ? 'Monitor On' : 'Monitor Off';
      monitorToggleButton.classList.toggle('active', RuntimeMonitor.enabled);
    }
    const automationToggleButton = document.getElementById('automationToggleButton');
    if (automationToggleButton) {
      automationToggleButton.textContent = VisualState.automationEnabled ? 'Automation On' : 'Automation Off';
      automationToggleButton.classList.toggle('active', VisualState.automationEnabled);
    }
    if (this.automationSceneEveryInput && document.activeElement !== this.automationSceneEveryInput) this.automationSceneEveryInput.value = VisualState.automationSceneEvery;
    if (this.automationEventEveryInput && document.activeElement !== this.automationEventEveryInput) this.automationEventEveryInput.value = VisualState.automationEventEvery;
    if (this.automationRandomEveryInput && document.activeElement !== this.automationRandomEveryInput) this.automationRandomEveryInput.value = VisualState.automationRandomEvery;
    if (this.automationReadout) this.automationReadout.textContent = VisualState.automationEnabled ? (VisualState.automationLastAction || 'On') : 'Off';
    if (this.automationBeatCounter) this.automationBeatCounter.textContent = String(VisualState.automationBeatCount || 0);
    document.getElementById('perfButton').textContent = `Perf: ${VisualState.perfMode().name}`;
    const customColourToggleButton = document.getElementById('customColourToggleButton');
    if (customColourToggleButton) {
      customColourToggleButton.textContent = VisualState.customColourEnabled ? 'Custom Colours On' : 'Custom Colours Off';
      customColourToggleButton.classList.toggle('active', VisualState.customColourEnabled);
    }
    const textProjectionToggleButton = document.getElementById('textProjectionToggleButton');
    if (textProjectionToggleButton) {
      textProjectionToggleButton.textContent = VisualState.textProjectionEnabled ? 'Text On' : 'Text Off';
      textProjectionToggleButton.classList.toggle('active', VisualState.textProjectionEnabled);
    }
    const textBehindSceneButton = document.getElementById('textBehindSceneButton');
    if (textBehindSceneButton) {
      textBehindSceneButton.classList.toggle('active', VisualState.textProjectionLayer === 'behind');
      textBehindSceneButton.setAttribute('aria-pressed', String(VisualState.textProjectionLayer === 'behind'));
    }
    const textAboveSceneButton = document.getElementById('textAboveSceneButton');
    if (textAboveSceneButton) {
      textAboveSceneButton.classList.toggle('active', VisualState.textProjectionLayer === 'above');
      textAboveSceneButton.setAttribute('aria-pressed', String(VisualState.textProjectionLayer === 'above'));
    }
    if (this.textMessageInput && this.textMessageInput.value !== VisualState.textMessage && document.activeElement !== this.textMessageInput) this.textMessageInput.value = VisualState.textMessage;
    if (this.textFontSelect) this.textFontSelect.value = VisualState.textFont;
    if (this.textColourSlotSelect) this.textColourSlotSelect.value = VisualState.textColourSlot;
    if (this.textGlowColourSlotSelect) this.textGlowColourSlotSelect.value = VisualState.textGlowColourSlot;
    if (this.textAnimationSelect) this.textAnimationSelect.value = VisualState.textAnimationMode;
    if (this.textAlignSelect) this.textAlignSelect.value = VisualState.textAlign;
    Object.entries(this.customColourInputs || {}).forEach(([channel, input]) => {
      if (input && input.value !== VisualState.customPalette[channel]) input.value = VisualState.customPalette[channel];
    });
    Object.entries(this.customColourBoxes || {}).forEach(([channel, box]) => {
      if (box) box.style.background = VisualState.customPalette[channel];
    });
    document.getElementById('toggleGradientButton').textContent = VisualState.gradientEnabled ? 'Gradient On' : 'Gradient Off';
    document.getElementById('toggleGradientButton').classList.toggle('active', VisualState.gradientEnabled);
    document.getElementById('transitionToggleButton').textContent = VisualState.transitionEnabled ? 'Transition On' : 'Transition Off';
    document.getElementById('transitionToggleButton').classList.toggle('active', VisualState.transitionEnabled);
    if (this.transitionTypeSelect) this.transitionTypeSelect.value = VisualState.transitionType;
    if (this.transitionSecondsInput) this.transitionSecondsInput.value = VisualState.transitionSeconds;
    if (this.fireworkShapeSelect) this.fireworkShapeSelect.value = String(Math.round(VisualState.controls.fireworkShapeMode || 0));
    if (this.fireworkStageSelect) this.fireworkStageSelect.value = String(Math.round(VisualState.controls.fireworkStageDepth ?? 0));
    this.hudTab.classList.toggle('active', this.hud.classList.contains('open'));
    this.updateLiveCockpit();
    this.hudTab.setAttribute('aria-expanded', String(this.hud.classList.contains('open')));
    document.getElementById('statusPill').textContent = AudioEngine.enabled ? AudioEngine.sourceLabel().toUpperCase() : 'READY';
    this.syncLayerButtons();
  },

  setStatus(message) { if (this.status) this.status.textContent = message; if (typeof this.updateLiveCockpit === 'function') this.updateLiveCockpit(); },
  format(value, step) { const n = Number(value); return String(step < 1 ? n.toFixed(1) : Math.round(n)); }
};
