# Glass Garden Motion Upgrade Design

Date: 2026-05-17
Status: Ready for user review

## Context

Spring Nest is a React 19, Vite 6, Tailwind CSS 4 PWA for lightweight tools and casual games. The project already has a motion foundation: `motion/react`, shared animation tokens, `MotionSurface`, a `StartupSplash`, route transitions, dynamic background profiles, and tests around motion behavior.

The new goal is a second-stage visual upgrade. The site should feel more premium, alive, and technically impressive while staying close to the existing Spring Nest identity: warm, natural, soft, useful, and approachable.

The selected direction is **Glass Garden Motion Upgrade**:

- Desktop web gets a real 3D Glass Terrarium environment.
- Mobile keeps a lighter 2D/SVG/motion interpretation.
- Startup becomes a realistic micro nature scene, not a floating abstract logo.
- UI motion remains clear and task-friendly.

## Goals

- Create a high-end startup animation that feels realistic, alive, and memorable.
- Add desktop-wide 3D atmosphere without making the site feel fake, noisy, or slow.
- Preserve mobile performance by using a lighter animation path.
- Keep the existing Spring Nest palette and soft natural style.
- Use real 3D where it matters, and keep UI interactions in the existing motion system.
- Improve the perceived quality of page backgrounds, route transitions, cards, search, navigation, loading, empty, and feedback states.

## Non-Goals

- Do not rewrite core tool or game logic.
- Do not replace the existing information architecture.
- Do not redesign the brand from scratch.
- Do not turn the UI into a sci-fi HUD or game dashboard.
- Do not make animation block search, typing, conversion flows, or gameplay.
- Do not run heavy WebGL on mobile or reduced-motion contexts.

## Experience Direction

The visual metaphor is a **realistic micro glass terrarium**. Spring Nest should feel like a small living greenhouse behind the interface: warm light, glass edge refraction, soil, roots, moss, dew, dust, and gentle natural motion.

The startup animation is the main show. The rest of the site carries the same world at a quieter level.

Desktop should feel richer and spatial. Mobile should feel fast, clean, and related to the desktop experience without trying to replicate every 3D effect.

## Startup Animation

### Story

The startup animation is a realistic micro nature scene:

1. The camera is close to damp soil inside a subtle glass terrarium.
2. The soil surface lifts slightly as pressure builds underneath.
3. A sprout pushes through the soil with visible resistance.
4. Soil clumps separate, bounce, and settle with believable weight.
5. The stem bends, corrects, and rises.
6. Leaves unfold with slight asymmetry and visible veins.
7. Warm light catches the glass edge, dew, and dust.
8. The scene resolves into the Spring Nest mark and exits into the page.

### Timing

- Target duration: 1.2-1.8 seconds.
- First session display only.
- User can skip with pointer down, Enter, or Escape.
- Reduced-motion users get a near-static version with minimal state change.

### Realism Requirements

- Soil must have visible weight: irregular clumps, stones, moss, roots, and contact shadows.
- The sprout must show resistance: push, bend, breakthrough, rebound, and settle.
- Leaves must not be perfectly symmetrical; they need veins, thickness, edge variation, and restrained highlights.
- Glass must feel environmental: edge refraction, shadowing, warm reflections, and depth of field. It must not look like a flat UI card.
- Dew, mist, and dust are supporting details only. They should add realism without becoming decorative noise.

### Desktop Version

Desktop uses real Three.js rendering. The scene should use PBR-like materials, believable lighting, geometry variation, and carefully constrained camera movement. It can run at higher visual intensity because it is short.

### Mobile Version

Mobile uses a lightweight SVG and `motion/react` version with the same story beats: soil pressure, sprout emergence, leaf unfold, logo settle. It must avoid heavy WebGL and long-running animation.

## Full-Site Background System

The whole UI background becomes a **Glass Terrarium Environment**. It should behave like an atmospheric layer behind content, not a full-screen illustration.

### Layers

1. **Warm neutral base**
   - Keep the existing cream, soft green, and restrained clay tones.
   - Preserve readability and existing brand continuity.

2. **Desktop 3D environment layer**
   - Low-opacity glass edge, dew, dust, root/branch curves, soft parallax, and occasional natural movement.
   - Always behind content.
   - `pointer-events: none`.
   - Must never obscure controls or text.

3. **Readability veil**
   - A subtle wash or surface treatment behind content-heavy areas.
   - Keeps cards, forms, tool controls, and text legible.

4. **Page mood profiles**
   - Home: richest and most alive.
   - Tools: cleaner, calmer, more functional.
   - Games: more playful particles and spring motion.
   - Detail pages: quiet and low contrast.
   - Search: center-focused and clear.
   - Empty states: softer and more still.

### Mobile Background

Mobile keeps the existing dynamic 2D background idea, upgraded with better gradients, subtle SVG curves, and short transitions. It must not mount the heavy desktop 3D layer.

