# V88 Notes

- Fixed Hybrid Mix issues when Firework and Missile layers are active.
- Namespaced missile scene helper functions to avoid global helper conflicts with other scenes.
- Added hybrid-safe draw handling for Firework and Missile scenes.
- Added Hybrid Mix state caps for high-particle Firework and Missile systems.
- Reduced Firework and Missile audio intensity slightly only inside Hybrid Mix for better stability.
- Updated firework child-burst spawning to use active canvas dimensions.

# V85 Notes

- Added missile controls: Debris Amount, Debris Gravity, Debris Lifetime, EMP Radius, EMP Ring Count, Interference Strength.
- Added falling debris after impacts.
- Added EMP pulse rings and tactical grid interference.
- Improved differentiation between EMP, burst sphere, shrapnel, and ring pulse explosions.

# V84 Notes

- Added missile controls: Cluster Split Amount and Heavy Rocket Chance.
- Added **Missile Type** selector to the Missile Scene UI.
- Added **Random Type** button.
- Added missile type behaviours: Standard, Fast Dart, Heavy Rocket, Cluster Missile, Guided Missile.
- Added visible cluster child missiles and mini follow-up impacts.

# V83 Notes

- Added missile controls: Launch Shockwave, Target Lock Strength, Impact Warning Pulse, Mega Missile Power.
- Added **Trigger Mega Missile** button in the Missile Scene UI.
- Added launch shockwave rings for ignition.
- Improved target-lock reticles and impact warning behaviour.
- Added larger manual mega-missile launches with stronger explosion weight.

# V82 Notes

- Added **Missile Scene UI** for Pixel Missile Barrage.
- Added **Barrage Mode** selector: Random / Vertical / Side / Crossfire.
- Added **Split Mode** selector: Random / Rare / Normal / Heavy.
- Added **Explosion Mode** selector: Random / EMP Rings / Burst Sphere / Shrapnel / Ring Pulse.
- Added **Random Missiles**, **Random Barrage**, **Random Explosion**, and **Trigger Missile** buttons.
- Added missile controls: **Reticle Size** and **Engine Flicker**.
- Improved missile scene variation and manual control while preserving audio-reactive behaviour.

# V81 Notes

- Rebuilt the **Pixel Missile Barrage** scene with stronger structure and richer animation.
- Added missile controls:
  - Target Scatter
  - Trail Length
  - Guidance Motion
- Improved low / bass response: launch intensity, arc lift, explosion ring weight.
- Improved mid response: target guidance sway, lock lines, targeting box activity.
- Improved high response: engine flicker, spark fragments, trail accents, burst energy.
- Added persistent explosion bursts for a fuller visual finish after missile detonation.

# V80 Notes

- Added **Random Stage** option to the **Multistage Fireworks** dropdown.
- Added **Random Stage Mode** quick button in the Firework Scene UI.
- When Random Stage is enabled, each new firework burst now picks a stage depth of 1, 2, or 3 automatically.
- Retained the fixed-stage random buttons for Random 1 Stage / Random 2 Stage / Random 3 Stage.

# V79 Notes

- Added **Random 1 Stage**, **Random 2 Stage**, and **Random 3 Stage** buttons to the Firework Scene UI.
- These new buttons randomise firework parameters while forcing a specific stage depth.
- Stage 2 child bursts now spawn slightly farther from the parent burst.
- Stage 3 child bursts now spawn even farther for a more spread-out multi-stage look.

# V78 Notes

- Added **Iris Scene UI** block inside Scene Controls when Iris Kaleidoscope is selected.
- Added iris presets:
  - Soft Iris
  - Mechanical Iris
  - Organic Iris
  - Aggressive Iris
- Added **Random Iris** and **Low Glow Iris** buttons.
- Added new iris controls:
  - Inner Rotation
  - Outer Rotation
  - Pupil Pulse
  - Fibre Shimmer
  - Symmetry Warp
- Improved iris animation by connecting these new controls to layered counter-rotation, aperture motion, fibre shimmer and slice warping.

# V77 Notes

- Refined the **Iris Kaleidoscope** scene to reduce visual heaviness.
- Added **Iris Opacity** control.
- Added **Iris Glow** control.
- Added **Petal Motion** control.
- Added **Morph Speed** control.
- Reduced default iris glow and colour opacity for a cleaner, more technical look.
- Animated the iris shape using petal deformation, slice warping, layered counter-rotation, and fibre motion.

