# Spring Nest Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified spring-playground motion and visual surface system across Spring Nest without rewriting individual tool and game internals.

**Architecture:** Centralize motion constants in `src/lib/animations.ts`, expose shared interaction primitives from `src/components/MotionSurface.tsx`, and add stable surface utilities in `src/index.css`. Apply those primitives first to navigation, homepage catalog cards, tools/games catalog pages, detail shells, loading states, and E2E visual guardrails.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, `motion/react`, Vitest, Playwright.

---

## Scope Check

This plan implements one cohesive system: motion tokens, shared surfaces, and priority page integration. It does not split into separate plans because the files depend on a shared interaction layer and should be verified together.

## File Structure

- Modify `.gitignore`: ignore `.superpowers/` brainstorming artifacts.
- Modify `src/lib/animations.ts`: add semantic motion tokens, route profiles, surface presets, list variants, and reduced-motion-safe helpers.
- Create `src/__tests__/animations.test.ts`: lock the animation token contract.
- Modify `src/components/MotionSurface.tsx`: add `MotionButton`, `MotionCard`, `MotionPanel`, `MotionList`, and `AnimatedPresenceBlock` while preserving `TiltGlareCard` and `MagneticButton`.
- Create `src/__tests__/motionSurface.test.tsx`: render-test the shared motion primitives.
- Modify `src/index.css`: add surface, control, card, and feedback utility classes.
- Create `src/components/CatalogItemCard.tsx`: shared tool/game card with controlled motion intensity.
- Create `src/__tests__/catalogItemCard.test.tsx`: render-test the shared catalog card.
- Modify `src/components/Navigation.tsx`: use shared buttons and panels for search, menu, toast, theme, and account controls.
- Modify `src/pages/Home.tsx`: replace the local featured card with `CatalogItemCard` and align section motion.
- Modify `src/pages/Tools.tsx`: use shared catalog cards, list motion, empty state motion, and surface classes.
- Modify `src/pages/Games.tsx`: use shared catalog cards, list motion, empty state motion, and surface classes.
- Modify `src/components/GameToolLoading.tsx`: use shared presence and loading surface classes.
- Modify `src/components/SkeletonCard.tsx`: align skeleton cards with the surface system.
- Modify `e2e/app.spec.ts`: add visual and interaction guardrails for hover stability, search overlay, mobile menu, and reduced-motion behavior.

## Task 1: Repository Hygiene For Brainstorm Artifacts

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add the ignore rule**

Append this line to `.gitignore` after `.qa-screenshots/`:

```gitignore
.superpowers/
```

- [ ] **Step 2: Verify the brainstorming directory is ignored**

Run: `git status --short .superpowers`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore superpowers brainstorm artifacts"
```

## Task 2: Lock The Motion Token Contract With Tests

**Files:**
- Create: `src/__tests__/animations.test.ts`
- Modify later: `src/lib/animations.ts`

- [ ] **Step 1: Write the failing token tests**

Create `src/__tests__/animations.test.ts` with this content:

```ts
import { describe, expect, it } from 'vitest';
import {
  getRouteMotionProfile,
  getSurfaceMotionPreset,
  motionDurations,
  motionStaggers,
  springPlayful,
  springUtility,
} from '../lib/animations';

