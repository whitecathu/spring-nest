# Glass Garden Motion Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a realistic desktop Glass Terrarium motion system with a lightweight mobile fallback, including startup animation, full-site background atmosphere, UI motion polish, and verification.

**Architecture:** Add a small capability-detection layer that decides between desktop 3D and lightweight 2D. Keep Three.js isolated in lazy-loaded animation components, while existing `motion/react` primitives continue to own UI interactions. Upgrade `StartupSplash` and `DynamicSpringBackground` to select the right visual layer per device, motion preference, and hardware capability.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, `motion/react`, `three`, `@react-three/fiber`, `@react-three/drei`, Vitest, Playwright.

---

## Scope Check

This plan implements one cohesive feature because startup animation, desktop background, mobile fallback, and UI motion all depend on the same capability detection and art direction. The work is still decomposed into independently testable tasks.

## File Structure

- Modify `package.json` and `package-lock.json`: add Three.js dependencies.
- Modify `vite.config.ts`: place Three-related packages into their own manual chunk.
- Create `src/lib/visualCapability.ts`: capability detection, WebGL probing, and React hook for desktop 3D eligibility.
- Create `src/__tests__/visualCapability.test.ts`: unit tests for desktop/mobile/reduced-motion/WebGL decisions.
- Create `src/components/animations/glassGarden/sceneProfiles.ts`: stable scene profile data for startup, home, tools, games, detail, search, and empty backgrounds.
- Create `src/__tests__/glassGardenProfiles.test.ts`: tests for profile intensity and mobile-safe values.
- Create `src/components/animations/glassGarden/LightweightEmergenceSplash.tsx`: mobile/reduced-motion SVG startup animation.
- Create `src/components/animations/glassGarden/GlassTerrariumScene.tsx`: reusable Three.js scene primitives for soil, sprout, glass dome, dew, dust, roots, and ambient curves.
- Create `src/components/animations/glassGarden/TerrariumEmergenceSplash.tsx`: desktop startup canvas wrapper.
- Create `src/components/animations/glassGarden/GlassGardenCanvas.tsx`: desktop ambient background canvas wrapper.
- Create `src/components/animations/glassGarden/index.ts`: exports for lazy imports.
- Modify `src/components/animations/StartupSplash.tsx`: select desktop 3D splash or lightweight fallback while preserving skip/session behavior.
- Modify `src/components/animations/DynamicSpringBackground.tsx`: add lazy desktop ambient canvas while preserving existing 2D background.
- Modify `src/index.css`: add canvas layer, realism texture utilities, and readability veil utilities.
- Modify `src/lib/animations.ts`: add route and UI polish presets only if missing from the existing motion token set.
- Modify `src/components/MotionSurface.tsx`: add optional `glassGarden` tone hooks only where existing primitives need the new polish.
- Modify `e2e/app.spec.ts`: add startup/background/canvas/fallback guardrails.

## Task 1: Add Three Dependencies And Build Chunk

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Install the 3D dependencies**

Run:

```powershell
npm install three @react-three/fiber @react-three/drei
```

Expected: `package.json` includes `three`, `@react-three/fiber`, and `@react-three/drei`; `package-lock.json` is updated.

- [ ] **Step 2: Put Three dependencies in a separate Vite chunk**

In `vite.config.ts`, update the `manualChunks` object so it includes this entry:

```ts
'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
```

The full `manualChunks` block should keep existing chunks and include the new one:

```ts
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  motion: ['motion'],
  lucide: ['lucide-react'],
  qrcode: ['qrcode'],
  'word-to-pdf-vendor': ['mammoth', 'html2pdf.js'],
  'pdf-to-word-vendor': ['pdfjs-dist', 'docx'],
  'question-bank-vendor': ['zustand', 'jszip', 'node-unrar-js'],
  'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
},
```

- [ ] **Step 3: Verify dependency resolution**

Run:

```powershell
npm run typecheck
```

Expected: PASS or only pre-existing unrelated errors. If there are errors caused by the new chunk names or missing packages, fix before continuing.

- [ ] **Step 4: Commit**

```powershell
git add package.json package-lock.json vite.config.ts
git commit -m "build: add glass garden 3d dependencies"
```

## Task 2: Capability Detection

**Files:**
- Create: `src/lib/visualCapability.ts`
- Create: `src/__tests__/visualCapability.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/visualCapability.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canUseDesktopGlassGarden,
  getVisualCapability,
  type VisualCapabilityInput,
} from '../lib/visualCapability';

function baseInput(overrides: Partial<VisualCapabilityInput> = {}): VisualCapabilityInput {
  return {
    reducedMotion: false,
    coarsePointer: false,
    width: 1440,
    hardwareConcurrency: 8,
    webglAvailable: true,
    ...overrides,
  };
}

describe('visual capability detection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('enables desktop 3d for a capable desktop context', () => {
    expect(canUseDesktopGlassGarden(baseInput())).toBe(true);
    expect(getVisualCapability(baseInput()).mode).toBe('desktop-3d');
  });

  it('falls back for reduced motion', () => {
    const result = getVisualCapability(baseInput({ reducedMotion: true }));
    expect(result.mode).toBe('lightweight');
    expect(result.reason).toBe('reduced-motion');
  });

  it('falls back for coarse pointers and narrow screens', () => {
    expect(getVisualCapability(baseInput({ coarsePointer: true })).reason).toBe('coarse-pointer');
    expect(getVisualCapability(baseInput({ width: 640 })).reason).toBe('narrow-viewport');
  });

  it('falls back when hardware is weak or WebGL is unavailable', () => {
    expect(getVisualCapability(baseInput({ hardwareConcurrency: 2 })).reason).toBe('low-power');
    expect(getVisualCapability(baseInput({ webglAvailable: false })).reason).toBe('no-webgl');
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```powershell
npm run test -- src/__tests__/visualCapability.test.ts
```

Expected: FAIL because `src/lib/visualCapability.ts` does not exist.

- [ ] **Step 3: Implement capability detection**

Create `src/lib/visualCapability.ts`:

```ts
import { useEffect, useState } from 'react';

