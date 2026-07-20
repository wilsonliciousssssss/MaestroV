# Changelog — Maestro V

Newest first. Public product name: **Maestro V** (Alpha Omega Collective). Internal build numbers continue the original engine series.

## V120 — Chladni Plate: band-readout numbers around the box (2026-07-20)

- Added a **live HUD readout ringing the plate**: numeric ticks along each edge that pulse in value + brightness with the audio — **bottom = LOW/bass, top = HIGH, left & right = MID** — plus explicit `LO / MD / HI` percent labels above the box. Channel-coloured, mono, drawn inside the plate frame. Cosmetic overlay only.

## V119 — Chladni Plate: denser lines + stronger ripple (2026-07-20)

- **More lines**: marching-squares now traces **five contour levels** (the bright F=0 nodal lines plus flanking ± iso-lines) for a rich topographic web instead of a single line set; higher default modes (4:7) and Line Detail (96, cap 160) add further detail.
- **Stronger ripple**: the mid-driven travelling wave is now **two octaves** with a larger amplitude, and the Mid Ripple default is up (58). Bass phase-travel/flex and high shimmer unchanged.

## V118 — Chladni Plate: vibrating nodal lines (2026-07-20)

- **Reworked the Plate to match the neon-line theme and be continuously audio-reactive** (replacing V117 sand grains, which read off-theme and only really moved on beats). Marching-squares now traces the **F=0 nodal contours** of the classic figure each frame and draws them as **glowing channel-coloured lines** (in keeping with Constellation/DNA/Obsidian). The lines **vibrate and travel with the music**: **bass** drives the standing-wave phase (lines travel) + flexes/breathes the whole figure, **mid** sends a travelling ripple along the lines (Mid Ripple slider), **high** adds per-vertex shimmer (High Shimmer slider). Beat still metamorphoses to a new mode (crossfade + flash). Controls relabelled: Line Detail / Line Glow / Plate Life / Mid Ripple / Line Brightness / High Shimmer.

## V117 — Chladni Plate: real sand migration (2026-07-20)

- **Chladni Plate Resonance rebuilt as the physical experiment** (all four proposed upgrades): thousands of **persistent grains** now bounce where the plate vibrates (antinodes) and settle on the quiet **nodal lines**, chasing the figure by gradient-descent on |F| — so when the mode **metamorphoses on the beat you watch the sand herd** across the plate into the new figure. **Continuous phase drift** keeps it alive between beats (Plate Life slider). A faint **energy-field tint** reads the figure under the sand. A **bowed edge-exciter** pulses on bass and its ripple shakes the plate, re-scattering grains. Settled grains **sparkle** on highs. Field sampled from a precomputed grid buffer; grain count scales with Grain Density + perf. Control labels updated (Node Snap / Plate Life / Grain Brightness).

## V116 — Remove Cyber Chladni Nexus (2026-07-20)

- **Removed the Cyber Chladni Nexus scene** at Wilson's request — scene list is now 15 (Chladni Plate Resonance stays). Dropped from config scenes + its control block, index.html script include, pixiLayer draw dispatch, README; `chladniCyberScene.js` deleted; smoke-test guard updated. Zero dangling references. Keyboard scene shortcuts unaffected (Nexus was #11; 1–9 map to the first nine, atomic/hybrid by id).

## V115 — Cyber Chladni animated heatmap (2026-07-20)

- **Cyber Chladni Nexus now animates and persists like a heatmap.** Root cause of "static": the V114 field had no continuous time term, so between beat-triggered mode changes nothing moved. Added continuous **phase drift + a slow travelling term** to the standing wave (scaled by Speed and Circuit Drift) so the plate is alive between beats. Each pixel now feeds a **heat buffer** that rises instantly to the current antinode energy and **cools gradually** — thermal-camera persistence, so the figure blends down into a soft radial background wash as it fades. Circuit Drift doubles as the heat-tail length (snappy → long smear); additive thermal bloom overlaps neighbours for a smooth heatmap. Beat metamorphosis + RGB-split glitch retained.

## V114 — Cyber Chladni pixel/gradient + mobile audit fixes (2026-07-18)

