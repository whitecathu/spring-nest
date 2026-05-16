# Spring Nest Motion And Visual System Design

Date: 2026-05-16
Status: Approved for implementation planning

## Context

Spring Nest is a React 19, Vite 6, Tailwind CSS 4 PWA that combines practical tools and casual games. The project already uses `motion`, has shared animation utilities, route transitions, dynamic backgrounds, `MotionSurface`, loading states, and page-level motion. The current issue is not a lack of animation, but that the visual language and motion behavior need a more unified, higher-quality system.

The selected direction is **spring playground energy**: lively, memorable, and playful, while still mature enough for a utility site. Animation should be **visible but not distracting**. The upgrade should include both motion and visual foundations.

## Goals

- Create a unified motion and surface system for the full site.
- Make the first impression feel more polished, alive, and memorable.
- Keep utility workflows calm, readable, and fast.
- Let games feel more playful than tools without splitting the brand.
- Improve cards, buttons, panels, navigation, loading states, empty states, and page transitions through shared patterns.
- Preserve performance, accessibility, routing, data structures, and existing tool/game logic.

## Non-Goals

- Do not rewrite every individual tool or game interface.
- Do not change core features, routes, registries, or data models.
- Do not introduce a new animation library.
- Do not redesign the logo from scratch.
- Do not perform a broad SEO or copywriting rewrite.
- Do not add backend services or external visual asset dependencies.

## Experience Principles

The site should feel like a playful spring workspace, not a decorative landing page. Motion should reward interaction, clarify state changes, and make browsing more enjoyable. It should not slow down text entry, conversion flows, game controls, or search.

The default motion personality is:

- Soft lift on page and section entrance.
- Light elasticity on buttons and cards.
- Clear but short feedback for favorites, toggles, search, toast, modal, and theme changes.
- Ambient background motion that supports the page mood without becoming the main content.
- Strong reduced-motion support for users and devices that need calm rendering.

## Motion Architecture

### Motion Tokens

`src/lib/animations.ts` should become the primary source for shared motion constants. Existing presets can be retained, but usage should move toward semantic names.

Required token groups:

- Springs: playful, soft, utility, snappy, magnetic.
- Easing: one Spring Nest ease-out curve for entrances and one tighter curve for exits.
- Durations: fast, normal, slow, ambient.
- Stagger values: tight for lists, relaxed for hero and large sections.
- Reduced-motion helpers: a single reliable hook and safe fallback presets.

### Motion Components

`src/components/MotionSurface.tsx` should become the shared interaction layer instead of a place for isolated effects.

Planned shared primitives:

- `MotionCard`: card entrance, hover lift, active press, optional glare/tilt intensity.
- `MotionButton`: shared button press, hover, magnetic strength, and reduced-motion behavior.
- `MotionPanel`: modal, menu, search layer, and detail shell entrance.
- `MotionList`: staggered list/grid entrance and filtered result transitions.
- `AnimatedPresenceBlock`: small state transitions for empty/loading/error/content swaps.

Existing `TiltGlareCard` and `MagneticButton` can remain, but they should receive strength tiers so high-energy effects are used intentionally.

### Route And Section Motion

Route transitions should use light spatial entrance: opacity, y, scale, and optional slight perspective. Games can use a more playful spring; tools should use a calmer utility spring.

Section entrances should be staggered enough to feel alive, but short enough that a user who scrolls quickly never waits for content. Filter and search result changes should animate list updates with transform and opacity, not layout-heavy properties.

### Feedback Motion

Feedback should be consistent:

- Favorite: quick pop and color confirmation.
- Theme switch: icon swap with small rotate/fade.
- Search: overlay/panel entrance with focused scale and opacity.
- Toast: short spring entrance and clean exit.
- Loading: calm looping progress, no aggressive spinner overload.
- Empty state: small ambient symbol or particle layer, static fallback for reduced motion.
- Error attention: restrained shake only when action is required.

## Visual System