export type VisualCapabilityMode = 'desktop-3d' | 'lightweight';

export type VisualCapabilityReason =
  | 'capable'
  | 'server'
  | 'reduced-motion'
  | 'coarse-pointer'
  | 'narrow-viewport'
  | 'low-power'
  | 'no-webgl';

export type VisualCapabilityInput = {
  reducedMotion: boolean;
  coarsePointer: boolean;
  width: number;
  hardwareConcurrency: number;
  webglAvailable: boolean;
};

export type VisualCapability = {
  mode: VisualCapabilityMode;
  reason: VisualCapabilityReason;
};

const MIN_DESKTOP_WIDTH = 900;
const MIN_HARDWARE_CONCURRENCY = 4;

export function canUseDesktopGlassGarden(input: VisualCapabilityInput) {
  return getVisualCapability(input).mode === 'desktop-3d';
}

export function getVisualCapability(input: VisualCapabilityInput): VisualCapability {
  if (input.reducedMotion) return { mode: 'lightweight', reason: 'reduced-motion' };
  if (input.coarsePointer) return { mode: 'lightweight', reason: 'coarse-pointer' };
  if (input.width < MIN_DESKTOP_WIDTH) return { mode: 'lightweight', reason: 'narrow-viewport' };
  if (input.hardwareConcurrency < MIN_HARDWARE_CONCURRENCY) {
    return { mode: 'lightweight', reason: 'low-power' };
  }
  if (!input.webglAvailable) return { mode: 'lightweight', reason: 'no-webgl' };
  return { mode: 'desktop-3d', reason: 'capable' };
}

export function detectWebGLAvailable() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

export function readVisualCapabilityInput(): VisualCapabilityInput {
  if (typeof window === 'undefined') {
    return {
      reducedMotion: true,
      coarsePointer: true,
      width: 0,
      hardwareConcurrency: 0,
      webglAvailable: false,
    };
  }

  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    width: window.innerWidth,
    hardwareConcurrency: navigator.hardwareConcurrency ?? MIN_HARDWARE_CONCURRENCY,
    webglAvailable: detectWebGLAvailable(),
  };
}