# V76 Notes

- Added **Dust Amount** control for the firework scene.
- Added **Dust Size** control for the firework scene.
- Added **Trigger Firework** button for manual burst triggering.
- Manual trigger uses the current firework settings and spawns a burst on demand.
- Updated random firework control to randomise dust amount and dust size.

# V75 Notes

- Added **Child Bursts** scene control for the firework scene.
- Child burst amount can now be adjusted directly from Scene Controls.
- Added lingering **dust dots** after each burst to make explosions feel fuller and less abrupt.
- Dust dots drift outward and fade after the main firework burst.
- Updated Random Fireworks control so it also randomises child burst amount.

# V74 Notes

- Added a dedicated **Firework Scene UI** block inside Scene Controls.
- Added **Multistage Fireworks** select control.
- Added **Burst Shape Mode** select control.
- Added **Random Fireworks** control to randomise scene parameters quickly.
- Added **Random Shape** quick control.
- Firework UI controls sync back to the scene sliders automatically.

# V73 Notes

- Upgraded Firework Burst Grid into a **multi-stage firework system**.
- Added child burst spawning so fireworks can split into smaller secondary bursts.
- Added **Shape Mode** control:
  - `0` = Random
  - `1` = Sphere
  - `2` = Fan
  - `3` = Chrysanthemum
  - `4` = Spiral
- Added **Stage Depth** control to set how many burst stages are allowed.
- Added **Mega Burst Sense** control and beat-triggered mega bursts on stronger beat peaks.
- Mega bursts now spawn larger multi-ring structures and may emit extra child bursts.

# V72 Notes

- Added a new scene: **Firework Burst Grid**.
- Fireworks burst from random points across the screen instead of launching only from the bottom.
- Visual language uses **dots and lines** for a clean HUD / tactical feel.
- Added scene controls:
  - Burst Rate
  - Max Bursts
  - Burst Size
  - Scatter
  - Line Energy
- Audio mapping for Firework Burst Grid:
  - Low / bass: larger firework scale and stronger segmented ring pulses
  - Mid: more spoke visibility and denser structural line geometry
  - High: more spark dots, brighter twinkle and longer spark tails

# V71 Notes

- Added separate **Dot Size** and **Symbol Size** controls to Data Constellation.
- Added **Drift Mode** control with 3 states:
  - `0` = Free Drift
  - `1` = Center Pull
  - `2` = Cluster Mode
- Added **Cluster Count** control so the constellation can split into multiple groups.
- Added true dot nodes back into the visual mix, while keeping stars, pluses, diamonds and box symbols.
- Updated motion logic so random drift remains active in all modes, while center pull and cluster pull are optional overlays rather than forcing all nodes into one point.

# V70 Notes

- Added **Symbol Size** control to the Data Constellation scene so dot / symbol size can be adjusted directly inside the scene controls.
- Added **Center Pull** control to reduce or increase how strongly the constellation field drifts toward the central attractor.
- Updated node motion so the constellation drifts more randomly and organically, with unique per-node wander behaviour.
- Normal nodes now stay more distributed across the canvas instead of all collapsing toward the center, while hub nodes still retain a lighter orbital pull.

# V69 Notes

- Reworked **Data Constellation** to remove the soft glow look and replace it with sharper line / box based visuals.
- Node symbols now favour boxes, plus signs, stars and diamonds instead of glow dots.
- Replaced glow sparks with travelling data packets rendered as mini boxes / diamonds moving across links.
- Improved mic mapping for Data Constellation:
  - Low / bass: stronger center attraction, larger hub frames, heavier network breathing
  - Mid: wider connection reach, stronger lattice panels, more visible structural links
  - High: faster scan rails, sharper symbol activity, more travelling signal packets
- Improved **Iris Kaleidoscope** to feel more kaleidoscopic and less soft-glow based.
- Added sharper mirrored shard layers, recursive frame boxes, segmented ring patterns, star/box orbit markers, and stronger inward vortex geometry.
- Iris audio mapping now feels clearer:
  - Low / bass: pupil breathing and portal depth pulse
  - Mid: shard visibility, ring segmentation and structural density
  - High: orbit marker activity, fine fibre shimmer and sharper mirror detail

# V68 Notes

