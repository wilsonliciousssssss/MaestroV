# Maestro V — Architecture

> Written at V50; layer structure unchanged since. Branding layer (js/core/brand.js) added at V107.

V50 uses two local Canvas2D layers and no external CDN dependencies.

## Layers

1. `threeCanvas`
   - DNA Oscilloscope
   - Mobius Galaxy
   - pseudo-3D projected geometry

2. `pixiCanvas`
   - Matrix Coding
   - Data Constellation
   - Orbit Geometry
   - Obsidian Graph
   - Pixel Missile Barrage
   - Laser Perspective
   - Slash Wave Fabric
   - gradients, scanlines, and 2D overlays

## Shared Systems

- `AudioEngine`: microphone, bass, mid, high, beat pulse, BPM estimate
- `VisualState`: scene, palette, performance mode, visual controls
- `HudController`: buttons, sliders, dropdown, keyboard shortcuts

## Design Direction

V50 is a feature-recovery build that ports missing scenes into the stable local-canvas hybrid branch. It is intended as a safer base before migrating again to true WebGL / PixiJS / Three.js rendering.