export function useVisualCapability() {
  const [capability, setCapability] = useState<VisualCapability>(() => {
    if (typeof window === 'undefined') return { mode: 'lightweight', reason: 'server' };
    return getVisualCapability(readVisualCapabilityInput());
  });

  useEffect(() => {
    const update = () => setCapability(getVisualCapability(readVisualCapabilityInput()));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');

    update();
    reducedMotion.addEventListener('change', update);
    coarsePointer.addEventListener('change', update);
    window.addEventListener('resize', update);

    return () => {
      reducedMotion.removeEventListener('change', update);
      coarsePointer.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return capability;
}
```

- [ ] **Step 4: Run the tests**

Run:

```powershell
npm run test -- src/__tests__/visualCapability.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/visualCapability.ts src/__tests__/visualCapability.test.ts
git commit -m "feat: detect glass garden visual capability"
```

## Task 3: Scene Profiles

**Files:**
- Create: `src/components/animations/glassGarden/sceneProfiles.ts`
- Create: `src/__tests__/glassGardenProfiles.test.ts`

- [ ] **Step 1: Write the failing profile tests**

Create `src/__tests__/glassGardenProfiles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  glassGardenProfiles,
  getGlassGardenProfile,
} from '../components/animations/glassGarden/sceneProfiles';

describe('glass garden scene profiles', () => {
  it('defines startup as the richest short scene', () => {
    const startup = glassGardenProfiles.startup;
    expect(startup.scene).toBe('terrarium-emergence');
    expect(startup.soilClumps).toBeGreaterThan(glassGardenProfiles.home.soilClumps);
    expect(startup.dewDrops).toBeGreaterThan(glassGardenProfiles.detail.dewDrops);
  });

  it('keeps detail and tools quieter than home', () => {
    expect(glassGardenProfiles.detail.opacity).toBeLessThan(glassGardenProfiles.home.opacity);
    expect(glassGardenProfiles.tools.particleCount).toBeLessThan(glassGardenProfiles.games.particleCount);
  });

  it('falls back to detail profile for unknown keys', () => {
    expect(getGlassGardenProfile('unknown-route')).toEqual(glassGardenProfiles.detail);
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```powershell
npm run test -- src/__tests__/glassGardenProfiles.test.ts
```

Expected: FAIL because the profile module does not exist.

- [ ] **Step 3: Implement the profiles**

Create `src/components/animations/glassGarden/sceneProfiles.ts`:

```ts
export type GlassGardenProfileKey =
  | 'startup'
  | 'home'
  | 'tools'
  | 'games'
  | 'detail'
  | 'search'
  | 'empty';

export type GlassGardenProfile = {
  scene: 'terrarium-emergence' | 'ambient-terrarium';
  opacity: number;
  soilClumps: number;
  dewDrops: number;
  rootCurves: number;
  particleCount: number;
  parallaxStrength: number;
  sproutScale: number;
  glassStrength: number;
  warmth: number;
};

export const glassGardenProfiles: Record<GlassGardenProfileKey, GlassGardenProfile> = {
  startup: {
    scene: 'terrarium-emergence',
    opacity: 1,
    soilClumps: 34,
    dewDrops: 18,
    rootCurves: 9,
    particleCount: 42,
    parallaxStrength: 0,
    sproutScale: 1.12,
    glassStrength: 0.86,
    warmth: 0.78,
  },
  home: {
    scene: 'ambient-terrarium',
    opacity: 0.42,
    soilClumps: 12,
    dewDrops: 9,
    rootCurves: 5,
    particleCount: 24,
    parallaxStrength: 10,
    sproutScale: 0.74,
    glassStrength: 0.42,
    warmth: 0.66,
  },
  tools: {
    scene: 'ambient-terrarium',
    opacity: 0.26,
    soilClumps: 6,
    dewDrops: 4,
    rootCurves: 4,
    particleCount: 10,
    parallaxStrength: 6,
    sproutScale: 0.52,
    glassStrength: 0.28,
    warmth: 0.54,
  },
  games: {
    scene: 'ambient-terrarium',
    opacity: 0.34,
    soilClumps: 8,
    dewDrops: 8,
    rootCurves: 4,
    particleCount: 28,
    parallaxStrength: 12,
    sproutScale: 0.62,
    glassStrength: 0.34,
    warmth: 0.6,
  },
  detail: {
    scene: 'ambient-terrarium',
    opacity: 0.18,
    soilClumps: 3,
    dewDrops: 2,
    rootCurves: 2,
    particleCount: 6,
    parallaxStrength: 4,
    sproutScale: 0.38,
    glassStrength: 0.18,
    warmth: 0.48,
  },
  search: {
    scene: 'ambient-terrarium',
    opacity: 0.24,
    soilClumps: 4,
    dewDrops: 5,
    rootCurves: 3,
    particleCount: 8,
    parallaxStrength: 5,
    sproutScale: 0.4,
    glassStrength: 0.3,
    warmth: 0.52,
  },
  empty: {
    scene: 'ambient-terrarium',
    opacity: 0.16,
    soilClumps: 2,
    dewDrops: 2,
    rootCurves: 1,
    particleCount: 4,
    parallaxStrength: 2,
    sproutScale: 0.3,
    glassStrength: 0.16,
    warmth: 0.44,
  },
};

export function getGlassGardenProfile(key: string): GlassGardenProfile {
  if (key in glassGardenProfiles) return glassGardenProfiles[key as GlassGardenProfileKey];
  return glassGardenProfiles.detail;
}
```

- [ ] **Step 4: Run the tests**

Run:

```powershell
npm run test -- src/__tests__/glassGardenProfiles.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/animations/glassGarden/sceneProfiles.ts src/__tests__/glassGardenProfiles.test.ts
git commit -m "feat: define glass garden scene profiles"
```

## Task 4: Lightweight Emergence Splash

**Files:**
- Create: `src/components/animations/glassGarden/LightweightEmergenceSplash.tsx`
- Create: `src/components/animations/glassGarden/index.ts`
- Test: existing `npm run typecheck`

- [ ] **Step 1: Create the lightweight splash component**

Create `src/components/animations/glassGarden/LightweightEmergenceSplash.tsx`:

```tsx
import { memo } from 'react';
import { motion } from 'motion/react';
import { easeOutExpo, softEase } from '../../../lib/animations';

type LightweightEmergenceSplashProps = {
  compact: boolean;
  dark: boolean;
  reducedMotion: boolean;
};

function LightweightEmergenceSplash({
  compact,
  dark,
  reducedMotion,
}: LightweightEmergenceSplashProps) {
  const soil = dark ? 'oklch(31% 0.038 55)' : 'oklch(46% 0.055 58)';
  const soilDark = dark ? 'oklch(20% 0.03 55)' : 'oklch(35% 0.05 52)';
  const stem = dark ? 'oklch(76% 0.12 145)' : 'oklch(42% 0.1 145)';
  const leaf = dark ? 'oklch(80% 0.13 145)' : 'oklch(58% 0.13 145)';
  const glass = dark ? 'oklch(95% 0.01 145 / 0.14)' : 'oklch(100% 0 0 / 0.34)';
  const ink = dark ? 'oklch(89% 0.06 145)' : 'oklch(30% 0.07 145)';
  const markSize = compact ? 118 : 146;
  const duration = reducedMotion ? 0.01 : 0.56;

  return (
    <motion.div
      className="relative mx-4 flex w-[min(88vw,390px)] flex-col items-center rounded-[2rem] border px-7 py-7 text-center shadow-[0_26px_72px_rgba(63,103,81,0.16)] backdrop-blur-xl"
      style={{
        background: dark ? 'oklch(18% 0.018 145 / 0.72)' : 'oklch(100% 0 0 / 0.72)',
        borderColor: dark ? 'oklch(88% 0.06 145 / 0.12)' : 'oklch(42% 0.08 145 / 0.12)',
      }}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: easeOutExpo }}
    >
      <svg width={markSize} height={markSize} viewBox="0 0 160 160" className="overflow-visible">
        <motion.ellipse
          cx="80"
          cy="118"
          rx="54"
          ry="16"
          fill={soilDark}
          opacity="0.22"
          initial={false}
          animate={reducedMotion ? undefined : { scaleX: [0.96, 1.04, 1], opacity: [0.16, 0.28, 0.22] }}
          transition={{ duration: 0.62, ease: softEase }}
        />
        <motion.path
          d="M28 116 C48 101 112 101 132 116 L132 138 L28 138 Z"
          fill={soil}
          initial={reducedMotion ? false : { y: 3 }}
          animate={reducedMotion ? undefined : { y: [3, -2, 0] }}
          transition={{ duration, ease: easeOutExpo }}
        />
        <motion.path
          d="M48 112 C66 103 96 104 112 112"
          fill="none"
          stroke={dark ? 'oklch(78% 0.08 60 / 0.42)' : 'oklch(76% 0.08 70 / 0.5)'}
          strokeWidth="3"
          strokeLinecap="round"
          initial={reducedMotion ? false : { pathLength: 0.1, opacity: 0 }}
          animate={reducedMotion ? undefined : { pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.38, delay: 0.12, ease: softEase }}
        />
        {[42, 57, 105, 118].map((cx, index) => (
          <motion.circle
            key={cx}
            cx={cx}
            cy={114 + (index % 2) * 5}
            r={index % 2 ? 2.4 : 3.2}
            fill={soilDark}
            initial={reducedMotion ? false : { opacity: 0, y: 5 }}
            animate={reducedMotion ? undefined : { opacity: [0, 0.72, 0.58], y: [5, -4, 0] }}
            transition={{ duration: 0.46, delay: 0.12 + index * 0.04, ease: easeOutExpo }}
          />
        ))}
        <motion.path
          d="M80 118 C73 92 75 70 84 42"
          fill="none"
          stroke={stem}
          strokeWidth="7"
          strokeLinecap="round"
          initial={reducedMotion ? false : { pathLength: 0, rotate: -4 }}
          animate={reducedMotion ? undefined : { pathLength: 1, rotate: [ -4, 4, 0 ] }}
          transition={{ duration: 0.58, delay: 0.14, ease: softEase }}
        />
        <motion.path
          d="M82 70 C56 52 52 30 66 18 C92 27 101 52 82 70 Z"
          fill={leaf}
          opacity="0.88"
          stroke={stem}
          strokeWidth="2.5"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.68, rotate: -10 }}
          animate={reducedMotion ? undefined : { opacity: 0.88, scale: 1, rotate: 0 }}
          transition={{ duration: 0.44, delay: 0.44, ease: easeOutExpo }}
        />
        <motion.path
          d="M86 71 C114 54 119 31 101 18 C77 29 67 53 86 71 Z"
          fill={dark ? 'oklch(76% 0.12 135)' : 'oklch(68% 0.12 137)'}
          opacity="0.82"
          stroke={stem}
          strokeWidth="2.3"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.68, rotate: 10 }}
          animate={reducedMotion ? undefined : { opacity: 0.82, scale: 1, rotate: 0 }}
          transition={{ duration: 0.44, delay: 0.48, ease: easeOutExpo }}
        />
        <motion.path
          d="M36 24 C78 6 121 24 136 66 C148 100 126 136 80 142 C34 136 12 100 24 66 C28 48 32 34 36 24 Z"
          fill="none"
          stroke={glass}
          strokeWidth="2"
          initial={reducedMotion ? false : { opacity: 0, pathLength: 0.24 }}
          animate={reducedMotion ? undefined : { opacity: 1, pathLength: 1 }}
          transition={{ duration: 0.52, delay: 0.58, ease: softEase }}
        />
        <motion.path
          d="M48 34 C70 22 100 22 118 39"
          fill="none"
          stroke="oklch(100% 0 0 / 0.62)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={reducedMotion ? false : { opacity: 0, x: -8 }}
          animate={reducedMotion ? undefined : { opacity: [0, 0.9, 0.42], x: [ -8, 8, 0 ] }}
          transition={{ duration: 0.44, delay: 0.72, ease: easeOutExpo }}
        />
      </svg>
      <motion.div
        className="mt-5"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: reducedMotion ? 0 : 0.78, ease: easeOutExpo }}
      >
        <p className="font-nunito text-2xl font-black leading-none" style={{ color: ink }}>
          Spring Nest
        </p>
        <p className="mt-2 font-nunito text-sm font-bold" style={{ color: dark ? 'oklch(78% 0.08 90)' : 'oklch(48% 0.07 92)' }}>
          春日小筑
        </p>
      </motion.div>
    </motion.div>
  );
}

export default memo(LightweightEmergenceSplash);
```

- [ ] **Step 2: Export the glass garden components**

Create `src/components/animations/glassGarden/index.ts`:

```ts
export { default as LightweightEmergenceSplash } from './LightweightEmergenceSplash';
export { getGlassGardenProfile, glassGardenProfiles } from './sceneProfiles';
export type { GlassGardenProfile, GlassGardenProfileKey } from './sceneProfiles';
```

- [ ] **Step 3: Typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/components/animations/glassGarden/LightweightEmergenceSplash.tsx src/components/animations/glassGarden/index.ts
git commit -m "feat: add lightweight emergence splash"
```

## Task 5: Desktop Three.js Terrarium Scene

**Files:**
- Create: `src/components/animations/glassGarden/GlassTerrariumScene.tsx`
- Modify: `src/components/animations/glassGarden/index.ts`
- Test: `npm run typecheck`

- [ ] **Step 1: Create the reusable Three.js scene**

Create `src/components/animations/glassGarden/GlassTerrariumScene.tsx`:

```tsx
import { Float, PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { memo, useMemo, useRef } from 'react';
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  Mesh,
  Shape,
  Vector3,
} from 'three';
import type { GlassGardenProfile } from './sceneProfiles';

type GlassTerrariumSceneProps = {
  profile: GlassGardenProfile;
  phase: 'splash' | 'ambient';
  dark: boolean;
};

function makeLeafShape(side: -1 | 1) {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(side * 0.28, 0.34, side * 0.62, 0.46, side * 0.88, 0.18);
  shape.bezierCurveTo(side * 0.48, -0.12, side * 0.22, -0.18, 0, 0);
  return shape;
}

function seeded(index: number) {
  const value = Math.sin(index * 999.13) * 10000;
  return value - Math.floor(value);
}

function SoilClumps({ count, dark }: { count: number; dark: boolean }) {
  const clumps = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: -2.1 + seeded(index + 1) * 4.2,
        z: -0.75 + seeded(index + 7) * 1.5,
        y: -1.02 + seeded(index + 11) * 0.1,
        scale: 0.08 + seeded(index + 17) * 0.16,
        rotate: seeded(index + 23) * Math.PI,
      })),
    [count],
  );

  return (
    <group>
      {clumps.map((clump, index) => (
        <mesh
          key={index}
          position={[clump.x, clump.y, clump.z]}
          rotation={[clump.rotate, clump.rotate * 0.4, clump.rotate * 0.2]}
          scale={[clump.scale * 1.4, clump.scale * 0.8, clump.scale]}
        >
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color={dark ? '#4a3224' : '#8a6242'}
            roughness={0.94}
            metalness={0.02}
          />
        </mesh>
      ))}
    </group>
  );
}

function RootCurves({ count, dark }: { count: number; dark: boolean }) {
  const roots = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const startX = -0.08 + seeded(index + 31) * 0.16;
        const endX = (seeded(index + 41) - 0.5) * 2.8;
        const endZ = -0.32 + seeded(index + 43) * 0.7;
        return new CatmullRomCurve3([
          new Vector3(startX, -0.72, -0.05),
          new Vector3(startX * 3, -0.98, endZ * 0.4),
          new Vector3(endX, -1.16, endZ),
        ]);
      }),
    [count],
  );

  return (
    <group>
      {roots.map((root, index) => (
        <mesh key={index}>
          <tubeGeometry args={[root, 14, 0.012, 6, false]} />
          <meshStandardMaterial color={dark ? '#d9c1a7' : '#e3d2ba'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function DewAndDust({ count, dark }: { count: number; dark: boolean }) {
  const drops = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => ({
        x: -1.65 + seeded(index + 61) * 3.3,
        y: -0.15 + seeded(index + 67) * 2.2,
        z: -0.9 + seeded(index + 71) * 1.8,
        scale: 0.018 + seeded(index + 73) * 0.028,
      })),
    [count],
  );

  return (
    <group>
      {drops.map((drop, index) => (
        <Float key={index} speed={0.45 + seeded(index + 80)} floatIntensity={0.08} rotationIntensity={0.05}>
          <mesh position={[drop.x, drop.y, drop.z]} scale={drop.scale}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial
              color={dark ? '#dff8e8' : '#ffffff'}
              roughness={0.05}
              metalness={0}
              transparent
              opacity={0.52}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Sprout({ profile, phase, dark }: GlassTerrariumSceneProps) {
  const groupRef = useRef<Group>(null);
  const leftLeaf = useMemo(() => makeLeafShape(-1), []);
  const rightLeaf = useMemo(() => makeLeafShape(1), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const emergence = phase === 'splash' ? Math.min(1, t / 1.15) : 1;
    groupRef.current.position.y = -0.88 + emergence * 1.08 + Math.sin(t * 1.1) * 0.012;
    groupRef.current.rotation.z = Math.sin(t * 1.6) * (phase === 'splash' ? 0.045 : 0.014);
    groupRef.current.scale.setScalar(profile.sproutScale * (0.72 + emergence * 0.28));
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.25, 0]}>
        <capsuleGeometry args={[0.055, 0.86, 7, 12]} />
        <meshStandardMaterial
          color={dark ? '#8fd4a5' : '#3f6751'}
          roughness={0.52}
          metalness={0.02}
        />
      </mesh>
      <mesh position={[-0.04, 0.3, 0]} rotation={[0.18, 0.2, 0.35]} scale={[0.72, 0.72, 0.72]}>
        <shapeGeometry args={[leftLeaf]} />
        <meshStandardMaterial
          color={dark ? '#9ee4b1' : '#77bd86'}
          side={DoubleSide}
          roughness={0.62}
          metalness={0.02}
        />
      </mesh>
      <mesh position={[0.05, 0.29, 0.02]} rotation={[0.14, -0.18, -0.28]} scale={[0.68, 0.72, 0.72]}>
        <shapeGeometry args={[rightLeaf]} />
        <meshStandardMaterial
          color={dark ? '#b8e4c9' : '#8fd4a5'}
          side={DoubleSide}
          roughness={0.64}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

function GlassDome({ strength, dark }: { strength: number; dark: boolean }) {
  return (
    <group position={[0, -0.1, 0]}>
      <mesh rotation={[0, 0, 0]}>
        <sphereGeometry args={[1.95, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
        <meshPhysicalMaterial
          color={new Color(dark ? '#d7ffe8' : '#ffffff')}
          transparent
          opacity={0.08 + strength * 0.08}
          roughness={0.02}
          metalness={0}
          transmission={0.42}
          thickness={0.38}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, -1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.65, 0.012, 8, 96]} />
        <meshStandardMaterial color={dark ? '#dff8e8' : '#ffffff'} transparent opacity={0.22 + strength * 0.16} />
      </mesh>
    </group>
  );
}

function GlassTerrariumScene({ profile, phase, dark }: GlassTerrariumSceneProps) {
  const sceneRef = useRef<Group>(null);

  useFrame(({ clock, pointer }) => {
    if (!sceneRef.current) return;
    const t = clock.getElapsedTime();
    const parallax = phase === 'ambient' ? profile.parallaxStrength * 0.002 : 0;
    sceneRef.current.rotation.y = pointer.x * parallax + Math.sin(t * 0.16) * 0.018;
    sceneRef.current.rotation.x = -0.08 + pointer.y * parallax;
  });

  return (
    <group ref={sceneRef}>
      <PerspectiveCamera makeDefault position={[0, 0.65, 4.2]} fov={38} />
      <ambientLight intensity={dark ? 0.7 : 0.92} />
      <directionalLight position={[-2, 3.4, 3]} intensity={dark ? 1.2 : 1.6} color={profile.warmth > 0.55 ? '#ffe0bc' : '#ffffff'} />
      <pointLight position={[1.8, 0.7, 1.4]} intensity={dark ? 0.55 : 0.36} color="#b8e4c9" />
      <mesh position={[0, -1.16, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[2.4, 1.12, 1]}>
        <circleGeometry args={[1, 96]} />
        <meshStandardMaterial color={dark ? '#3d2a1f' : '#7a5639'} roughness={0.96} metalness={0.01} />
      </mesh>
      <RootCurves count={profile.rootCurves} dark={dark} />
      <SoilClumps count={profile.soilClumps} dark={dark} />
      <Sprout profile={profile} phase={phase} dark={dark} />
      <DewAndDust count={profile.dewDrops + Math.floor(profile.particleCount / 3)} dark={dark} />
      <GlassDome strength={profile.glassStrength} dark={dark} />
    </group>
  );
}

export default memo(GlassTerrariumScene);
```

- [ ] **Step 2: Export the scene**

Update `src/components/animations/glassGarden/index.ts`:

```ts
export { default as GlassTerrariumScene } from './GlassTerrariumScene';
export { default as LightweightEmergenceSplash } from './LightweightEmergenceSplash';
export { getGlassGardenProfile, glassGardenProfiles } from './sceneProfiles';
export type { GlassGardenProfile, GlassGardenProfileKey } from './sceneProfiles';
```

- [ ] **Step 3: Typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS. If TypeScript rejects any Three material prop because of package version typing, replace that prop with the closest supported `meshPhysicalMaterial` prop and rerun.

- [ ] **Step 4: Commit**

```powershell
git add src/components/animations/glassGarden/GlassTerrariumScene.tsx src/components/animations/glassGarden/index.ts
git commit -m "feat: add glass terrarium scene"
```

## Task 6: Desktop Startup Canvas Wrapper

**Files:**
- Create: `src/components/animations/glassGarden/TerrariumEmergenceSplash.tsx`
- Modify: `src/components/animations/glassGarden/index.ts`
- Test: `npm run typecheck`

- [ ] **Step 1: Create the desktop startup wrapper**

Create `src/components/animations/glassGarden/TerrariumEmergenceSplash.tsx`:

```tsx
import { Canvas } from '@react-three/fiber';
import { memo } from 'react';
import { motion } from 'motion/react';
import { easeOutExpo } from '../../../lib/animations';
import GlassTerrariumScene from './GlassTerrariumScene';
import { glassGardenProfiles } from './sceneProfiles';

type TerrariumEmergenceSplashProps = {
  dark: boolean;
  reducedMotion: boolean;
};

function TerrariumEmergenceSplash({ dark, reducedMotion }: TerrariumEmergenceSplashProps) {
  return (
    <motion.div
      className="relative mx-4 grid h-[min(66vh,520px)] w-[min(88vw,760px)] overflow-hidden rounded-[2.25rem] border shadow-[0_34px_90px_rgba(63,103,81,0.18)]"
      style={{
        background: dark
          ? 'linear-gradient(145deg, oklch(13% 0.018 145), oklch(10% 0.014 80))'
          : 'linear-gradient(145deg, oklch(98% 0.018 86), oklch(94% 0.034 145), oklch(96% 0.024 54))',
        borderColor: dark ? 'oklch(88% 0.06 145 / 0.12)' : 'oklch(42% 0.08 145 / 0.12)',
      }}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: easeOutExpo }}
    >
      <div className="absolute inset-0 glass-garden-readability-veil" aria-hidden="true" />
      <Canvas
        className="glass-garden-canvas"
        dpr={[1, 1.6]}
        frameloop={reducedMotion ? 'demand' : 'always'}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      >
        <GlassTerrariumScene profile={glassGardenProfiles.startup} phase="splash" dark={dark} />
      </Canvas>
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-8 text-center"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.96, ease: easeOutExpo }}
      >
        <p className="font-nunito text-3xl font-black leading-none text-primary dark:text-primary">
          Spring Nest
        </p>
        <p className="mt-2 font-nunito text-sm font-bold text-secondary dark:text-secondary">
          春日小筑
        </p>
      </motion.div>
    </motion.div>
  );
}

export default memo(TerrariumEmergenceSplash);
```

- [ ] **Step 2: Export the wrapper**

Update `src/components/animations/glassGarden/index.ts`:

```ts
export { default as GlassTerrariumScene } from './GlassTerrariumScene';
export { default as LightweightEmergenceSplash } from './LightweightEmergenceSplash';
export { default as TerrariumEmergenceSplash } from './TerrariumEmergenceSplash';
export { getGlassGardenProfile, glassGardenProfiles } from './sceneProfiles';
export type { GlassGardenProfile, GlassGardenProfileKey } from './sceneProfiles';
```

- [ ] **Step 3: Typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/components/animations/glassGarden/TerrariumEmergenceSplash.tsx src/components/animations/glassGarden/index.ts
git commit -m "feat: add terrarium emergence splash"
```

## Task 7: Integrate Startup Splash Selection

**Files:**
- Modify: `src/components/animations/StartupSplash.tsx`
- Test: `src/__tests__/startupSplashFallback.test.tsx`

- [ ] **Step 1: Write the fallback test**

Create `src/__tests__/startupSplashFallback.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StartupSplash from '../components/animations/StartupSplash';

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ resolved: 'light' }),
}));

vi.mock('../lib/animations', async () => {
  const actual = await vi.importActual<typeof import('../lib/animations')>('../lib/animations');
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

vi.mock('../lib/visualCapability', () => ({
  useVisualCapability: () => ({ mode: 'lightweight', reason: 'narrow-viewport' }),
}));

describe('StartupSplash fallback', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the lightweight spring nest startup for non-3d contexts', () => {
    render(<StartupSplash />);
    expect(screen.getByRole('status', { name: /Spring Nest loading/i })).toBeVisible();
    expect(screen.getByText('Spring Nest')).toBeVisible();
    expect(screen.getByText('春日小筑')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
npm run test -- src/__tests__/startupSplashFallback.test.tsx
```

Expected: FAIL because `StartupSplash` still renders the older component or does not use `useVisualCapability`.

- [ ] **Step 3: Update `StartupSplash` imports**

In `src/components/animations/StartupSplash.tsx`, replace the direct `SpringNestLogoMotion` import with lazy imports and capability detection:

```tsx
import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';
import { easeOutExpo, useReducedMotion } from '../../lib/animations';
import { useVisualCapability } from '../../lib/visualCapability';
import LightweightEmergenceSplash from './glassGarden/LightweightEmergenceSplash';

const TerrariumEmergenceSplash = lazy(
  () => import('./glassGarden/TerrariumEmergenceSplash'),
);
```

- [ ] **Step 4: Update the splash timing and body selection**

Inside `StartupSplash`, add:

```tsx
const capability = useVisualCapability();
const useDesktop3d = capability.mode === 'desktop-3d';
```

Update the exit delay effect:

```tsx
const exitDelay = reducedMotion ? 80 : useDesktop3d ? 1700 : compact ? 1250 : 1400;
```

Replace the old `<SpringNestLogoMotion ... />` render with:

```tsx
<Suspense
  fallback={
    <LightweightEmergenceSplash compact={compact} dark={dark} reducedMotion={reducedMotion} />
  }
>
  {useDesktop3d ? (
    <TerrariumEmergenceSplash dark={dark} reducedMotion={reducedMotion} />
  ) : (
    <LightweightEmergenceSplash compact={compact} dark={dark} reducedMotion={reducedMotion} />
  )}
</Suspense>
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```powershell
npm run test -- src/__tests__/startupSplashFallback.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/components/animations/StartupSplash.tsx src/__tests__/startupSplashFallback.test.tsx
git commit -m "feat: select terrarium startup by capability"
```

## Task 8: Desktop Ambient Background Canvas

**Files:**
- Create: `src/components/animations/glassGarden/GlassGardenCanvas.tsx`
- Modify: `src/components/animations/glassGarden/index.ts`
- Modify: `src/components/animations/DynamicSpringBackground.tsx`
- Test: `npm run typecheck`

- [ ] **Step 1: Create the ambient canvas wrapper**

Create `src/components/animations/glassGarden/GlassGardenCanvas.tsx`:

```tsx
import { Canvas } from '@react-three/fiber';
import { memo } from 'react';
import type { BackgroundProfile } from '../../../lib/backgroundProfiles';
import GlassTerrariumScene from './GlassTerrariumScene';
import { getGlassGardenProfile } from './sceneProfiles';

type GlassGardenCanvasProps = {
  backgroundProfile: BackgroundProfile;
  dark: boolean;
};

function mapBackgroundProfileKey(key: string) {
  if (key === 'home-garden') return 'home';
  if (key === 'tools-flow') return 'tools';
  if (key === 'games-playful') return 'games';
  if (key === 'search-focus') return 'search';
  if (key === 'empty-quiet') return 'empty';
  return 'detail';
}

function GlassGardenCanvas({ backgroundProfile, dark }: GlassGardenCanvasProps) {
  const glassProfile = getGlassGardenProfile(mapBackgroundProfileKey(backgroundProfile.key));

  return (
    <div className="glass-garden-ambient-layer" aria-hidden="true">
      <Canvas
        className="glass-garden-canvas"
        dpr={[1, 1.35]}
        frameloop="always"
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      >
        <GlassTerrariumScene profile={glassProfile} phase="ambient" dark={dark} />
      </Canvas>
    </div>
  );
}

export default memo(GlassGardenCanvas);
```

- [ ] **Step 2: Export the ambient canvas**

Update `src/components/animations/glassGarden/index.ts`:

```ts
export { default as GlassGardenCanvas } from './GlassGardenCanvas';
export { default as GlassTerrariumScene } from './GlassTerrariumScene';
export { default as LightweightEmergenceSplash } from './LightweightEmergenceSplash';
export { default as TerrariumEmergenceSplash } from './TerrariumEmergenceSplash';
export { getGlassGardenProfile, glassGardenProfiles } from './sceneProfiles';
export type { GlassGardenProfile, GlassGardenProfileKey } from './sceneProfiles';
```

- [ ] **Step 3: Lazy-load ambient canvas in `DynamicSpringBackground`**

In `src/components/animations/DynamicSpringBackground.tsx`, update imports:

```tsx
import { lazy, memo, Suspense, useEffect, useMemo, useState } from 'react';
import { useVisualCapability } from '../../lib/visualCapability';
```

Add the lazy component near imports:

```tsx
const GlassGardenCanvas = lazy(() => import('./glassGarden/GlassGardenCanvas'));
```

Inside the component, add:

```tsx
const capability = useVisualCapability();
const showDesktopGlassGarden = capability.mode === 'desktop-3d' && !reducedMotion && !compact;
```

Render the canvas inside the root background div after the 2D scene layer and before the final vignette:

```tsx
{showDesktopGlassGarden && (
  <Suspense fallback={null}>
    <GlassGardenCanvas backgroundProfile={activeProfile} dark={resolved === 'dark'} />
  </Suspense>
)}
```

- [ ] **Step 4: Typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/animations/glassGarden/GlassGardenCanvas.tsx src/components/animations/glassGarden/index.ts src/components/animations/DynamicSpringBackground.tsx
git commit -m "feat: add desktop glass garden background"
```

## Task 9: CSS Layering And Readability

**Files:**
- Modify: `src/index.css`
- Test: `npm run typecheck`

- [ ] **Step 1: Add canvas and readability styles**

Append this block near the existing motion/surface utility section in `src/index.css`:

```css
/* ── Glass Garden 3D atmosphere ── */
.glass-garden-ambient-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.72;
  mix-blend-mode: normal;
  mask-image: radial-gradient(circle at 50% 28%, black, transparent 78%);
}

.glass-garden-canvas {
  position: absolute !important;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  pointer-events: none;
}

.glass-garden-readability-veil {
  background:
    radial-gradient(circle at 42% 18%, color-mix(in srgb, white 42%, transparent), transparent 34%),
    linear-gradient(180deg, transparent, color-mix(in srgb, var(--color-background) 28%, transparent));
}

.dark .glass-garden-readability-veil {
  background:
    radial-gradient(circle at 42% 18%, color-mix(in srgb, white 10%, transparent), transparent 34%),
    linear-gradient(180deg, transparent, color-mix(in srgb, var(--color-background) 34%, transparent));
}

@media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .glass-garden-ambient-layer {
    display: none;
  }
}
```

- [ ] **Step 2: Verify no type regressions**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add src/index.css
git commit -m "style: add glass garden background layers"
```

## Task 10: UI Motion Polish Pass

**Files:**
- Modify: `src/lib/animations.ts`
- Modify: `src/components/MotionSurface.tsx`
- Modify: `src/components/Navigation.tsx`
- Modify: `src/components/CatalogItemCard.tsx`
- Test: existing `src/__tests__/animations.test.ts`
- Test: existing `src/__tests__/motionSurface.test.tsx`
- Test: existing `src/__tests__/catalogItemCard.test.tsx`

- [ ] **Step 1: Add a restrained glass garden surface tone**

In `src/lib/animations.ts`, extend:

```ts
export type SurfaceMotionTone = 'tool' | 'game' | 'playful' | 'quiet' | 'glassGarden';
```

Update `getSurfaceMotionPreset` with this branch before the default return:

```ts
if (tone === 'glassGarden') {
  return {
    hover: { y: -4, scale: 1.008, rotateX: 1.2 },
    tap: { scale: 0.985 },
    transition: springUtility,
  };
}
```

- [ ] **Step 2: Add a test expectation for the new tone**

Update `src/__tests__/animations.test.ts` in the `returns surface presets by interaction tone` test:

```ts
expect(getSurfaceMotionPreset('glassGarden').hover.y).toBeLessThan(0);
expect(getSurfaceMotionPreset('glassGarden').hover.scale).toBeGreaterThan(1);
```

- [ ] **Step 3: Let `MotionCard` preserve 3D transform style**

In `src/components/MotionSurface.tsx`, keep existing behavior and ensure the style block in `MotionCard` includes:

```tsx
style={{
  transformStyle: 'preserve-3d',
  willChange: reducedMotion || !interactive ? 'auto' : 'transform',
  ...style,
}}
```

- [ ] **Step 4: Use the tone on featured catalog cards**

In `src/components/CatalogItemCard.tsx`, update `getCardTone`:

```ts
function getCardTone(variant: CatalogItemVariant): SurfaceMotionTone {
  if (variant === 'game') return 'game';
  if (variant === 'feature') return 'glassGarden';
  return 'tool';
}
```

- [ ] **Step 5: Keep navigation polish restrained**

In `src/components/Navigation.tsx`, update the active tab indicator class:

```tsx
className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary-container shadow-[0_0_12px_rgba(63,103,81,0.18)]"
```

- [ ] **Step 6: Run focused tests**

Run:

```powershell
npm run test -- src/__tests__/animations.test.ts src/__tests__/motionSurface.test.tsx src/__tests__/catalogItemCard.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/lib/animations.ts src/components/MotionSurface.tsx src/components/CatalogItemCard.tsx src/components/Navigation.tsx src/__tests__/animations.test.ts
git commit -m "feat: polish glass garden ui motion"
```

## Task 11: Playwright Guardrails

**Files:**
- Modify: `e2e/app.spec.ts`

- [ ] **Step 1: Add desktop canvas and mobile fallback tests**

Append these tests inside `test.describe('Spring Nest App', () => { ... })` in `e2e/app.spec.ts`:

```ts
test('glass garden startup can be skipped and does not block the app', async ({ page }) => {
  await page.goto('/');
  const splash = page.getByRole('status', { name: /Spring Nest loading/i });
  await expect(splash).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(splash).not.toBeVisible({ timeout: 3000 });
  await expect(page.locator('main')).toBeVisible();
});

test('desktop glass garden background stays behind interactive UI', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'canvas pixel checks are only run on Chromium');
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('main')).toBeVisible();
  const searchButton = page.locator('header button').filter({ has: page.locator('svg.lucide-search') });
  await searchButton.click();
  await expect(page.getByRole('textbox', { name: '搜索游戏、工具' })).toBeVisible();
});

test('mobile viewport does not mount desktop glass garden background', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile fallback check only runs in mobile project');
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('.glass-garden-ambient-layer')).toHaveCount(0);
  await expect(page.locator('main')).toBeVisible();
});
```

- [ ] **Step 2: Run the E2E smoke suite**

Run:

```powershell
npm run test:e2e -- e2e/app.spec.ts
```

Expected: PASS. If unrelated existing E2E tests fail, capture the failing test names and rerun the new three tests directly before deciding whether to fix broader suite issues.

- [ ] **Step 3: Commit**

```powershell
git add e2e/app.spec.ts
git commit -m "test: cover glass garden visual fallbacks"
```

## Task 12: Final Verification And Visual QA

**Files:**
- No required file changes unless verification finds issues.

- [ ] **Step 1: Run unit tests**

Run:

```powershell
npm run test -- src/__tests__/visualCapability.test.ts src/__tests__/glassGardenProfiles.test.ts src/__tests__/startupSplashFallback.test.tsx src/__tests__/animations.test.ts src/__tests__/motionSurface.test.tsx src/__tests__/catalogItemCard.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS. Confirm the build output includes a Three-related chunk and does not inline all Three code into the main app chunk.

- [ ] **Step 4: Run E2E**

Run:

```powershell
npm run test:e2e
```

Expected: PASS or documented pre-existing failures. New glass garden tests must pass.

- [ ] **Step 5: Manual desktop QA**

Start the app:

```powershell
npm run dev
```

Open `http://localhost:3000` and check:

- First visit shows the realistic emergence startup for 1.2-1.8 seconds.
- Escape skips the splash.
- Home background has subtle Glass Terrarium depth.
- Tools page is calmer than home.
- Games page feels more lively than tools.
- Detail pages keep active content readable.
- Search overlay remains clickable.
- No visible text overlap or button overflow.

- [ ] **Step 6: Manual mobile QA**

Use the browser devtools mobile viewport or Playwright mobile project and check:

- No desktop 3D ambient canvas is mounted.
- Startup uses lightweight emergence motion.
- Scrolling and tapping remain responsive.
- Navigation menu and search overlay are not blocked.

- [ ] **Step 7: Manual reduced-motion QA**

In browser settings or devtools, emulate `prefers-reduced-motion: reduce` and check:

- Startup is near-static or very short.
- Desktop 3D background does not mount.
- UI remains usable.

- [ ] **Step 8: Commit fixes if needed**

If QA required fixes:

```powershell
git add <changed-files>
git commit -m "fix: stabilize glass garden motion"
```

If no fixes were needed, do not create an empty commit.

## Self-Review Notes

- Spec coverage: startup realism, desktop/mobile split, background layers, UI polish, fallbacks, accessibility, performance, and tests are all covered by Tasks 1-12.
- Banned-phrase scan: checked for incomplete planning language; none is used as an instruction.
- Type consistency: component names use `TerrariumEmergenceSplash`, `GlassGardenCanvas`, `GlassTerrariumScene`, `LightweightEmergenceSplash`, and `useVisualCapability` consistently across tasks.
