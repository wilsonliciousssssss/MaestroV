# Maestro V

**ΛΩ · Alpha Omega Collective**

Audio-reactive live visual engine for DJs and live performance. Point it at your mic or sound card and it turns the music into 16 switchable club-visual scenes — zero dependencies, no build step, runs offline straight from a folder.

**Live:** `https://wilsonliciousssssss.github.io/maestro-v/` *(after GitHub Pages is enabled — see Hosting)*

## Quick start

1. Open `index.html` in Chrome or Edge (or serve the folder and browse to it).
2. Press **H** (or the HUD tab) to open the tools panel.
3. Click **Start Mic** and allow microphone access — or **Sound Card** to capture a browser tab/screen (tick **Share audio** in the picker).
4. Pick a scene, go fullscreen with **F**, perform.

> Audio capture needs a secure context: **https** (GitHub Pages is) or `http://localhost`. Opening the file directly (`file://`) also works in Chrome for mic use on most setups.

## Scenes (16)

Matrix Coding · Code Glitch Terminal · Data Constellation · DNA Oscilloscope · Orbit Geometry · Mobius Galaxy · Obsidian Graph · Pixel Missile Barrage · Laser Perspective · Chladni Plate Resonance · Cyber Chladni Nexus · Spectrograph · Atomic Viral Matrix · Iris Kaleidoscope · Firework Multi-Burst Grid · **Hybrid Mix** (layer any of the above)

Every scene maps **low / mid / high** frequency bands to its own motion, plus beat-pulse events. Scene-specific controls appear in the HUD when a scene is active.

## Performance toolkit

- **Beat FX / 4-Beat FX** — audio-driven randomisation of visual controls, per beat or per 4th beat.
- **2-Bar Colour FX** — palette + colour-control shifts every 8 beat pulses.
- **Beat Automation** — scene changes, randomisation and event triggers (fireworks, missiles, mutations) on beat counts.
- **Scene Transition** — timed auto-transitions (sequence or random) with a seconds gap.
- **Text Projection** — multiline centre text with 8 fonts, 10 animation modes, glow, behind/above-scene layering.
- **Custom Colour Module** — pick Primary / Secondary / Accent; drives scene colours and gradients (scene palettes are independent of the brand chrome).
- **Performance Monitor** — FPS, frame time, hybrid load, state counters + Runtime Cleanup.
- **Camera** — wheel zoom, right/shift-drag rotate, **C** reset.

## Keyboard

`H` tools · `M` mic · `S` sound card · `B` Beat FX · `G` 4-beat FX · `V` 2-bar colour FX · `R` randomise · `C` reset camera · `F` fullscreen · `1–9` scenes · `0` atomic · `-` hybrid

## Brand channels

Maestro V wears the **Alpha Omega Collective** identity: ink surfaces, sharp corners, Space Mono HUD, Syne wordmark, and the canvas-drawn pixel-glitch **ΛΩ** mark. The square dots in the HUD header switch the live **channel** — Lime (signature) · Cobalt · Orange · Magenta · Teal — recolouring every HUD accent and the favicon. Your pick persists locally.

## Tech notes

- Vanilla JS + two stacked canvas layers (pseudo-3D + 2D). No frameworks, no CDN runtime dependencies, no network calls (brand webfonts load from Google Fonts with full offline fallback to system mono).
- Structure: `index.html` · `css/style.css` · `js/config.js` · `js/core/` (state, audio, HUD, brand, monitor) · `js/pixi/` + `js/three/` scene modules · `docs/` · `tests/`.
- Smoke test: `node tests/runtime_smoke_test.js` — boots the whole engine headless, exercises all 16 scenes, text projection and the brand channel system.

## Hosting on GitHub Pages

1. Create a public repo (e.g. `maestro-v`) and upload the contents of this folder (with `index.html` at the repo root).
2. Settings → Pages → Deploy from branch → `main` / root.
3. Visit `https://<user>.github.io/maestro-v/`.

## Credits

Built by **DJ7 // Wilsonlicioussss** · an **Alpha Omega Collective** product.

## License

[MIT](LICENSE)