- **Cyber Chladni Nexus restyled to gradient + pixel.** The classic Chladni figure now renders as a chunky **LED pixel grid**: each pixel is a gradient blend of the channel palette by antinode energy (low→p.b, mid→p.a, hot→p.c), nodal lines read as dark gaps, with a CRT scanline dim, additive antinode bloom, and an **RGB-split pixel glitch** on the beat-quantised mode metamorphosis. "Grid Density" now controls pixelation (lower = chunkier); "Node Width" controls nodal-gap crispness. Palette stops are colour-piped once per frame then int-lerped per pixel (no rgba-cache thrash).
- **Mobile/tablet audit fixes**: (1) `touch-action:none` on the stage for **all touch devices** (was phones only) so a tablet two-finger pinch drives the camera instead of the browser's page-zoom; (2) with the phone bottom-sheet open, the floating HUD tab now lifts to the top-right as a clear close control instead of overlapping the sheet; (3) rotating a phone into portrait now re-applies the Lite-perf profile + DPR cap (were first-load only).

## V113 — Scene refinements: Chladni, Orbit, Laser (2026-07-18)

- **Chladni Plate + Cyber Chladni — real Chladni figures, two distinct digital expressions.** Both now use the classic square-plate superposition F = cos(nπx)cos(mπy) ± cos(mπx)cos(nπy), so the pattern reads as ONE coherent symmetric figure, and both **metamorphose** (crossfade to a new mode on a beat, never pop). Plate = **stippled precision** (fine monochrome node dots on a near-black plate, mode readout, restrained shimmer). Nexus = **circuit flow-light** (contour-tangent neon segments so nodal lines read as curves, junction boxes at saddle points, additive tracer pulses running the contours, RGB-split glitch on mode change). Separable precompute keeps them cheap.
- **Orbit Geometry — reverted to the flat concentric original and thinned.** Line weights follow existing scenes (rings ~0.5×, polygons ~0.4×, spokes 0.4 of the Line Weight control), lower alphas, smaller dots — a precise instrument, not neon hoops. (V112 gyroscope dropped.)
- **Laser Perspective — full revert to the V111 look** (jittering vanishing-point beams; V112 fan-sweeps/strobe removed).
- No other scenes touched.

## V112 — Scene Upgrade Pack (2026-07-17)

- **Hybrid Mix removed from scene transitions**: auto-transitions and beat-automation scene changes never pull you OUT of Hybrid Mix any more (they already never landed on it); manual buttons unchanged.
- **Engine lift**: shared **BeatBus** beat/bar clock (events can land ON the kick); **additive neon pass** (`lighter` compositing) for true flashes; 3D layer fade now **honors the Trails slider** (DNA/Mobius no longer permanently dim); colour pipeline memo-cached; **dropdown option lists themed** (were washed-out white).
- **Bottom-four rescue**:
  - *Orbit Geometry* → 3-axis **gyroscope** (bass/mid/high ring groups, perspective depth, beat-quantised 45° rotation snaps, bass breathing, additive beat ring).
  - *DNA Oscilloscope* → kick-driven **unzip** (rails part, rungs snap, re-anneal), depth-shaded front/back rails, high-band ionization sparks (additive).
  - *Obsidian Graph* → **bass finally mapped**: beat gravity-lurch toward hubs with springy return, bass-widened mesh, band-coloured data pulses along edges, additive hub flashes.
  - *Laser Perspective* → **club choreography**: beat-quantised mirrored fan sweeps with easing, downbeat strobe, volumetric beam cores + source haze cones, light running down beams.
- **Flagship fixes**:
  - *Spectrograph* → **real FFT** (64 log-spaced analyser bins drive rows + waterfall; synth stays as texture/fallback); waterfall lifted to visible.
  - *Pixel Missile Barrage* → detonations **hold and fire on the beat** (mega waits for the downbeat).
  - *Firework Multi-Burst* → **rocket rise phase** (sparkling ascent, detonates at apex on the beat) + additive flash core.
  - *Iris Kaleidoscope* → alpha lift (was washed out), beat-quantised **aperture snaps**, downbeat light burst through the pupil.
- Smoke test extended (hybrid-transition guard, BeatBus, kick-path passes over upgraded scenes).

## V111 — Public README (2026-07-17)

- README rewritten for a public audience: enjoy-visuals-with-your-music framing, 30-second start, privacy note (audio analysed locally, nothing uploaded), phone install, About Me (DJ7 · Wilsonlicioussss), Instagram + blog links, BeatGenome cross-link, developer footer.
- Docs-only release — engine, scenes, brand and mobile layer identical to V110. Version numbers aligned to V111.

## V110 — Responsive: phones + tablets (2026-07-17)

