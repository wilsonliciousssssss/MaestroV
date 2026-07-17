# Maestro V

**ΛΩ · Alpha Omega Collective**

Audio-reactive live visual engine for DJs and live performance. Point it at your mic or sound card and it turns the music into 16 switchable club-visual scenes — zero dependencies, no build step, runs offline straight from a folder.

**Live:** https://wilsonliciousssssss.github.io/MaestroV/

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

## Phones and tablets

Maestro V is desktop-first but adapts by device tier:

- **Phone (portrait)** — **Live mode**: a bottom quick bar (**MIC · FX · ◀ ▶ scene · RND · ⛶**), the HUD opens as a **bottom sheet** (tap the grip to expand) so the visuals stay visible while you tweak, only the core panels start open, and the engine starts in **Lite** performance with trimmed density.
- **Phone (landscape) / tablet** — the full HUD drawer with touch sizing: 44px+ targets, larger sliders and text, 16px inputs (no iOS focus-zoom).
- **Touch camera** — pinch the stage to zoom, drag two fingers sideways to rotate.
- Desktop is untouched.

## Install on your phone

Maestro V is an installable web app (PWA) with the ΛΩ app icon:

- **Android (Chrome/Edge):** open the live URL → ⋮ menu → **Add to Home screen** (or **Install app**).
- **iPhone/iPad (Safari):** open the live URL → Share → **Add to Home Screen**.

It launches fullscreen with the ink ΛΩ icon, and keeps working offline after the first load (service worker cache).

## Brand channels

Maestro V wears the **Alpha Omega Collective** identity: ink surfaces, sharp corners, Space Mono HUD, Syne wordmark, and the canvas-drawn pixel-glitch **ΛΩ** mark. The square dots in the HUD header switch the live **channel** — Lime (signature) · Cobalt · Orange · Magenta · Teal — recolouring every HUD accent and the favicon. Your pick persists locally.

## Tech notes

- Vanilla JS + two stacked canvas layers (pseudo-3D + 2D). No frameworks, no CDN runtime dependencies, no network calls (brand webfonts load from Google Fonts with full offline fallback to system mono).
- Structure: **flat by design** — every file at the repo root (`index.html`, `style.css`, `config.js`, core modules, 15 scene modules, docs) so web-UI uploads can never lose the folder tree.
- PWA: `app.webmanifest` + `sw.js` (network-first, versioned cache) + `icon-*.png` (ink ground, white pixel-glitch ΛΩ, lime dashed frame — AOC primary installable icon rule).
- Smoke test: `node runtime_smoke_test.js` — boots the whole engine headless, exercises all 16 scenes, text projection and the brand channel system.

## Hosting on GitHub Pages

1. Upload ALL files in this folder to the repo root (no folders — the layout is flat on purpose; `index.html` must sit at root).
2. Settings → Pages → Deploy from branch → `main` / root.
3. Visit `https://<user>.github.io/<repo>/`.

## Credits

Built by **DJ7 // Wilsonlicioussss** · an **Alpha Omega Collective** product.

## License

[MIT](LICENSE)