- Upgraded Data Constellation with star (`*`) and plus (`+`) style point symbols, rings and hub markers.
- Added distance-based solid / dashed link behaviour and travelling signal sparks across active links.
- Added stronger mic-driven reactions:
  - Low / bass: center attraction, bigger hubs, heavier network breathing
  - Mid: wider connection reach and stronger link visibility
  - High: symbol shimmer, brighter spark pulses and faster scan beams
- Added three new Data Constellation controls: Symbol Mix, Signal Hubs, Link Pulse.

# V67 Notes

- Added new Pixi scene: Iris Kaleidoscope.
- Added Iris scene to the scene dropdown and Hybrid Mix layer system.
- Added scene controls for symmetry, petal length, pupil aperture, prism complexity, rotation, breathing pulse, spark particles, iris fibre density, and portal depth.
- Iris scene reacts to bass, mid, high, beat pulse, palette selection, glow, speed, density, pulse, and performance mode.
- Preserved V66 projected-text controls and all existing scenes.


# V62 Notes

- Recovered stronger nightclub scene identity inspired by the earlier V44 direction.
- Added scene mixer controls so Hybrid Mix can include or exclude individual scenes.
- Added transition controls with auto-switch and seconds input.
- Added Atomic Viral Matrix scene.
- Retuned visuals: brighter points, lighter links, denser fields, deeper motion, stronger audio response.


## V61
- Added Sound Card audio input button.
- Added audio source cycle button.
- Added source readout in the Audio Reactive Hub.
- AudioEngine now supports microphone input, system/tab audio input, and fallback synthetic input.
- Added keyboard shortcut S for sound-card capture.


## V61
- Added 4-Beat FX toggle.
- Beat FX can now react only on every fourth detected beat/bass pulse.
- Added Beat FX Mode readout showing Interval or 4-Beat counter.
- Added keyboard shortcut G for 4-Beat FX.


## V61 HUD Reskin
- Updated the control HUD to a monochrome technical dashboard style inspired by the provided reference.
- Product name changed to Maestro.
- Restyled buttons, panels, meters, sliders, and overall interface hierarchy.


## V61
- Fixed scene visibility issue caused by Pixi/2D upper canvas accumulating black opacity.
- Added transparent trail fade for the upper visual canvas.
- Added guarded scene rendering for Pixi and 3D scene layers.


## V61
- Fixed camera zoom / rotate functionality.
- Added mouse-wheel zoom and right/shift-drag rotation.
- Added Reset Camera button.
- Added global camera transform for both visual canvas layers.
- Removed duplicate Orbit Geometry camera zoom transform.


## V61
- Fixed several sliders that existed in the HUD but were not visibly connected.
- Added global controlled colour conversion for hue/saturation/brightness/contrast/color cycle.
- Added gradient opacity support.
- Added pulse control influence across visual layers.
- Added pixel size influence to Matrix and Missile scenes.
- Added Hybrid Mix / Hybrid Scene Depth influence.


## V61
- Added 2-bar Colour Beat FX toggle.
- Colour changes now react to beat/bass pulse counting and shift palette every 8 beat pulses (2 bars in 4/4).
- On each 2-bar trigger, Maestro updates palette, hue shift, saturation, brightness, contrast, color cycle, and gradient settings.
- Added HUD button, readout, and V keyboard shortcut for Colour Beat FX.


## V61
- Added custom colour picker module.
- Added three clickable colour boxes: Primary, Secondary, Accent.
- Added Custom Colours toggle.
- Connected custom colours to scenes and gradient rendering through VisualState.palette().


## V62
- Added Text Projection module to project text at the centre of the scene.
- Added multiline text input.
- Added text size, letter spacing, and line spacing controls.
- Added font-theme selector and palette-linked text colour source selector.
- Text rendering uses the active palette or custom colours with existing hue / saturation / brightness / contrast controls.


## V63
- Added Matrix scene font-size control.
- Added Matrix scene line-spacing control.
- Added Matrix scene random font-size control.
- Matrix code columns now vary around the chosen base size while respecting the random-size slider.


## V64
- Added text layer placement controls for behind-scene and above-scene rendering.
- Added three extra projected-text fonts for a total of eight numbered font options.
- Added Text Glow slider control.
- Added Glow Colour Source selector separate from Text Colour Source.
- Updated the text-projection HUD so font selection is presented as numbered options.


## V66
- Added projected-text rotation control.
- Added projected-text X and Y position controls.
- Added projected-text opacity control.
- Added projected-text animation mode selector with pulse, flicker, scan, drift, and type-on modes.
- Updated text rendering logic to support layered motion effects while preserving existing colour and glow settings.