- **New `mobile.js` touch layer** (desktop untouched — activates only on touch devices):
  - **Phone portrait = Live mode**: fixed bottom **quick bar** (MIC · Beat FX · prev/next scene · Randomise · fullscreen, which hides on iOS where the API doesn't exist); HUD converts to a **bottom sheet** (62dvh, grip toggles 94dvh) so visuals stay visible while adjusting; only Performance + Scene Controls panels start open; engine defaults to **Lite** perf with density/glow trimmed; canvas DPR capped at 1.5.
  - **Tablets + landscape phones**: full HUD drawer with the touch layer.
  - **Gestures**: pinch = camera zoom, two-finger horizontal drag = camera rotate (existing camera API, sliders stay in sync).
- **Text/UI scaling** (`body.touch-ui` CSS ramp): labels/notes 9→11px, buttons 10→12px (min-height 44px), panel titles 11→13px, selects/inputs 16px (prevents iOS focus-zoom), slider tracks 30px with 22×30 thumbs, meters 24px, channel dots 20px.
- **Layout plumbing**: `viewport-fit=cover` + safe-area insets (sheet, quick bar, HUD tab), `100dvh` HUD, `touch-action` hygiene, HUD tab becomes a floating square above the quick bar on phones.
- Engine/scene logic untouched; smoke test extended (mobile defaults, scene cycling). Cache-busters `?v=110`, SW cache `maestrov-v110` (core list corrected to real request URLs).

## V109 — Installable app icon + PWA (2026-07-17)

- **Home-screen install with the ΛΩ logo**: real PNG app icons (180/192/512 + 512 maskable) — ink ground, white pixel-glitch ΛΩ, lime dashed pixel frame (the AOC primary-installable-icon rule).
- `app.webmanifest` (name, fullscreen display, ink background, lime theme) + iOS metas (`apple-touch-icon`, web-app-capable, title).
- `sw.js` service worker: network-first with versioned cache — the installed app keeps working offline after first load.
- Static favicon fallback = icon-192 (brand.js still recolours the tab icon per channel at runtime).
- Engine/scenes untouched. Cache-busters bumped to `?v=109`.

## V108 — Flat repo layout (upload-proof) (2026-07-16)

- **Why:** the first GitHub web-UI upload flattened the folder tree and dropped/corrupted files (`index.html`, `style.css`, `brand.js`, `audioEngine.js` missing; `config.js` ended up containing manifest JSON) — Pages served the README instead of the app.
- **Fix:** the whole app is now **flat by design** — all files at the root, no folders to preserve. `index.html` references `./file.js?v=108`; smoke test and `npm test` updated; docs files live at root.
- No engine/scene/brand logic changes from V107.

## V107 — Alpha Omega Collective rebrand + public release prep (2026-07-16)

- Renamed product **Maestro → Maestro V**; title, HUD wordmark, boot labels, manifest updated.
- **Alpha Omega Collective brand layer**: HUD re-skinned onto the AOC design tokens (ink `#0E0E10` / space `#08080C` surfaces, `#F4F4F0` text, sharp corners everywhere).
- **Channel switcher** (new `js/core/brand.js`): 5 AOC channels — Lime `#C6F000` (signature, default), Cobalt `#3E6BFF`, Orange `#FF5A2C`, Magenta `#FF2E9A`, Teal `#7EE8D0`. One click recolours every HUD accent (active buttons, meters, slider thumbs, status pill, focus rings); choice persists in localStorage.
- **Pixel-glitch ΛΩ mark**: canvas-drawn (zero image dependencies) in the HUD header and as a per-channel favicon with the dashed pixel edge frame; `theme-color` follows the channel.
- Brand typography: **Syne** wordmark + **Space Mono** HUD (Google Fonts, `display=swap`, system-mono fallback keeps the app fully offline-capable).
- Scene palettes untouched — they are performance content, not brand chrome.
- Repo prep: README rewritten for public GitHub, dev history moved here, MIT `LICENSE`, `.gitignore`, smoke test moved to `tests/runtime_smoke_test.js` (made path-portable + brand-system assertions added), `?v=107` cache-busters on local assets.
- No engine/scene logic changes.

---

# Pre-V107 development history

Carried verbatim from the development README (engine series V44 → V106).

## V61 Audio Source Update

Added sound-card / tab-audio capture using the browser screen-share audio pathway. Use the **Sound Card** button, then select a browser tab/window/screen and make sure **Share audio** is enabled when the browser asks.

Notes:
- Microphone mode still works.
- Sound-card capture depends on browser support and permissions.
- For Chrome/Edge, sharing a tab with audio is usually the most reliable option.
- Keyboard shortcut: **S** starts sound-card capture.


## V61 Four-Beat Beat FX

Added a **4-Beat FX** toggle. When Beat FX is ON and 4-Beat FX is also ON, visual-control randomisation waits for every fourth detected beat/bass pulse before changing values.

Use this for more musical, phrase-based changes:
- Beat FX ON = activates automatic audio-driven visual changes.
- 4-Beat FX ON = changes only on every 4th beat/bass pulse.
- Keyboard shortcut: **G** toggles 4-Beat FX.


## V61 HUD Reskin
- Updated the control HUD to a monochrome technical dashboard style inspired by the provided reference.
- Product name changed to Maestro.
- Restyled buttons, panels, meters, sliders, and overall interface hierarchy.


## V61 Scene Visibility Hotfix
- Fixed upper 2D canvas black fade that could cover lower 3D scenes.
- DNA and Mobius now remain visible because the upper canvas fades to transparency.
- Added safe scene draw wrappers so one scene error does not stop the other scenes.
- Kept Maestro HUD design from V56.


## V61 Camera Control Fix
- Camera zoom and camera rotation now apply globally to both visual layers.
- Mouse wheel over the stage adjusts camera zoom.
- Right-drag or Shift-drag over the stage adjusts camera rotation.
- Added Reset Camera button and C keyboard shortcut.
- Fixed Orbit Geometry double-zooming by removing its local camera zoom transform.


## V61 Slider Control Check
- Verified slider registration and rendering usage.
- Connected global colour sliders to all scene drawing through the shared `rgba()` colour pipeline:
  - Hue Shift
  - Saturation
  - Brightness
  - Contrast
  - Color Cycle
- Connected Gradient Opacity to the gradient renderer.
- Connected Pulse to the shared audio-reactive draw pass.
- Connected Pixel Size to matrix accent pixels and missile pixel bodies/fragments.
- Connected Hybrid Mix and Hybrid Scene Depth to hybrid layer opacity.


## V61
- Added 2-bar Colour Beat FX toggle.
- Colour changes now react to beat/bass pulse counting and shift palette every 8 beat pulses (2 bars in 4/4).
- On each 2-bar trigger, Maestro updates palette, hue shift, saturation, brightness, contrast, color cycle, and gradient settings.
- Added HUD button, readout, and V keyboard shortcut for Colour Beat FX.


## V61 Custom Colour Module
- Added custom colour picker module in the Colour + Gradient panel.
- User can click colour boxes for Primary, Secondary, and Accent colours.
- Selected colours affect all scene colours through the shared scene palette.
- Selected colours also drive gradient effects.
- Added Custom Colours On/Off toggle so user can switch between preset palettes and selected colours.


## V62 Text Projection Module
- Added a centre text projection module.
- Added projected text input with multiline support.
- Added text size, letter spacing, and line spacing controls.
- Added font theme selection with cyber / programmer style options.
- Added colour source selection linked to the active palette and colour controls.


## V63 Matrix Scene Controls
- Added Matrix font-size control.
- Added Matrix line-spacing control.
- Added Matrix random font-size control for varied code stream sizing.


## V64 Text Projection Upgrade
- Added Text Behind Scene toggle.
- Added Text Above Scene toggle.
- Added 3 more numbered font options (8 total).
- Added Text Glow control.
- Added Glow Colour source selector.
- Font selector is now labelled and presented as numbered font choices.


## V66 Text Motion Controls
- Added text rotation / angle control.
- Added text X and Y position controls.
- Added text opacity control.
- Added text animation mode selector with Pulse, Flicker, Scan, Drift, and Type-On.

## V66 Text Transform + Animation Controls
- Added Text Scale X and Text Scale Y controls.
- Added per-line text alignment selector: Left, Center, Right.
- Added text animation speed control.
- Added 5 additional text animation modes: Wave, Glitch, Zoom, Spin, Bounce.


## V67 Iris Kaleidoscope Scene

Added **Iris Kaleidoscope** as a new audio-reactive Pixi / 2D canvas scene.

Key controls:
- Symmetry Slices
- Iris Petal Length
- Pupil Aperture
- Prism Complexity
- Iris Rotation
- Breathing Pulse
- Spark Particles
- Iris Fibre Density
- Portal Depth

The scene is also included in Hybrid Mix and works with the existing palette, glow, pulse, density, speed, scanline, audio-reactive, transition, and text projection systems.


## V69 Data Constellation Upgrade

Updated **Data Constellation** with a richer symbol-based network system.

New visual features:
- Mixed point symbols including glowing dots, `*` star-like markers, `+` markers and rings
- Distance-based linking with solid and dashed connection behaviour
- Signal hubs with framed markers
- Travelling spark pulses running along active links
- Stronger audio reactivity for low, mid and high frequencies

New scene controls:
- Symbol Mix
- Signal Hubs
- Link Pulse


## V69 Constellation + Kaleidoscope Refinement

- Data Constellation now uses a sharper technical look built from lines, frames, boxes, stars, plus signs and travelling data packets instead of a glow-heavy style.
- Iris Kaleidoscope now has stronger mirrored shards, sharper segmented rings, recursive frame boxes, and more obvious kaleidoscopic structure.


## V70 Data Constellation Drift Control

Data Constellation now includes direct control over **symbol size** and **center pull**.

Changes:
- Added **Symbol Size** slider for dots / symbols
- Added **Center Pull** slider so the network can drift more freely instead of collapsing toward the center
- Updated motion logic so nodes wander more randomly with individual drift behaviour
- Hubs still retain a light orbit pull while normal nodes feel more distributed across the field


## V71 Data Constellation Modes

Data Constellation now includes:
- **Dot Size** and **Symbol Size** as separate controls
- **Drift Mode** with 3 behaviours: `0 = Free Drift`, `1 = Center Pull`, `2 = Cluster Mode`
- **Cluster Count** to create multiple constellation groups

Behaviour notes:
- Free Drift keeps the field loose and random
- Center Pull restores the classic attractor behaviour
- Cluster Mode forms multiple moving network groups


## V72 Firework Burst Grid

Added a new scene: **Firework Burst Grid**.

Features:
- fireworks burst from random points across the screen
- uses **dots and lines** only for a clean technical look
- each burst varies in size and pattern
- audio reactive mapping:
  - **Low / bass** = larger burst scale and stronger ring pulses
  - **Mid** = more structural spoke lines and denser radial geometry
  - **High** = more sparkle dots, shimmer and faster spark tails


## V73 Firework Multi-Stage Upgrade

Firework Burst Grid has been upgraded with:
- **Multistage fireworks** with child bursts
- **Shape Mode** slider
  - `0 = Random`
  - `1 = Sphere`
  - `2 = Fan`
  - `3 = Chrysanthemum`
  - `4 = Spiral`
- **Stage Depth** control
- **Beat-triggered mega bursts** driven by stronger beat peaks
- **Mega Burst Sense** control for how easily large bursts trigger

Audio mapping:
- **Low / bass** = larger outer expansion, stronger segmented rings and mega-burst mass
- **Mid** = denser spoke geometry and stronger structural burst lines
- **High** = more spark dots, longer tails, faster shimmer, especially in spiral bursts


## V74 Firework Scene UI Controls

Added dedicated scene UI controls for the Firework Multi-Burst scene:
- **Multistage Fireworks** select with Single Stage / Two Stage / Three Stage
- **Burst Shape Mode** select with Random / Sphere / Fan / Chrysanthemum / Spiral
- **Random Fireworks** button to randomise firework scene parameters
- **Random Shape** button to quickly cycle into a random non-random shape mode

These controls sit above the firework scene sliders and sync with the underlying scene parameters.


## V75 Firework Child Bursts + Dust

Added:
- **Child Bursts** slider to control how many secondary bursts spawn from each firework stage.
- **Dust dots after burst** for a softer lingering tail after each explosion.
- Random Fireworks now also randomises the child burst amount.

Scene behaviour update:
- dust dots appear after the main burst expansion and drift outward while fading
- mega bursts generate slightly denser dust trails
- child bursts still respect stage depth and shape mode


## V76 Firework Dust Controls + Manual Trigger

Added:
- **Dust Amount** slider for the number of lingering dust dots after each firework burst.
- **Dust Size** slider for the scale of the dust dots.
- **Trigger Firework** button in the Firework Scene UI to spawn a manual burst on demand.

Also updated:
- Random Fireworks now randomises dust amount and dust size as well.
- Dust dots now scale directly from the scene controls.


## V77 Iris Opacity + Shape Animation

Updated the Iris Kaleidoscope scene with a cleaner and more animated visual language.

Added iris controls:
- **Iris Opacity**
- **Iris Glow**
- **Petal Motion**
- **Morph Speed**

Visual updates:
- reduced default iris colour opacity
- reduced glow and bloom intensity
- animated iris shard / petal deformation
- stronger layered counter-rotation
- more animated fibres and iris ring motion
- aperture breathing remains active but now works with the new shape motion


## V78 Iris Presets + Advanced Motion

Added an upgraded Iris Scene UI and more detailed iris motion controls.

New iris controls:
- **Inner Rotation**
- **Outer Rotation**
- **Pupil Pulse**
- **Fibre Shimmer**
- **Symmetry Warp**

New Iris Scene UI:
- **Soft Iris**
- **Mechanical Iris**
- **Organic Iris**
- **Aggressive Iris**
- **Random Iris**
- **Low Glow Iris**

The iris scene now has more expressive shape animation, more controllable pupil breathing, clearer fibre shimmer, and stronger symmetry warping while keeping the reduced-opacity / reduced-glow direction from V77.


## V79 Firework Stage Randoms + Spread

Added more firework randomisation control and improved stage spacing.

New firework UI additions:
- **Random 1 Stage**
- **Random 2 Stage**
- **Random 3 Stage**

Behaviour updates:
- these buttons randomise the firework scene while forcing the selected stage depth
- stage 2 child bursts are now slightly more spread out
- stage 3 child bursts are spread out further for a wider layered explosion


## V80 Random Stage Firework Mode

Added a proper **Random Stage** mode for the firework scene.

Updates:
- **Multistage Fireworks** dropdown now includes **Random Stage**
- added **Random Stage Mode** quick button in the Firework Scene UI
- when Random Stage is active, each new burst chooses **1-stage**, **2-stage**, or **3-stage** automatically
- the existing **Random 1 Stage**, **Random 2 Stage**, and **Random 3 Stage** buttons still remain for fixed-stage randomisation

This makes the firework scene feel more varied over time instead of locking the scene to a single stage depth.


## V81 Missile Audio Reactivity Upgrade

Upgraded the **Pixel Missile Barrage** scene to feel more alive and more musically responsive.

New missile controls:
- **Target Scatter**
- **Trail Length**
- **Guidance Motion**

Audio response improvements:
- **Low / bass** now affects launch intensity, missile lift, and explosion ring size / weight
- **Mid** now drives missile guidance sway, targeting lines, and lock-box activity
- **High** now drives engine flicker, spark detail, trail accents, and burst particle energy

Visual improvements:
- more structured launch pads
- stronger missile trails with line and box accents
- persistent explosion bursts with rings, fragments, and split streaks
- more readable scene rhythm overall


## V82 Missile Scene UI + Barrage Modes

Expanded the **Pixel Missile Barrage** scene with direct scene UI controls and more varied missile behaviour.

New missile scene UI:
- **Barrage Mode**: Random / Vertical / Side / Crossfire
- **Split Mode**: Random / Rare / Normal / Heavy
- **Explosion Mode**: Random / EMP Rings / Burst Sphere / Shrapnel / Ring Pulse
- **Random Missiles** button
- **Random Barrage** button
- **Random Explosion** button
- **Trigger Missile** manual launch button

New missile controls:
- **Reticle Size**
- **Engine Flicker**

Scene improvements:
- manual missile triggering
- barrage direction variety
- explosion style variety
- stronger target reticle behaviour
- richer low / mid / high audio response


## V83 Missile Target Lock + Shockwave

Added stronger launch and impact behaviour to the **Pixel Missile Barrage** scene.

New missile controls:
- **Launch Shockwave**
- **Target Lock Strength**
- **Impact Warning Pulse**
- **Mega Missile Power**

New scene behaviour:
- launch shockwave rings at missile ignition
- stronger animated target-lock reticles
- impact warning pulse near detonation
- **Trigger Mega Missile** button for heavier manual launches


## V84 Missile Types + Cluster Split

Expanded the **Pixel Missile Barrage** scene with more missile identities and visible cluster behaviour.

New missile controls:
- **Cluster Split Amount**
- **Heavy Rocket Chance**

New Missile Scene UI:
- **Missile Type**: Random / Standard / Fast Dart / Heavy Rocket / Cluster Missile / Guided Missile
- **Random Type** button

Scene improvements:
- visible cluster child missiles
- fast dart / heavy rocket / guided missile behaviour
- better type variety in manual and random launches


## V85 Missile Debris + EMP Enhancement

Expanded the **Pixel Missile Barrage** scene with debris and stronger EMP behaviour.

New missile controls:
- **Debris Amount**
- **Debris Gravity**
- **Debris Lifetime**
- **EMP Radius**
- **EMP Ring Count**
- **Interference Strength**

Scene improvements:
- falling impact debris after burst
- stronger EMP ring visuals
- tactical grid interference during EMP events
- more distinct EMP / burst / shrapnel visual identity


## V86 Hybrid Firework + Missile Fix

Fixed Hybrid Mix stability when **Firework Multi-Burst Grid** and **Pixel Missile Barrage** are active together.

Fixes:
- namespaced missile helper functions to prevent global helper collisions with other Pixi scenes
- added hybrid-safe drawing for firework and missile scenes
- clamped missile / firework particle state in Hybrid Mix to avoid over-spawning and frame stalls
- reduced firework / missile audio intensity slightly only inside Hybrid Mix
- adjusted firework child-burst spawning to use the active canvas dimensions instead of raw window dimensions

V86 keeps the V83, V84 and V85 missile upgrades.


## V87
- Expanded Atomic Viral Matrix with multiple atom and virus families, layered micro-particles, low/mid/high audio mapping, interaction behaviour, mutation/fusion/swarm events, and Atomic Scene UI presets.


## V88
- Added stronger Atomic Viral Scene UI layout with full preset button grid.
- Added random atomic scene button, random preset button, and manual random event trigger.
- Added manual mutation and fusion trigger buttons.
- Added Dot Size and Spread Amount controls for the Atomic Viral scene.
- Spread atoms, viruses, and particles further from centre for a cleaner composition.
- Optimised Atomic Viral behaviour inside Hybrid Mix with state clamping and lighter audio feed.


## V89 Stability Refactor

V89 is a stability-focused release.

Main updates:
- Namespaced older scene helper functions to reduce global collision risk.
- Added reset / trim helpers for state-heavy scenes where practical.
- Improved Hybrid Mix cleanup by allowing scenes to trim their own runtime state.
- Added lightweight scene-change cleanup hook.
- Kept visual features from V88 while focusing on stability and maintainability.


## V90 UI Organisation Upgrade

V90 is focused on live usability.

Main updates:
- Added collapsible HUD panels to reduce control clutter.
- Kept the live-critical panels open by default: Performance, Audio Reactive Hub, and Scene Controls.
- Added a compact Live Cockpit strip showing scene, audio state, and performance mode.
- Improved text projection helper notes.
- Preserved V89 stability/refactor improvements.


## V91 Beat Automation

V91 adds beat-based automation for live performance.

New:
- Beat Automation panel.
- Automation On / Off.
- Trigger Auto Event.
- Randomise Active Scene.
- Scene Every Beats.
- Event Every Beats.
- Randomise Every Beats.

Automation can:
- change scenes on beat counts,
- randomise the active scene controls,
- trigger Firework bursts,
- trigger Missile launches / mega missiles,
- trigger Atomic Viral mutation/fusion/swarm events,
- push Iris pupil/symmetry motion.


## V92 Performance Monitor

V92 adds a live runtime monitor.

New:
- FPS readout.
- Frame time readout.
- Active scene readout.
- Hybrid layer count.
- Audio state and source.
- Firework / Missile / Atomic scene state counters.
- Automation status readout.
- Monitor On / Off.
- Runtime Cleanup button.

The Runtime Cleanup button trims state-heavy scene arrays for Firework, Missile and Atomic Viral scenes.


## V93 Code Glitch Terminal Scene

V93 adds a brand-new 2D Pixi-style coding / programming visual scene.

New scene:
- **Code Glitch Terminal**

Scene features:
- multi-window programming / terminal layout
- scrolling code streams
- connector links and signal nodes
- glitch bars and RGB split artifacts
- programming snippets and status headers
- audio-reactive low / mid / high behaviour

Audio mapping:
- **Low / Bass**: panel pulse, sweep bands, horizontal glitch bars
- **Mid**: link motion, window drift, code scroll movement
- **High**: character flicker, RGB split, glitch fragments, cursor accents


## V94 Mobius Galaxy Upgrade

V94 upgrades the Mobius Galaxy scene into a more premium cosmic topology visual.

New Mobius features:
- 3D ribbon depth illusion.
- Ribbon width control.
- Surface grid / topology mesh.
- Moving signal particles along the ribbon.
- Galaxy depth layers and dust.
- Bass-driven gravity pulse.
- Lens distortion / wormhole rings.
- High-frequency edge shimmer.
- Mobius mode control.
- Mobius Scene UI presets.

Presets:
- Clean Topology
- Galaxy Wormhole
- Data Mobius
- Neon Ribbon
- Chaos Twist


## V95 Mobius Hotfix

V95 fixes the broken/heavy V94 Mobius upgrade.

Fixes:
- Reduced Mobius default density and particle counts.
- Added hard render caps for normal and Hybrid Mix modes.
- Added Mobius `trimForHybrid()`.
- Added a lightweight fallback Mobius renderer if the detailed renderer fails.
- Exposed `MobiusGalaxyScene` on `window` for safer runtime access.
- Included Mobius in Runtime Cleanup.
- Kept the V94 upgraded concept, but made it safer and lighter.


## V96 Launch Hotfix

V96 fixes a launch-blocking HUD runtime error introduced by the V90 UI cockpit patch and carried forward.

Fixes:
- Restored missing `updateLiveCockpit()` method.
- Cached Live Cockpit DOM references safely.
- Restored safe collapsible-panel initialisation.
- Updated boot error label to V96.
- Added a browser-style launch smoke test during packaging.


## V97 Code Glitch Upgrade

V97 upgrades the Code Glitch Terminal scene into a fuller performance-ready scene.

New Code Glitch features:
- Dedicated Code Glitch Scene UI.
- Preset buttons:
  - Clean Terminal
  - Hacker Rain
  - System Breach
  - Data Network
  - Corrupt Core
- Manual event buttons:
  - Glitch Burst
  - System Breach
  - Corrupt Core
- Expanded code snippet library.
- Typing cursor effects.
- Scanline strength control.
- Central command/core panel.
- Binary rain control.
- Corruption spread control.
- Hybrid-safe caps and trim support.

Audio mapping:
- Low / Bass: terminal pulse, sweep bands, heavy corruption bars.
- Mid: network reroute, panel drift, code scroll movement.
- High: cursor flicker, RGB split, scrambling, glitch fragments.


## V98 Slash Wave Fabric Upgrade

V98 upgrades the Slash Wave Fabric scene with stronger low / mid / high audio reactivity.

New Slash scene improvements:
- multi-layer fabric mesh
- low-frequency fabric bulge and slash shockwaves
- mid-frequency weave drift, shear and ripple motion
- high-frequency shard fragments and spark accents
- new controls for Fabric Layers, Ripple Strength, Weave Drift, Shard Amount and Slash Trail Length


## V99 Topography Flow Field Scene

V99 changes the former Slash Wave Fabric scene into a Topography Flow Field scene.

New Topography scene features:
- animated contour-line terrain map
- topographic hill / basin contour islands
- low-frequency elevation swell and bass pulse
- mid-frequency ridge drift and terrain flow
- high-frequency fine contour detail and tracer highlights
- new controls for Contour Density, Terrain Layers, Elevation Scale, Contour Spacing, Terrain Drift, Fine Detail, Bass Pulse, and Tracer Amount


## V100 Mountain Topography Refinement

V100 refines the Topography scene so it reads much more clearly as mountain terrain.

Improvements:
- stronger mountain-peak contour nests
- clearer summit rings
- ridgeline / saddle connectors between peaks
- broader field contours warped by mountain elevation
- preserved low / mid / high audio reactivity


## V101 Topographic Spectrograph

V101 modifies the former Mountain Topography scene into a spectrograph-style topography scene.

Improvements:
- spectrograph-style contour bands
- clearer low / mid / high frequency-zone shaping
- vertical time markers and live scan cursor
- stacked contour islands that still retain topographic character
- stronger spectral drift and tracer motion


## V102 Spectrograph Scene

V102 removes the remaining topography direction from the former Topographic Spectrograph scene and turns it into a pure Spectrograph scene.

Improvements:
- removed topography / terrain emphasis
- focused on stacked spectral bands
- clearer low / mid / high zones
- spectral activity nodes
- live sweep cursor and moving tracers


## V103 Spectrograph Effects Upgrade

V103 upgrades the Spectrograph scene into a cleaner and more feature-rich pure spectrograph.

Improvements:
- removed the remaining circle / topography-like emphasis
- added waterfall history / spectral memory
- added vertical energy spikes
- added peak-hold markers
- added heatmap glow zones
- added high-frequency spark particles


## V104 Spectrograph Line Definition Fix

V104 reduces heatmap glow and improves spectral line clarity.

Changes:
- Reduced heatmap/waterfall alpha.
- Reduced glow blur and particle glow.
- Kept heatmap as a soft background layer only.
- Increased spectral line alpha and stroke definition.
- Preserved spikes, peak-hold markers, sweep cursor and tracers.


## V105 Chladni Plate Resonance Scene

V105 adds a new Chladni Plate inspired scene.

New scene features:
- square resonance plate layout
- nodal line patterns inspired by Chladni figures
- sand-grain accumulation on nodal lines
- low / mid / high audio-reactive mode variation
- line-definition and sparkle controls


## V106 Cyber Chladni Nexus Scene

V106 adds a second Chladni-inspired scene with a stronger cybernetic identity.

New scene features:
- neon nodal traces inspired by Chladni figures
- cyber frame, HUD grid and scanning sweep lines
- circuit-node boxes and glowing data nodes
- low / mid / high audio-reactive resonance behaviour