The visual system should mature the current spring palette without flattening it into one green/beige theme.

### Surfaces

Define reusable surface classes or component variants:

- `surface-flat`: quiet page and list backgrounds.
- `surface-raised`: cards and repeated items.
- `surface-playful`: highlighted tools/games and featured cards.
- `surface-glass`: navigation, search overlay, mobile menu, modal, and floating panels.

Surfaces should share border, shadow, background opacity, dark-mode behavior, and hover behavior. Shadows should be light and environmental, with subtle color where appropriate.

### Cards

Tool and game cards should share one base pattern:

- Stable dimensions and no hover-induced layout shift.
- Icon or emoji area with a clear visual container.
- Category pill with restrained color.
- CTA affordance that reacts on hover.
- Favorite control that is visually separate from the main link target.

Game cards may use slightly more color, bounce, and playful icon motion. Tool cards should feel calmer and more task-focused.

### Buttons And Controls

Buttons should be unified by intent:

- Primary: strong fill, spring press, clear hover elevation.
- Secondary: softer surface, subtle border and hover tint.
- Icon buttons: consistent square or circle size, tooltip/title where useful, clear focus ring.
- Pills: category and filter controls with active indicator motion.

Small controls should use 10-12px radius, cards 16-20px, and large panels about 24px. Avoid making every element extremely rounded.

### Typography And Layout

Homepage and catalog pages should have clearer hierarchy:

- Hero title remains prominent but not oversized inside tool surfaces.
- Section headings should be scannable.
- Card text should be compact and consistent.
- Utility-heavy pages should avoid marketing-like spacing once the user is browsing tools.

## Background System

The current dynamic background should become a mood layer with strength rules:

- Home: balanced spring ambience with leaves, particles, and soft halos.
- Tools list: quieter focus flow with fewer particles and cleaner lines.
- Games list: livelier particles and playful symbols.
- Detail pages: calmer background so the active tool or game remains primary.
- Search and empty states: distinct but restrained intent profiles.

Background behavior must degrade on mobile, coarse pointers, low-core devices, and `prefers-reduced-motion`.

## Application Scope

Priority order:

1. Navigation: desktop nav, mobile menu, search overlay, theme control, account menu, toast.
2. Home: hero, search bar, featured cards, recent items, new items, category links.
3. Tools and Games catalog pages: filters, sort controls, search field, result grids, cards, empty states.
4. Detail shells: shared outer layout, back action, header, metadata, FAQ/info panels.
5. Shared loading, skeleton, modal, and error states.

Individual tool and game internals should only be changed when they consume shared controls or are visually broken by the new shell.

## Accessibility And Performance

Requirements:

- Honor `prefers-reduced-motion` globally.
- Keep animation mostly to `transform` and `opacity`.
- Avoid animating `width`, `height`, `top`, `left`, or heavy `filter` in repeated elements.
- Keep focus states visible and consistent.
- Preserve minimum touch targets.
- Ensure text does not overlap, clip, or overflow on mobile and desktop.
- Ensure cards do not resize due to hover, loading, favorite state, or translated text.
- Reduce particle count and parallax on mobile and lower-powered devices.

## Verification Plan

Run:

- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`

Manual browser checks:

- Home on desktop and mobile.
- Tools catalog on desktop and mobile.
- Games catalog on desktop and mobile.
- One tool detail page.
- One game detail page.
- Search overlay and search results.
- Mobile navigation menu.
- Theme switching.
- Reduced-motion behavior if practical.

Visual checks:

- No incoherent overlaps.
- No button text overflow.
- No layout jump on hover.
- Background remains behind content.
- Cards remain readable in light and dark modes.
- Motion feels lively but does not delay task completion.

## Implementation Notes

The implementation should start by consolidating tokens and shared components before page-by-page application. This keeps the work controlled and prevents another round of scattered one-off animations.

The existing dirty worktree includes animation and background-related files. Implementation should work with those files carefully and avoid reverting unrelated user changes.