## V87 – Atomic Viral Ecosystem Upgrade
- Rebuilt Atomic Viral Matrix into a richer microscopic bio-tech ecosystem.
- Added five atom families (classic, dense, split, multi-core, ion).
- Added five virus families (spike, capsule, geometric, orbital, cluster).
- Added layered micro-particles using dots, * symbols, and + symbols with connection lines.
- Added clearer low / mid / high audio mapping.
- Added atom-virus interaction, fusion events, mutation rings, swarm blooms, and beat-triggered activity bursts.
- Added expanded atomic scene controls and Atomic Scene UI presets with randomisation.


## V88 – Atomic UI + Hybrid Optimisation
- Added stronger manual preset button layout for Atomic Viral Scene UI.
- Added Random Atomic Scene, Random Preset, Trigger Random Event, Trigger Mutation, and Trigger Fusion buttons.
- Added Dot Size control and Spread Amount control.
- Adjusted spawn positions and center-repulsion so elements spread out more naturally.
- Optimised Atomic Viral scene for Hybrid Mix by reducing active state, capping lists, and slightly reducing audio intensity.


## V89 – Stability Refactor

- Namespaced repeated helper functions in older Pixi/Three scene files.
- Reduced risk of global helper collisions from plain script loading.
- Added runtime trim helpers for Firework, Missile, and Atomic scenes.
- Improved Hybrid Mix stability by calling scene-specific trim methods.
- Added lightweight scene-change cleanup hook through `SceneRuntimeTools`.
- This version focuses on stability rather than adding new visual features.


## V90 – UI Organisation Upgrade

- Added collapsible panels across the HUD.
- Performance, Audio Reactive Hub, and Scene Controls are open by default.
- Scene Mixer, Scene Transition, Global Visual Controls, Audio Controls, Colour + Gradient, Text Projection and Keyboard Shortcuts start collapsed.
- Added Live Cockpit readouts for scene, audio state, and performance mode.
- Improved HUD readability and live-use navigation without removing existing controls.


## V91 – Beat Automation

- Added Beat Automation panel.
- Added beat-count controls for scene changes, event triggers, and active-scene randomisation.
- Added manual Trigger Auto Event button.
- Added manual Randomise Active Scene button.
- Beat automation can trigger Firework, Missile, Atomic Viral and Iris scene behaviours.
- Automation uses detected beat/bass pulses and keeps a visible beat counter.


## V92 – Performance Monitor

- Added Performance Monitor panel.
- Added RuntimeMonitor module.
- Added FPS and frame-time tracking.
- Added active scene, hybrid layer, audio and automation readouts.
- Added Firework / Missile / Atomic state counters.
- Added Runtime Cleanup button to trim state-heavy scenes during long-running sessions.


## V93 – Code Glitch Terminal Scene

- Added new scene: **Code Glitch Terminal**.
- Added scene controls for panels, streams, scroll speed, symbol size, glitch amount, link density, window jitter, RGB split, and noise blocks.
- Added a new Pixi scene renderer using coding windows, scrolling code columns, connector links, and glitch slices.
- Added beat-automation support for the new scene by boosting glitch intensity and RGB split during automation events.


## V94 – Mobius Galaxy Upgrade

- Rebuilt Mobius Galaxy with a stronger 3D ribbon/depth illusion.
- Added new Mobius controls: Ribbon Width, Twist Amount, Depth Strength, Surface Grid, Signal Particles, Signal Speed, Galaxy Spiral, Dust Amount, Gravity Pulse, Lens Distortion and Mobius Mode.
- Added moving signal particles travelling along the Mobius ribbon.
- Added surface grid and ribbon cell shading.
- Added galaxy depth layers, dust particles, gravity rings and lens distortion.
- Added Mobius Scene UI with presets and randomisation.
- Added beat automation support for Mobius gravity/signal boosts.


## V95 – Mobius Hotfix

- Hotfixed the V94 Mobius Galaxy upgrade.
- Lowered default Mobius density, stars, dust and signal particles.
- Added hard caps for Mobius render counts.
- Added Mobius fallback renderer.
- Added `window.MobiusGalaxyScene` exposure.
- Added Mobius cleanup support to Runtime Monitor and scene-change cleanup.


## V96 – Launch Hotfix