## Technical Architecture

### Dependencies

Add:

```bash
npm install three @react-three/fiber @react-three/drei
```

The project already uses `motion/react`, so UI motion should continue to use that library.

### Component Boundaries

- `GlassGardenCanvas`
  - Desktop-only Three.js root canvas.
  - Owns camera, lights, environmental scene, low-intensity background motion, and render policy.

- `TerrariumEmergenceSplash`
  - Desktop startup scene.
  - Reuses Glass Garden scene primitives and materials.
  - Runs the short emergence choreography.

- `LightweightSplashMark`
  - Mobile, low-power, and reduced-motion startup fallback.
  - SVG plus `motion/react`.

- `DynamicSpringBackground`
  - Existing background system remains the page-profile orchestrator.
  - It decides whether to render the desktop 3D layer or 2D fallback.

- `MotionSurface`
  - Continues to own UI interactions: cards, buttons, panels, lists, search, menus, toasts, and small feedback states.

Three.js and UI motion should stay isolated. Three.js should not directly manage UI state, and UI components should not depend on Three.js internals.

### Capability Detection

Enable desktop 3D only when all are true:

- Not `prefers-reduced-motion: reduce`.
- Not coarse pointer.
- Not a narrow mobile viewport.
- Hardware appears adequate.
- WebGL is available.

Fallback to lightweight 2D when any condition fails.

### Render Policy

- Startup animation may run continuous frames during its short duration.
- Ambient desktop background should use a low-cost render policy, such as demand rendering, throttled animation, or very slow uniform updates.
- Canvas must be `pointer-events: none`.
- Canvas must live behind the UI with conservative z-index.

## UI Motion Polish

Existing `motion/react` remains the UI motion layer.

Planned refinements:

- Page transitions get subtle spatial lift on desktop and simpler fade/slide on mobile.
- Cards get desktop tilt, soft highlight, and stable shadow movement; mobile gets press feedback only.
- Navigation active state can use a soft leaf-vein-like line transition.
- Search opens like a glass panel rising from the background, with staggered results.
- Favorites, theme switch, and toasts keep quick spring feedback.
- Loading, empty, and error states use natural motifs without spinner overload.

All UI motion must use transform and opacity where possible.

## Error Handling And Fallbacks

- If WebGL fails, render the 2D background and 2D splash without user-visible failure.
- If 3D assets or scene initialization fail, log safely and continue with the 2D fallback.
- If session storage is unavailable, the startup splash may show once per page load but must remain skippable.
- Reduced-motion must produce a calm static or near-static result.
- Low-power and mobile contexts must not import or mount heavy 3D unnecessarily when avoidable.

## Accessibility

- Startup splash uses `role="status"` and clear accessible labeling.
- Splash is skippable by keyboard and pointer.
- Reduced-motion users avoid cinematic movement.
- Background canvas is decorative and `aria-hidden`.
- Text contrast and focus states remain governed by the app UI, not the background.
- Background and animation must never block pointer interaction.

## Performance Requirements

- No heavy 3D on mobile.
- No canvas interactions that steal scroll or taps.
- Avoid animating layout properties.
- Use texture/material counts conservatively.
- Keep particle counts low and profile-dependent.
- Avoid expensive blur/filter animation in scrolling containers.
- Verify desktop 3D canvas is nonblank, but not running as an uncontrolled full-power loop.

## Implementation Scope

1. Add dependencies and capability detection.
2. Build the desktop startup scene and mobile fallback.
3. Upgrade `StartupSplash` to choose the right path.
4. Add desktop Glass Terrarium background layer to the existing background system.
5. Refine 2D mobile backgrounds to match the same art direction.
6. Polish UI motion using existing shared motion primitives.
7. Add tests and browser verification.

## Verification Plan

Run:

- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`

Add or update unit tests for:

- Capability detection.
- Background profile selection.
- Startup fallback behavior.
- Motion token constraints.

Add Playwright checks for:

- Desktop startup 3D canvas is mounted and nonblank when supported.
- Mobile viewport does not mount the heavy 3D background.
- Splash can be skipped with pointer and keyboard.
- Home, tools, games, one tool detail, and one game detail remain readable.
- Search overlay, navigation, and card hover do not get blocked by canvas.
- Reduced-motion path avoids cinematic animation.

Manual checks:

- Desktop light and dark.
- Mobile light and dark.
- First session and repeat visit.
- Reduced-motion.
- Low-width layouts.
- No text overlap.
- No button text overflow.
- No background element competing with active tool/game content.

## Open Implementation Notes

- Prefer procedural or lightweight geometry first. Add external assets only if the scene cannot meet realism requirements procedurally.
- If external textures are needed, keep them small and local.
- The design should work with the existing dirty worktree and must not revert unrelated changes.
- The prior motion system remains the base; this design is an additive second-stage upgrade.