describe('motion design tokens', () => {
  it('defines stable duration and stagger scales', () => {
    expect(motionDurations.fast).toBeLessThan(motionDurations.normal);
    expect(motionDurations.normal).toBeLessThan(motionDurations.slow);
    expect(motionDurations.ambient).toBeGreaterThan(10);
    expect(motionStaggers.tight).toBeLessThan(motionStaggers.relaxed);
  });

  it('uses spring profiles that separate playful and utility motion', () => {
    expect(springPlayful.type).toBe('spring');
    expect(springUtility.type).toBe('spring');
    expect(springPlayful.stiffness).toBeGreaterThan(springUtility.stiffness);
    expect(springUtility.damping).toBeGreaterThan(springPlayful.damping);
  });

  it('returns route profiles by page family', () => {
    expect(getRouteMotionProfile('home').animate.transition).toMatchObject({
      type: 'spring',
    });
    expect(getRouteMotionProfile('game').animate.transition).toMatchObject({
      type: 'spring',
    });
    expect(getRouteMotionProfile('tool').animate.transition.damping).toBeGreaterThan(
      getRouteMotionProfile('game').animate.transition.damping,
    );
  });

  it('returns surface presets by interaction tone', () => {
    expect(getSurfaceMotionPreset('tool').hover.y).toBeLessThan(0);
    expect(getSurfaceMotionPreset('game').hover.y).toBeLessThan(
      getSurfaceMotionPreset('tool').hover.y,
    );
    expect(getSurfaceMotionPreset('quiet').hover.scale).toBe(1);
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `npm run test -- src/__tests__/animations.test.ts`

Expected: FAIL because the new exports are not defined.

## Task 3: Add Semantic Motion Tokens

**Files:**
- Modify: `src/lib/animations.ts`
- Test: `src/__tests__/animations.test.ts`

- [ ] **Step 1: Add the semantic token block**

In `src/lib/animations.ts`, add this block after the existing spring preset exports and before `gridContainerVariants`:

```ts
export const motionDurations = {
  fast: 0.16,
  normal: 0.28,
  slow: 0.48,
  ambient: 18,
} as const;

export const motionStaggers = {
  tight: 0.025,
  normal: 0.045,
  relaxed: 0.075,
} as const;

export const springPlayful = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 18,
  mass: 0.75,
};

export const springSoft = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

export const springUtility = {
  type: 'spring' as const,
  stiffness: 230,
  damping: 32,
  mass: 0.9,
};

export const springFocus = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 28,
  mass: 0.7,
};

export const easeSpringNest = easeOutExpo;
export const easeExitTight = [0.4, 0, 1, 1] as const;

export type RouteMotionKind = 'home' | 'tool' | 'game' | 'detail' | 'quiet';

export function getRouteMotionProfile(kind: RouteMotionKind) {
  const transition =
    kind === 'game'
      ? springPlayful
      : kind === 'tool' || kind === 'detail'
        ? springUtility
        : springSoft;

  return {
    initial: {
      opacity: 0,
      y: kind === 'quiet' ? 8 : 18,
      scale: kind === 'quiet' ? 1 : 0.985,
      rotateX: kind === 'game' ? 2 : 0,
      transformPerspective: 1400,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition,
    },
    exit: {
      opacity: 0,
      y: -8,
      scale: 0.992,
      transition: { duration: motionDurations.fast, ease: easeExitTight },
    },
  };
}

export type SurfaceMotionTone = 'tool' | 'game' | 'playful' | 'quiet';

export function getSurfaceMotionPreset(tone: SurfaceMotionTone = 'tool') {
  if (tone === 'quiet') {
    return {
      hover: { y: 0, scale: 1 },
      tap: { scale: 0.99 },
      transition: springUtility,
    };
  }

  if (tone === 'game' || tone === 'playful') {
    return {
      hover: { y: -8, scale: 1.018 },
      tap: { scale: 0.97 },
      transition: springPlayful,
    };
  }

  return {
    hover: { y: -5, scale: 1.01 },
    tap: { scale: 0.98 },
    transition: springUtility,
  };
}

export const motionListVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: motionStaggers.normal,
      delayChildren: motionStaggers.tight,
    },
  },
  exit: {
    transition: {
      staggerChildren: motionStaggers.tight,
      staggerDirection: -1,
    },
  },
};

export const presenceBlockVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: motionDurations.normal, ease: easeSpringNest },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: motionDurations.fast, ease: easeExitTight },
  },
};
```

- [ ] **Step 2: Reuse route profiles in the existing page transition export**

Replace the existing `pageTransitionVariants` object in `src/lib/animations.ts` with:

```ts
/** Route-level page transition — spatial lift, no filters or layout animation */
export const pageTransitionVariants = getRouteMotionProfile('home');
```

- [ ] **Step 3: Run the token tests**

Run: `npm run test -- src/__tests__/animations.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/animations.ts src/__tests__/animations.test.ts
git commit -m "feat: add semantic motion tokens"
```

## Task 4: Test Shared Motion Surface Primitives

**Files:**
- Create: `src/__tests__/motionSurface.test.tsx`
- Modify later: `src/components/MotionSurface.tsx`

- [ ] **Step 1: Write failing render tests**

Create `src/__tests__/motionSurface.test.tsx` with this content:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AnimatedPresenceBlock,
  MotionButton,
  MotionCard,
  MotionList,
  MotionPanel,
} from '../components/MotionSurface';

describe('MotionSurface primitives', () => {
  it('renders a motion button with the requested label and class', () => {
    const onClick = vi.fn();
    render(
      <MotionButton type="button" tone="primary" onClick={onClick}>
        Open
      </MotionButton>,
    );

    const button = screen.getByRole('button', { name: 'Open' });
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.className).toContain('motion-button');
    expect(button.className).toContain('motion-button-primary');
  });

  it('renders cards and panels with stable surface classes', () => {
    render(
      <MotionPanel aria-label="Panel">
        <MotionCard tone="game">Play card</MotionCard>
      </MotionPanel>,
    );

    expect(screen.getByLabelText('Panel').className).toContain('motion-panel');
    expect(screen.getByText('Play card').className).toContain('motion-card');
    expect(screen.getByText('Play card').className).toContain('motion-card-game');
  });

  it('renders list and presence blocks without requiring layout animation', () => {
    render(
      <MotionList aria-label="Items">
        <AnimatedPresenceBlock>Ready</AnimatedPresenceBlock>
      </MotionList>,
    );

    expect(screen.getByLabelText('Items').className).toContain('motion-list');
    expect(screen.getByText('Ready').className).toContain('motion-presence-block');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- src/__tests__/motionSurface.test.tsx`

Expected: FAIL because the new components are not exported yet.

## Task 5: Add Shared Motion Surface Primitives

**Files:**
- Modify: `src/components/MotionSurface.tsx`
- Test: `src/__tests__/motionSurface.test.tsx`

- [ ] **Step 1: Extend the animation imports**

Change the `src/components/MotionSurface.tsx` animation import from:

```ts
import { springMagnetic, useReducedMotion } from '../lib/animations';
```

to:

```ts
import {
  getSurfaceMotionPreset,
  motionListVariants,
  presenceBlockVariants,
  springMagnetic,
  springSnappy,
  useReducedMotion,
  type SurfaceMotionTone,
} from '../lib/animations';
```

- [ ] **Step 2: Add the class helper near the top of the file**

Add this function after the imports:

```ts
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
```

- [ ] **Step 3: Add shared primitive components at the end of the file**

Append this code after the existing `MagneticButton` component:

```tsx
type MotionButtonTone = 'primary' | 'secondary' | 'icon' | 'ghost';

type MotionButtonProps = HTMLMotionProps<'button'> & {
  tone?: MotionButtonTone;
  magnetic?: boolean;
  children: ReactNode;
};

export function MotionButton({
  tone = 'secondary',
  magnetic = false,
  className = '',
  children,
  whileHover,
  whileTap,
  transition,
  ...props
}: MotionButtonProps) {
  const reducedMotion = useReducedMotion();
  const motionClass = cx('motion-button', `motion-button-${tone}`, className);
  const hover = reducedMotion ? undefined : (whileHover ?? { y: -1, scale: 1.02 });
  const tap = reducedMotion ? undefined : (whileTap ?? { scale: 0.96 });
  const motionTransition = transition ?? springSnappy;

  if (magnetic) {
    return (
      <MagneticButton
        {...props}
        className={motionClass}
        whileHover={hover}
        whileTap={tap}
        transition={motionTransition}
      >
        {children}
      </MagneticButton>
    );
  }

  return (
    <motion.button
      {...props}
      className={motionClass}
      whileHover={hover}
      whileTap={tap}
      transition={motionTransition}
    >
      {children}
    </motion.button>
  );
}

type MotionCardProps = HTMLMotionProps<'article'> & {
  tone?: SurfaceMotionTone;
  interactive?: boolean;
  children: ReactNode;
};

export function MotionCard({
  tone = 'tool',
  interactive = true,
  className = '',
  children,
  whileHover,
  whileTap,
  transition,
  ...props
}: MotionCardProps) {
  const reducedMotion = useReducedMotion();
  const preset = getSurfaceMotionPreset(tone);

  return (
    <motion.article
      {...props}
      className={cx('motion-card', `motion-card-${tone}`, className)}
      whileHover={reducedMotion || !interactive ? undefined : (whileHover ?? preset.hover)}
      whileTap={reducedMotion || !interactive ? undefined : (whileTap ?? preset.tap)}
      transition={transition ?? preset.transition}
      style={{
        willChange: reducedMotion || !interactive ? 'auto' : 'transform',
        ...props.style,
      }}
    >
      {children}
    </motion.article>
  );
}

type MotionPanelProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
};

export function MotionPanel({ className = '', children, ...props }: MotionPanelProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      className={cx('motion-panel', className)}
      variants={reducedMotion ? undefined : presenceBlockVariants}
      initial={reducedMotion ? false : 'initial'}
      animate="animate"
      exit={reducedMotion ? undefined : 'exit'}
    >
      {children}
    </motion.div>
  );
}

type MotionListProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
};

export function MotionList({ className = '', children, ...props }: MotionListProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      className={cx('motion-list', className)}
      variants={reducedMotion ? undefined : motionListVariants}
      initial={reducedMotion ? false : 'initial'}
      animate="animate"
      exit={reducedMotion ? undefined : 'exit'}
    >
      {children}
    </motion.div>
  );
}

type AnimatedPresenceBlockProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
};

export function AnimatedPresenceBlock({
  className = '',
  children,
  ...props
}: AnimatedPresenceBlockProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      className={cx('motion-presence-block', className)}
      variants={reducedMotion ? undefined : presenceBlockVariants}
      initial={reducedMotion ? false : 'initial'}
      animate="animate"
      exit={reducedMotion ? undefined : 'exit'}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run the surface tests**

Run: `npm run test -- src/__tests__/motionSurface.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run typecheck for the new exports**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/MotionSurface.tsx src/__tests__/motionSurface.test.tsx
git commit -m "feat: add shared motion surface primitives"
```

## Task 6: Add Shared Surface And Control Utilities

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add surface classes**

Add this block to `src/index.css` after the existing `.glass-pill` dark-mode rule:

```css
.surface-flat {
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
}

.surface-raised {
  background: color-mix(in srgb, var(--color-surface-container-lowest) 86%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-surface-variant) 42%, transparent);
  box-shadow:
    0 18px 45px -28px rgba(63, 103, 81, 0.36),
    0 8px 22px -18px rgba(63, 103, 81, 0.2);
}

.surface-playful {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-primary-container) 20%, transparent),
      color-mix(in srgb, var(--color-tertiary-container) 18%, transparent)
    ),
    color-mix(in srgb, var(--color-surface-container-lowest) 84%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary-container) 48%, transparent);
  box-shadow:
    0 22px 52px -30px rgba(63, 103, 81, 0.42),
    0 12px 28px -24px rgba(121, 86, 72, 0.32);
}

.surface-glass {
  background: color-mix(in srgb, var(--color-surface-container-lowest) 72%, transparent);
  backdrop-filter: blur(18px) saturate(1.08);
  border: 1px solid color-mix(in srgb, white 56%, transparent);
  box-shadow: 0 18px 48px -30px rgba(0, 0, 0, 0.24);
}

.dark .surface-raised {
  background: color-mix(in srgb, var(--color-surface-container-high) 82%, transparent);
  border-color: color-mix(in srgb, white 10%, transparent);
  box-shadow: 0 22px 58px -36px rgba(0, 0, 0, 0.72);
}

.dark .surface-playful {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-primary-container) 32%, transparent),
      color-mix(in srgb, var(--color-tertiary-container) 28%, transparent)
    ),
    color-mix(in srgb, var(--color-surface-container-high) 78%, transparent);
  border-color: color-mix(in srgb, var(--color-primary-container) 28%, transparent);
}

.dark .surface-glass {
  background: color-mix(in srgb, var(--color-surface-container-high) 72%, transparent);
  border-color: color-mix(in srgb, white 10%, transparent);
}
```

- [ ] **Step 2: Add motion primitive classes**

Add this block immediately after the surface classes:

```css
.motion-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  border-radius: 0.875rem;
  font-weight: 700;
  transition:
    background-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    color 180ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.motion-button-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: 0 12px 28px -18px rgba(63, 103, 81, 0.58);
}

.motion-button-secondary {
  background: color-mix(in srgb, var(--color-surface-container-lowest) 78%, transparent);
  color: var(--color-on-surface);
  border: 1px solid color-mix(in srgb, var(--color-surface-variant) 46%, transparent);
}

.motion-button-icon,
.motion-button-ghost {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-surface-container-lowest) 54%, transparent);
}

.motion-button-icon {
  width: 44px;
  padding: 0;
  border-radius: 9999px;
}

.motion-button-ghost {
  padding-inline: 0.875rem;
}

.motion-card {
  position: relative;
  overflow: hidden;
  border-radius: 1.25rem;
  transform-style: preserve-3d;
}

.motion-card-tool,
.motion-card-quiet {
  background: color-mix(in srgb, var(--color-surface-container-lowest) 86%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-surface-variant) 42%, transparent);
  box-shadow:
    0 18px 45px -28px rgba(63, 103, 81, 0.36),
    0 8px 22px -18px rgba(63, 103, 81, 0.2);
}

.motion-card-game,
.motion-card-playful {
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-primary-container) 20%, transparent),
      color-mix(in srgb, var(--color-tertiary-container) 18%, transparent)
    ),
    color-mix(in srgb, var(--color-surface-container-lowest) 84%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary-container) 48%, transparent);
  box-shadow:
    0 22px 52px -30px rgba(63, 103, 81, 0.42),
    0 12px 28px -24px rgba(121, 86, 72, 0.32);
}

.motion-panel {
  border-radius: 1.5rem;
}

.motion-list {
  transform-style: preserve-3d;
}

.motion-presence-block {
  will-change: transform, opacity;
}
```

- [ ] **Step 3: Run formatting**

Run: `npx prettier --write src/index.css`

Expected: `src/index.css` is formatted.

- [ ] **Step 4: Build CSS through Vite**

Run: `npm run build`

Expected: PASS. No CSS processing error appears.

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat: add motion surface css utilities"
```

## Task 7: Create A Shared Catalog Item Card

**Files:**
- Create: `src/components/CatalogItemCard.tsx`
- Create: `src/__tests__/catalogItemCard.test.tsx`
- Modify: `src/components/MotionSurface.tsx` if the prior task revealed missing props

- [ ] **Step 1: Write the failing card test**

Create `src/__tests__/catalogItemCard.test.tsx` with this content:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import CatalogItemCard from '../components/CatalogItemCard';
import type { AppItem } from '../types/app';

const item: AppItem = {
  id: 'tool-1',
  type: 'tool',
  title: '计算器',
  titleEn: 'Calculator',
  description: '快速计算',
  descriptionEn: 'Quick calculations',
  category: '日常实用',
  categoryEn: 'Daily Utility',
  tags: ['math'],
  icon: '🧮',
  iconBg: 'bg-primary-container',
  route: '/tools/calculator',
};

const t = (zh: string, en: string) => `${zh}|${en}`;

describe('CatalogItemCard', () => {
  it('renders item content, action, and favorite state', () => {
    const onAction = vi.fn();
    const onFavorite = vi.fn();

    render(
      <MemoryRouter>
        <CatalogItemCard
          item={item}
          variant="tool"
          actionLabel="打开工具"
          isFavorite={false}
          onAction={onAction}
          onFavorite={onFavorite}
          t={t}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('article').className).toContain('motion-card-tool');
    expect(screen.getByText('计算器|Calculator')).toBeTruthy();
    expect(screen.getByText('快速计算|Quick calculations')).toBeTruthy();
    expect(screen.getByRole('button', { name: '打开工具' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '收藏|Add favorite' })).toBeTruthy();
  });

  it('renders a link action when a destination is provided', () => {
    render(
      <MemoryRouter>
        <CatalogItemCard
          item={item}
          variant="feature"
          actionLabel="立即使用"
          to="/tools/calculator"
          isFavorite
          onFavorite={vi.fn()}
          t={t}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '立即使用' }).getAttribute('href')).toBe(
      '/tools/calculator',
    );
    expect(screen.getByRole('button', { name: '取消收藏|Remove favorite' })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the failing card test**

Run: `npm run test -- src/__tests__/catalogItemCard.test.tsx`

Expected: FAIL because `CatalogItemCard` does not exist.

- [ ] **Step 3: Create the shared card component**

Create `src/components/CatalogItemCard.tsx` with this content:

```tsx
import { ArrowRight, Heart, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AppItem } from '../types/app';
import { MotionButton, MotionCard } from './MotionSurface';

type CatalogVariant = 'tool' | 'game' | 'feature' | 'compact';

type CatalogItemCardProps = {
  item: AppItem;
  variant: CatalogVariant;
  actionLabel: string;
  isFavorite: boolean;
  onFavorite: (id: string) => void;
  onAction?: () => void;
  to?: string;
  t: (zh: string, en: string) => string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getTone(variant: CatalogVariant) {
  if (variant === 'game') return 'game' as const;
  if (variant === 'feature') return 'playful' as const;
  return 'tool' as const;
}

export default function CatalogItemCard({
  item,
  variant,
  actionLabel,
  isFavorite,
  onFavorite,
  onAction,
  to,
  t,
}: CatalogItemCardProps) {
  const showImage = Boolean(item.image) && variant !== 'compact';
  const actionContent = (
    <>
      {variant === 'game' ? <Play className="h-4 w-4" /> : null}
      <span>{actionLabel}</span>
      {variant !== 'game' ? <ArrowRight className="h-4 w-4" /> : null}
    </>
  );

  return (
    <MotionCard
      tone={getTone(variant)}
      className={cx(
        'group flex h-full min-h-[260px] flex-col gap-4 p-5',
        variant === 'compact' && 'min-h-[150px]',
        variant === 'feature' && 'p-6',
      )}
      role="article"
    >
      <button
        type="button"
        onClick={() => onFavorite(item.id)}
        className={cx(
          'absolute right-4 top-4 z-[2] inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors',
          isFavorite
            ? 'bg-red-50 text-red-500 dark:bg-red-900/20'
            : 'bg-white/70 text-secondary hover:bg-red-50 hover:text-red-500 dark:bg-surface-container/70',
        )}
        aria-label={isFavorite ? t('取消收藏', 'Remove favorite') : t('收藏', 'Add favorite')}
      >
        <Heart className={cx('h-5 w-5', isFavorite && 'fill-current')} />
      </button>

      {showImage ? (
        <div className="relative h-44 overflow-hidden rounded-2xl bg-surface-container-low">
          <img
            src={item.image}
            alt={t(item.title, item.titleEn)}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-transparent" />
        </div>
      ) : (
        <div
          className={cx(
            'flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-4xl shadow-inner transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3',
            item.iconBg || 'bg-surface-container',
          )}
          aria-hidden="true"
        >
          {item.icon}
        </div>
      )}

      <div className="min-w-0 pr-10">
        <h3 className="font-nunito text-xl font-extrabold text-on-surface transition-colors group-hover:text-primary">
          {t(item.title, item.titleEn)}
        </h3>
        <span className="mt-2 inline-flex rounded-full bg-primary-container/35 px-3 py-1 text-xs font-bold text-on-primary-container">
          {t(item.category, item.categoryEn)}
        </span>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-secondary">
        {t(item.description, item.descriptionEn)}
      </p>

      <div className="mt-auto flex items-center justify-end">
        {to ? (
          <Link
            to={to}
            className="motion-button motion-button-primary px-5 text-sm"
            aria-label={actionLabel}
          >
            {actionContent}
          </Link>
        ) : (
          <MotionButton
            type="button"
            tone="primary"
            magnetic
            onClick={onAction}
            className="px-5 text-sm"
          >
            {actionContent}
          </MotionButton>
        )}
      </div>
    </MotionCard>
  );
}
```

- [ ] **Step 4: Run the card tests**

Run: `npm run test -- src/__tests__/catalogItemCard.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/CatalogItemCard.tsx src/__tests__/catalogItemCard.test.tsx
git commit -m "feat: add shared catalog item card"
```

## Task 8: Apply Shared Motion To Navigation

**Files:**
- Modify: `src/components/Navigation.tsx`
- Test: `e2e/app.spec.ts`

- [ ] **Step 1: Change the motion surface import**

Replace:

```ts
import { MagneticButton } from './MotionSurface';
```

with:

```ts
import { MotionButton, MotionPanel } from './MotionSurface';
```

- [ ] **Step 2: Add shared classes after `isActive`**

Add this code after the `isActive` function:

```ts
  const iconButtonClass =
    'bg-white/55 text-primary hover:bg-primary-container/35 dark:bg-white/10 dark:hover:bg-white/15';
  const navPanelClass =
    'surface-glass border-white/50 dark:border-white/10';
```

- [ ] **Step 3: Convert header icon controls to `MotionButton`**

For the mobile menu, theme toggle, search, favorites, and login buttons, use this shape:

```tsx
<MotionButton
  type="button"
  tone="icon"
  onClick={cycleTheme}
  className={iconButtonClass}
  aria-label={t('切换主题', 'Toggle theme')}
  title={
    mode === 'light'
      ? t('浅色主题', 'Light theme')
      : mode === 'dark'
        ? t('深色主题', 'Dark theme')
        : t('跟随系统', 'System theme')
  }
>
  {mode === 'system' ? (
    <Monitor className="h-5 w-5" />
  ) : resolved === 'dark' ? (
    <Moon className="h-5 w-5" />
  ) : (
    <Sun className="h-5 w-5" />
  )}
</MotionButton>
```

Use the same `MotionButton` pattern for the other icon controls, preserving their current `onClick`, `aria-label`, `aria-expanded`, and `aria-controls` props.

- [ ] **Step 4: Convert the toast container to `MotionPanel`**

Replace the toast wrapper's inner `<div role="status">` with:

```tsx
<MotionPanel
  role="status"
  aria-live="polite"
  className="surface-glass flex items-center gap-3 rounded-full px-6 py-3 font-sans text-sm font-medium text-on-surface"
>
  <Search className="w-4 h-4 text-primary" />
  {toastMessage}
</MotionPanel>
```

- [ ] **Step 5: Convert the mobile menu panel class**

In the mobile menu `<motion.div>` that starts at `top-[72px]`, change its `className` to:

```tsx
className={`fixed top-[72px] left-0 right-0 z-40 border-b shadow-[0_8px_30px_rgba(0,0,0,0.1)] md:hidden ${navPanelClass}`}
```

- [ ] **Step 6: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Run the navigation E2E checks**

Run: `npm run test:e2e -- e2e/app.spec.ts --grep "首页正常加载|搜索关键词|切换暗色主题"`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/Navigation.tsx
git commit -m "feat: apply motion system to navigation"
```

## Task 9: Apply Shared Cards To The Homepage

**Files:**
- Modify: `src/pages/Home.tsx`
- Test: `e2e/app.spec.ts`

- [ ] **Step 1: Update imports**

Remove `TiltGlareCard` from the `MotionSurface` import and add `CatalogItemCard`:

```ts
import CatalogItemCard from '../components/CatalogItemCard';
import { MagneticButton } from '../components/MotionSurface';
```

- [ ] **Step 2: Remove the local `FeaturedCard` component**

Delete the entire `FeaturedCard` function from `src/pages/Home.tsx`.

- [ ] **Step 3: Replace featured tool cards**

Replace the `featuredTools.map` block with:

```tsx
{featuredTools.map((tool) => (
  <CatalogItemCard
    key={tool.id}
    item={tool}
    variant="feature"
    actionLabel={t('打开工具', 'Open Tool')}
    to={tool.route}
    isFavorite={favoriteIds.includes(tool.id)}
    onFavorite={toggle}
    t={t}
  />
))}
```

- [ ] **Step 4: Replace featured game cards**

Replace the `featuredGames.map` block with:

```tsx
{featuredGames.map((game) => (
  <CatalogItemCard
    key={game.id}
    item={game}
    variant="game"
    actionLabel={t('开始游戏', 'Play')}
    to={game.route}
    isFavorite={favoriteIds.includes(game.id)}
    onFavorite={toggle}
    t={t}
  />
))}
```

- [ ] **Step 5: Replace all-tools preview cards**

Replace the `homeToolPreview.map` block with:

```tsx
{homeToolPreview.map((tool) => (
  <CatalogItemCard
    key={tool.id}
    item={tool}
    variant="tool"
    actionLabel={t('立即使用', 'Use now')}
    to={tool.route}
    isFavorite={favoriteIds.includes(tool.id)}
    onFavorite={toggle}
    t={t}
  />
))}
```

- [ ] **Step 6: Replace all-games preview cards**

Replace the `games.slice(0, 9).map` block with:

```tsx
{games.slice(0, 9).map((game) => (
  <CatalogItemCard
    key={game.id}
    item={game}
    variant="game"
    actionLabel={t('开始游戏', 'Play')}
    to={game.route}
    isFavorite={favoriteIds.includes(game.id)}
    onFavorite={toggle}
    t={t}
  />
))}
```

- [ ] **Step 7: Run homepage checks**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run test:e2e -- e2e/app.spec.ts --grep "首页正常加载"`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: apply shared catalog cards to home"
```

## Task 10: Apply Shared Cards To Tools Catalog

**Files:**
- Modify: `src/pages/Tools.tsx`
- Test: `e2e/app.spec.ts`

- [ ] **Step 1: Update imports**

Add `CatalogItemCard` and `MotionList`:

```ts
import CatalogItemCard from '../components/CatalogItemCard';
import { MotionList } from '../components/MotionSurface';
```

Keep `MagneticButton` if it is still used in detail or controls. Remove `TiltGlareCard` when no references remain.

- [ ] **Step 2: Replace the catalog grid wrapper**

Change the grid wrapper from `<motion.div ... variants={gridContainerVariants}>` to:

```tsx
<MotionList
  key={`grid-${activeCategory}-${query}-${sortMode}`}
  className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8 mb-20"
>
```

Change the matching closing tag from `</motion.div>` to `</MotionList>`.

- [ ] **Step 3: Replace tool cards**

Replace the `filteredTools.map((tool) => (` block with:

```tsx
filteredTools.map((tool) => (
  <CatalogItemCard
    key={tool.id}
    item={tool}
    variant="tool"
    actionLabel={t('打开工具', 'Open Tool')}
    isFavorite={favoriteIds.includes(tool.id)}
    onFavorite={toggle}
    onAction={() => handleOpen(tool.id)}
    t={t}
  />
))
```

- [ ] **Step 4: Update empty state surface**

Replace the empty state class with:

```tsx
className="surface-raised col-span-full flex flex-col items-center justify-center rounded-3xl py-20 text-secondary"
```

- [ ] **Step 5: Remove unused imports**

Remove imports that become unused:

```ts
springBouncy,
gridCardVariants,
TiltGlareCard,
Play,
Heart,
```

Keep imports that are still referenced.

- [ ] **Step 6: Run tools catalog checks**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run test:e2e -- e2e/app.spec.ts --grep "工具列表进入计算器|收藏工具|刷新后收藏仍存在"`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Tools.tsx
git commit -m "feat: apply shared cards to tools catalog"
```

## Task 11: Apply Shared Cards To Games Catalog

**Files:**
- Modify: `src/pages/Games.tsx`
- Test: `e2e/app.spec.ts`

- [ ] **Step 1: Update imports**

Add:

```ts
import CatalogItemCard from '../components/CatalogItemCard';
import { MotionList } from '../components/MotionSurface';
```

Remove `TiltGlareCard` when no references remain.

- [ ] **Step 2: Replace the catalog grid wrapper**

Change the grid wrapper from `<motion.div ... variants={gridContainerVariants}>` to:

```tsx
<MotionList
  key={`grid-${activeCategory}-${query}-${sortMode}`}
  className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 w-full mb-16"
>
```

Change the matching closing tag from `</motion.div>` to `</MotionList>`.

- [ ] **Step 3: Replace game cards**

Replace the `filteredGames.map((game) => (` block with:

```tsx
filteredGames.map((game) => (
  <CatalogItemCard
    key={game.id}
    item={game}
    variant="game"
    actionLabel={t('开始游戏', 'Play')}
    isFavorite={favoriteIds.includes(game.id)}
    onFavorite={toggle}
    onAction={() => handlePlay(game.id)}
    t={t}
  />
))
```

- [ ] **Step 4: Update empty state surface**

Replace the empty state class with:

```tsx
className="surface-playful col-span-full flex flex-col items-center justify-center rounded-3xl py-20 text-secondary"
```

- [ ] **Step 5: Remove unused imports**

Remove imports that become unused:

```ts
springBouncy,
gridCardVariants,
TiltGlareCard,
Play,
Heart,
```

Keep imports that are still referenced.

- [ ] **Step 6: Run games catalog checks**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run test:e2e -- e2e/app.spec.ts --grep "游戏列表进入 2048|收藏游戏"`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Games.tsx
git commit -m "feat: apply shared cards to games catalog"
```

## Task 12: Apply Surfaces To Detail Shells

**Files:**
- Modify: `src/pages/Tools.tsx`
- Modify: `src/pages/Games.tsx`

- [ ] **Step 1: Update tool detail shells**

In the active tool detail branch, replace repeated panel classes:

```tsx
className="mb-6 rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5"
```

with:

```tsx
className="surface-raised mb-6 rounded-3xl p-5"
```

Also replace the method, use-case, FAQ, and related-tool panel classes with:

```tsx
className="surface-raised rounded-3xl p-5"
```

- [ ] **Step 2: Update game detail shells**

In the active game detail branch, replace the header, info, FAQ, and related-game panel classes with:

```tsx
className="surface-playful rounded-3xl p-5"
```

For compact instruction cards inside the three-column grid, use:

```tsx
className="surface-raised rounded-3xl p-5"
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 4: Run detail page E2E checks**

Run: `npm run test:e2e -- e2e/app.spec.ts --grep "工具列表进入计算器|游戏列表进入 2048"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Tools.tsx src/pages/Games.tsx
git commit -m "feat: align detail shells with surface system"
```

## Task 13: Align Loading And Skeleton States

**Files:**
- Modify: `src/components/GameToolLoading.tsx`
- Modify: `src/components/SkeletonCard.tsx`

- [ ] **Step 1: Update `GameToolLoading` shell**

Replace the root `motion.div` class with:

```tsx
className="flex-grow flex items-center justify-center min-h-[50vh] px-4"
```

Wrap the inner content with:

```tsx
<div className="surface-glass flex flex-col items-center gap-5 rounded-3xl px-8 py-7">
```

Keep the existing particle, orbit, logo, progress, and label content inside that wrapper.

- [ ] **Step 2: Update tool skeleton card class**

In `SkeletonCard.tsx`, replace:

```tsx
className="glass-card rounded-3xl p-8 flex flex-col items-center gap-6 animate-fade-in"
```

with:

```tsx
className="surface-raised rounded-3xl p-8 flex flex-col items-center gap-6 animate-fade-in"
```

- [ ] **Step 3: Update game skeleton card class**

In `SkeletonCard.tsx`, replace:

```tsx
className="bg-white dark:bg-surface-container-high rounded-xl p-6 shadow-[0_8px_30px_rgba(217,239,224,0.4)] dark:shadow-none flex flex-col gap-4 animate-fade-in"
```

with:

```tsx
className="surface-playful rounded-3xl p-6 flex flex-col gap-4 animate-fade-in"
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/GameToolLoading.tsx src/components/SkeletonCard.tsx
git commit -m "feat: align loading states with motion surfaces"
```

## Task 14: Add E2E Motion And Layout Guardrails

**Files:**
- Modify: `e2e/app.spec.ts`

- [ ] **Step 1: Add hover stability test**

Append this test inside `test.describe('Spring Nest App', () => { ... })`:

```ts
test('catalog card hover does not shift layout', async ({ page }) => {
  await page.goto('/tools');
  const firstCard = page.locator('main article').first();
  await expect(firstCard).toBeVisible();
  const before = await firstCard.boundingBox();
  await firstCard.hover();
  await page.waitForTimeout(250);
  const after = await firstCard.boundingBox();

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs((before?.width ?? 0) - (after?.width ?? 0))).toBeLessThan(1);
  expect(Math.abs((before?.height ?? 0) - (after?.height ?? 0))).toBeLessThan(1);
});
```

- [ ] **Step 2: Add mobile navigation visual guardrail**

Append this test:

```ts
test('mobile menu remains readable and tappable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: '菜单' }).click();
  const mobileNav = page.getByRole('navigation', { name: '移动端导航' });
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole('link', { name: '游戏天堂' })).toBeVisible();
  await expect(mobileNav.getByRole('link', { name: '实用小筑' })).toBeVisible();
});
```

- [ ] **Step 3: Add reduced-motion smoke test**

Append this test:

```ts
test('reduced motion keeps primary content visible', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto('/games');
  await expect(page.getByRole('heading', { name: /游戏天堂|Game Paradise/ })).toBeVisible();
  await expect(page.locator('main article').first()).toBeVisible();
  await context.close();
});
```

- [ ] **Step 4: Run targeted E2E checks**

Run: `npm run test:e2e -- e2e/app.spec.ts --grep "catalog card hover|mobile menu|reduced motion"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add e2e/app.spec.ts
git commit -m "test: add motion layout guardrails"
```

## Task 15: Full Verification And Polish Pass

**Files:**
- Modify only files already touched by previous tasks when verification reveals a concrete issue.

- [ ] **Step 1: Run formatting check**

Run: `npm run format:check`

Expected: PASS.

If it fails due to touched files, run:

```bash
npx prettier --write src/lib/animations.ts src/components/MotionSurface.tsx src/components/CatalogItemCard.tsx src/components/Navigation.tsx src/pages/Home.tsx src/pages/Tools.tsx src/pages/Games.tsx src/components/GameToolLoading.tsx src/components/SkeletonCard.tsx e2e/app.spec.ts src/__tests__/animations.test.ts src/__tests__/motionSurface.test.tsx src/__tests__/catalogItemCard.test.tsx
```

Then run `npm run format:check` again.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Run unit tests**

Run: `npm run test`

Expected: PASS.

- [ ] **Step 4: Run E2E tests**

Run: `npm run test:e2e`

Expected: PASS.

- [ ] **Step 5: Start the dev server for browser review**

Run:

```bash
npm run dev
```

Expected: Vite reports a local URL on port 3000 or another available port.

- [ ] **Step 6: Manual browser review**

Open the dev server URL and check:

- `/` desktop: hero, search, featured cards, and category links are readable and lively.
- `/tools` desktop: search, filter pills, sort select, card hover, and empty state work.
- `/games` desktop: game cards feel more playful than tool cards.
- `/tools/calculator` desktop: detail shell is calm and usable.
- `/games/2048` desktop: detail shell does not fight the game area.
- `/` mobile width around 390px: menu, search overlay, cards, and buttons fit.
- `/tools` mobile width around 390px: filter pills scroll and card text does not overflow.
- Dark theme: surfaces remain readable and not gray-black.
- Reduced motion: content appears without continuous movement.

- [ ] **Step 7: Commit final verification fixes**

If Step 1 through Step 6 required code changes, commit them:

```bash
git add src e2e .gitignore
git commit -m "fix: polish motion system verification issues"
```

If no changes were needed after Task 14, skip this commit.

## Self-Review Checklist

- Spec coverage: motion tokens, motion primitives, surfaces, navigation, home, tools/games catalogs, detail shells, loading states, accessibility, performance, and verification are covered.
- The plan preserves existing routes, data structures, tool/game internals, and the `motion` library choice.
- The plan avoids broad rewrites and makes one shared catalog card instead of duplicating card animation logic.
- Each task has an isolated test or verification command.
- The plan includes frequent commits after self-contained units.