- Fixed launch failure caused by missing `HudController.updateLiveCockpit()`.
- Added safe Live Cockpit cache references.
- Added safe `initCollapsiblePanels()` implementation.
- Confirmed launch path with a browser-style boot smoke test.


## V97 – Code Glitch Upgrade

- Added Code Glitch Scene UI.
- Added Code Glitch presets: Clean Terminal, Hacker Rain, System Breach, Data Network, Corrupt Core.
- Added manual Glitch Burst, System Breach, and Corrupt Core event triggers.
- Added controls: Main Panel Focus, Typing Cursors, Scanline Strength, Breach Pulse, Binary Rain, Snippet Density, Panel Opacity, Grid Strength, Corruption Spread, Code Mode.
- Expanded the code snippet library.
- Added scanline and cursor effects.
- Added central command/core panel.
- Added `trimForHybrid()` for Code Glitch.
- Routed Code Glitch through the hybrid-safe draw path.


## V98 – Slash Wave Fabric Upgrade

- Upgraded Slash Wave Fabric to have clearer low / mid / high audio-reactive behaviour.
- Added multi-layer fabric mesh.
- Added low-frequency bulge and slash shockwave behaviour.
- Added mid-frequency weave drift, shear and ripple movement.
- Added high-frequency shard fragments and spark accents.
- Added new controls: Fabric Layers, Ripple Strength, Weave Drift, Shard Amount, Slash Trail Length.


## V99 – Topography Flow Field Scene

- Replaced Slash Wave Fabric with Topography Flow Field.
- Added animated contour-line terrain rendering.
- Added topographic island/ring forms.
- Low reacts to elevation swell and bass pulse.
- Mid reacts to terrain drift and ridge movement.
- High reacts to fine contour detail and tracer highlights.
- Added new Topography controls: Contour Density, Terrain Layers, Elevation Scale, Contour Spacing, Terrain Drift, Fine Detail, Bass Pulse, and Tracer Amount.


## V100 – Mountain Topography Refinement

- Refined Topography Flow Field into a more mountain-like topographic map.
- Added stronger nested contours around mountain peaks.
- Added ridgeline / saddle connectors between peaks.
- Increased mountain-readability while keeping low / mid / high motion behaviour.
- Renamed scene label to Mountain Topography.


## V101 – Topographic Spectrograph

- Modified Mountain Topography into Topographic Spectrograph.
- Added spectrograph-style contour bands and time markers.
- Added stronger frequency-zone shaping for low, mid, and high bands.
- Added a live sweep cursor and contour tracers.
- Kept the contour / topographic visual language while moving the scene closer to a spectrograph.


## V102 – Spectrograph Scene

- Removed the topography emphasis from the former Topographic Spectrograph.
- Renamed the scene to Spectrograph.
- Focused the scene on spectral bands, scan/sweep behaviour, and low/mid/high zone activity.
- Updated controls to reflect spectrograph behaviour rather than topography.


## V103 – Spectrograph Effects Upgrade

- Removed topography circles / island-like emphasis from the Spectrograph scene.
- Added waterfall history for spectral memory.
- Added vertical energy spikes across the bands.
- Added peak-hold markers for low, mid, and high zones.
- Added heatmap-like glow zones and spark particles.
- Kept the scene focused on pure spectrograph behaviour.


## V104 – Spectrograph Line Definition Fix

- Reduced heatmap glow intensity.
- Reduced glow-point blur and particle glow.
- Rebalanced rendering so heatmap stays behind the spectral lines.
- Increased spectral line opacity and stroke clarity.
- Improved readability of spikes, tracers and peak-hold markers.


## V105 – Chladni Plate Resonance Scene

- Added a new Chladni Plate Resonance scene.
- Added controls for Grain Density, Mode X, Mode Y, Node Width, Vibration Drift, Sand Scatter, Line Definition, and Sparkle Amount.
- Low / Bass shifts broader modal structure and plate pulse.
- Mid shifts resonance mode combinations and vibration drift.
- High adds finer harmonic detail and sparkle accents.


## V106 – Cyber Chladni Nexus Scene

- Added a second Chladni-inspired scene: Cyber Chladni Nexus.
- Added controls for Grid Density, Mode X, Mode Y, Node Width, Circuit Drift, Bass Pulse, Circuit Traces, and Sparkle Amount.
- Low / Bass drives broader modal shifts, plate pulse, and lower sweep weight.
- Mid drives drift, sweep movement, and resonance structure changes.
- High drives harmonic detail, sparkle, and node flicker.
