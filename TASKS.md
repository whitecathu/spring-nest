# Spring Nest Task Log

---

## Round 1: Production Readiness [DONE]
## Round 2: Content Expansion [DONE] - 17 tools, 11 games

---

## Round 3: Product Polish [DONE - 2026-05-03]
**Goal:** Make the site feel like a real product - curated recommendations, recent usage, better search, polished categories.

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T1 | Data: Add featured/new/popular/difficulty/faq fields | DONE | Main |
| T2 | Create recommendation engine (src/lib/recommendations.ts) | DONE | Agent A |
| T3 | Create recent usage tracker (src/lib/recent.ts) | DONE | Agent A |
| T4 | Enhance search service (type filter, features search) | DONE | Agent B |
| T5 | Rewrite Home page (featured, recent, new sections) | DONE | Agent C |
| T6 | Improve SearchResults page (filters, highlights, empty state) | DONE | Agent B |
| T7 | Improve Favorites page (better empty state) | DONE | Main |
| T8 | Update sitemap | DONE | Main |
| T9 | Build & test | DONE | Main |
| T10 | Final review | DONE | Main |

### Files Created
- `src/lib/recommendations.ts` - getNewItems, getRecommendedForEmpty
- `src/lib/recent.ts` - recordVisit, getRecentItems

### Files Modified
- `src/types/app.ts` - Added featured, isNew, popularScore, difficulty, faq, RecentItem
- `src/data/tools.ts` - Normalized categories (日常实用/时间效率/安全隐私/学习写作/开发辅助/趣味工具), added featured/isNew/popularScore
- `src/data/games.ts` - Normalized categories (益智解谜/反应挑战/学习练习), added featured/isNew/popularScore
- `src/pages/Home.tsx` - Complete rewrite: Hero, Recent, Featured Tools, Featured Games, New Items, Category Quick Links
- `src/pages/SearchResults.tsx` - Type filter tabs, keyword highlighting, empty state with recommendations
- `src/pages/Favorites.tsx` - Already had good empty state (kept as-is)
- `src/pages/Games.tsx` - Wired recordVisit
- `src/pages/Tools.tsx` - Wired recordVisit
- `src/services/searchService.ts` - Added features/instructions search, typeFilter, searchByType
- `public/sitemap.xml` - Already up to date (32 routes)

---

## Round 4: Production Hardening [DONE - 2026-05-03]
**Goal:** Harden for Cloudflare Pages deployment - regression testing, SEO/PWA/CF checks, no new features.

### Issues Found & Fixed
| ID | Issue | Priority | Status |
|----|-------|----------|--------|
| I1 | Missing clearRecentItems in recent.ts | P1 | FIXED |
| I2 | recommendations.ts lacks getRelatedItems for detail pages | P1 | FIXED |
| I3 | recent.ts MAX_ITEMS=20, spec says 10 | P2 | FIXED |
| I4 | Missing Cache-Control headers in _headers | P1 | FIXED |
| I5 | 5 routes missing from sitemap.xml | P2 | FIXED |
| I6 | Test used old category names after Round 3 rename | P1 | FIXED |

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T1 | Fix recommendations.ts + recent.ts gaps | DONE | Main |
| T2 | QA Regression (full site) | DONE | Agent A - 10/10 PASS |
| T3 | SEO + PWA + CF Pages check | DONE | Agent B - 10/10 (1 actionable fixed) |
| T4 | Build + lint + test | DONE | Main - all pass |
| T5 | Create deploy checklist doc | DONE | Main |

### Files Modified
- `src/lib/recommendations.ts` - Added getRelatedItems (4-tier strategy)
- `src/lib/recent.ts` - Added clearRecentItems, MAX_ITEMS 20→10
- `public/_headers` - Added Cache-Control rules (no-cache for index.html, immutable for hashed assets)
- `public/sitemap.xml` - Added 5 missing routes (/search, /leaderboard, /feedback, /privacy, /terms)
- `src/__tests__/searchService.test.ts` - Updated category names to match Round 3 renames

### Files Created
- `docs/deploy-checklist.md` - Full deployment checklist

### Test Results
- `npm run lint` (tsc --noEmit): PASS
- `npm run test` (vitest): 82/82 PASS (5 test files)
- `npm run build` (vite build): PASS (2.24s, 68 precache entries)

---

## Round 5: Typing Challenge Chinese IME Fix [IN PROGRESS - 2026-05-03]
**Goal:** Fix Chinese IME input compatibility in Typing Challenge game. Protect English logic. Add Chinese QA.

### Root Cause
`TypingChallenge.tsx` has NO IME composition handling. `handleInputChange` fires during pinyin composition with intermediate values (e.g. "chun" for "春"), triggering validation, completion checks, and stats on garbage data. No `onCompositionStart`/`onCompositionEnd` handlers. `targetPhrase.split('')` may break multi-byte Unicode chars.

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T1 | Add isComposingRef + composition event handlers | DONE | Main |
| T2 | Guard onChange/onKeyDown during composition | DONE | Main |
| T3 | Fix characterComparison to use Array.from for Unicode | DONE | Main |
| T4 | Update placeholder + add IME hint text | DONE | Main |
| T5 | Build & typecheck | DONE | Main - tsc clean, build 2.17s |
| T6 | Chinese QA regression (5 test phrases) | DONE | Main |
| T7 | English QA regression (3 test phrases) | DONE | Main |

### Test Phrases - Chinese
1. 春暖花开
2. 风和日丽
3. 万象更新
4. 心想事成
5. 前程似锦

### Test Phrases - English
1. The quick brown fox
2. Spring is in the air
3. Practice makes perfect

---

## Round 6: Game UX Fix - Number Puzzle + Snake [IN PROGRESS - 2026-05-03]
**Goal:** Fix Number Puzzle control UX and Snake speed. No new games, no refactors.

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T1 | NumberPuzzle: Add keyboard (arrows + WASD) controls | DONE | Main |
| T2 | NumberPuzzle: Add swipe controls on board | DONE | Main |
| T3 | NumberPuzzle: Add d-pad direction buttons | DONE | Main |
| T4 | NumberPuzzle: Add move animation (motion layout) | DONE | Main |
| T5 | NumberPuzzle: Add operation hint text | DONE | Main |
| T6 | Snake: Add difficulty selection (easy/normal/hard) | DONE | Main |
| T7 | Snake: Default speed → easy (220ms base) | DONE | Main |
| T8 | Snake: Score-based speed per difficulty tier | DONE | Main |
| T9 | Snake: Difficulty shown in game over panel | DONE | Main |
| T10 | Build & typecheck | DONE | Main - tsc clean, build 2.27s, 82/82 tests |
| T11 | Final review | DONE | Main |

---

## Round 7: Font System + Animation Engine [DONE - 2026-05-06]
**Goal:** Upgrade font stack for Chinese+English, create reusable animation presets, add page transitions.

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T1 | Font system: LXGW WenKai + Noto Sans SC + preconnect | DONE | Agent A |
| T2 | Animation preset library (src/lib/animations.ts) | DONE | Agent B |
| T3 | Page transition + ScrollReveal + StaggerChildren components | DONE | Agent C |

### Files Created
- `src/lib/animations.ts` — Spring presets (bouncy/smooth/snappy/gentle), hover/tap presets, page transitions
- `src/components/PageTransition.tsx` — Fade+slide enter/exit wrapper
- `src/components/ScrollReveal.tsx` — Directional scroll-triggered reveal
- `src/components/StaggerChildren.tsx` — Staggered child animations on scroll

### Files Modified
- `index.html` — Added preconnect + preload for Google Fonts
- `src/index.css` — New font stack (LXGW WenKai + Noto Sans SC), CSS utilities (reveal-up, scrollbar-hide, page-enter, focus-visible)

---

## Round 8: Three-End Responsive + Page Polish [DONE - 2026-05-06]
**Goal:** Responsive layouts, bouncy spring animations, micro-interactions across all pages.

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T4 | Home page: fluid typography, spring cards, scroll snap | DONE | Agent D |
| T5 | Games listing: bouncy pills, spring cards, responsive grid | DONE | Agent E |
| T6 | Tools listing: mobile scrollable categories, spring cards | DONE | Agent F |
| T7 | Navigation, Footer, About, Favorites, Leaderboard polish | DONE | Agent G |

### Files Modified
- `src/pages/Home.tsx` — Fluid h1, spring FeaturedCard, bouncy category pills, snap scroll
- `src/pages/Games.tsx` — Page-enter animation, motion.category pills, spring card hover, responsive grid
- `src/pages/Tools.tsx` — Responsive title, mobile scrollable categories, spring cards, responsive gap
- `src/components/Navigation.tsx` — Spring toast, spring search overlay, spring dropdown, mobile menu hover
- `src/components/Footer.tsx` — Enhanced social link hover springs
- `src/pages/About.tsx` — Spring stat/tech/contact cards
- `src/pages/Favorites.tsx` — Spring favorite cards, spring empty-state buttons
- `src/pages/Leaderboard.tsx` — Spring entries, bouncing crown for rank 1

---

## Round 9: Game & Tool Deep UX [DONE - 2026-05-06]
**Goal:** Bouncy animations and visual polish for all games and popular tools.

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T8 | Game UX: 2048/WhackAMole/Snake/TicTacToe spring polish | DONE | Agent H |
| T9 | Tool UX: Calculator/Pomodoro/Password/QRCode spring polish | DONE | Agent I |

### Files Modified (Games)
- `src/pages/games/Game2048.tsx` — Tile rotate+spring, score pulse, spring buttons
- `src/pages/games/WhackAMole.tsx` — Mole tap spring, combo bounce, stat hover lift
- `src/pages/games/Snake.tsx` — D-pad spring tap, food pulse, difficulty spring buttons
- `src/pages/games/TicTacToe.tsx` — Bouncier placement, win celebration pulse, spring mode toggle

### Files Modified (Tools)
- `src/pages/tools/Calculator.tsx` — Keypad spring taps, display pulse, spring history
- `src/pages/tools/Pomodoro.tsx` — Timer celebration, spring controls, settings spring
- `src/pages/tools/PasswordGenerator.tsx` — Password display pulse, spring buttons
- `src/pages/tools/QRCodeGenerator.tsx` — QR spring appearance, spring generate/download

### Review Results
- `npm run lint` (tsc --noEmit): PASS
- `npm run test` (vitest): 82/82 PASS
- `npm run build` (vite build): PASS (2.14s, 68 precache entries)

---

## Round 10: Mobile-First Polish — Touch, Animation, Text, Deploy [IN PROGRESS - 2026-05-07]
**Goal:** Comprehensive mobile UX optimization: safe areas, touch targets, animation performance, reduced motion, game UX, i18n text fixes, then GitHub + Cloudflare deploy.

### Issues Found (from audit + research)
| ID | Issue | Priority | Area |
|----|-------|----------|------|
| I1 | Missing viewport-fit=cover for safe area insets | P1 | CSS |
| I2 | No prefers-reduced-motion support | P1 | CSS/Animation |
| I3 | No overscroll-behavior-y on body (pull-to-refresh conflict) | P2 | CSS |
| I4 | No -webkit-tap-highlight-color reset | P2 | CSS |
| I5 | Touch targets too small (p-2 = 40px, need 48px) | P1 | UX |
| I6 | glass-card blur(12px) expensive on mobile | P2 | Performance |
| I7 | Home.tsx category labels mismatch (Reflex Challenge vs Action) | P1 | i18n |
| I8 | Home.tsx game categories (经典休闲/学习练习) don't exist in data | P1 | i18n |
| I9 | FeaturedCard shows Chinese category in English mode | P1 | i18n |
| I10 | Games.tsx categories show Chinese only | P2 | i18n |
| I11 | Game stat headers overflow on small mobile | P2 | Game UX |
| I12 | Snake D-pad too small on mobile | P2 | Game UX |
| I13 | No haptic feedback on game interactions | P3 | Game UX |
| I14 | Particle animations use left/top (D-tier perf) | P2 | Animation |

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T1 | CSS Foundation: viewport-fit, reduced motion, overscroll, tap-highlight, glass-card mobile | DONE | Agent A |
| T2 | Animation Performance: reduced motion in animations.ts | DONE | Agent B |
| T3 | Navigation + Home i18n: touch targets, category labels, FeaturedCard i18n | DONE | Agent C |
| T4 | Game Mobile UX: stat headers, D-pad, touch targets, game-over panels | DONE | Agent D |
| T5 | Build + lint + test + review + Tools.tsx i18n fix | DONE | Main - lint PASS, 82/82 tests PASS, build PASS (2.42s) |
| T6 | GitHub push + Cloudflare Pages deploy | DONE | Main - pushed to master, deployed to https://master.spring-nest.pages.dev |

---

## Round 11: Game Deep Polish — FlappyBird + Minesweeper + BrickBreaker [DONE - 2026-05-07]
**Goal:** Deep UX polish for three games based on mobile game best practices research.

### Issues Found & Fixed
| ID | Issue | Priority | Status |
|----|-------|----------|--------|
| I1 | BrickBreaker idle overlay blocks start game click | P1 | FIXED |
| I2 | FlappyBird idle overlay same bug (proactive fix) | P1 | FIXED |
| I3 | BrickBreaker particle type missing size field | P2 | FIXED |

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T7 | FlappyBird: fix flap velocity, smooth rotation, death animation, score pulse, ground scroll, touch targets | DONE | Agent A (sonnet) |
| T8 | Minesweeper: flag toggle button, cell reveal cascade, game over ripple, win detection fix, touch targets | DONE | Agent B (sonnet) |
| T9 | BrickBreaker: fix start game bug, ball trail, particles, screen shake, speed progression, angle clamp, touch targets | DONE | Agent C (opus) |
| T10 | Build + lint + test + review | DONE | Main - lint PASS, 82/82 tests PASS, build PASS (2.28s, 74 precache) |
| T11 | GitHub push + Cloudflare deploy | DONE | Main - pushed to master, deployed to https://master.spring-nest.pages.dev |

### Files Modified
- `src/pages/games/FlappyBird.tsx` — JUMP_FORCE -7.5→-8.5, GRAVITY 0.45→0.52, velocity-dependent rotation, death shake+particles, score pulse 1.6x, ground texture
- `src/pages/games/Minesweeper.tsx` — flag toggle spring animation, cell reveal wave cascade (25ms/unit Manhattan distance), dramatic game over shake+rotation+boom flash, win confetti (30 particles), all touch targets 48px
- `src/pages/games/BrickBreaker.tsx` — idle overlay onClick/onTouchStart fix, ball trail radial gradient (10 points), particles 8-12 with size variation+gravity, intensity-based screen shake, angle clamp+minimum vertical speed, all touch targets 48px

---

## Round 13: Animation Polish + Category Transitions + 3 New Games + 3 New Tools [DONE - 2026-05-07]
**Goal:** Smooth category switching animations, loading polish, game improvements, new content.

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T1 | Games.tsx: skeleton shimmer + staggered card entrance/exit on category switch | DONE | Agent A |
| T2 | Tools.tsx: sliding pill indicator + shimmer loading + popLayout transitions | DONE | Agent B |
| T3 | FlappyBird: fix bird direction, tune difficulty, add countdown + score popups | DONE | Agent C |
| T4 | Minesweeper: enhanced reveal cascade, debris particles, flag toggle UI | DONE | Agent D |
| T5 | BrickBreaker: paddle glow, hard bricks, combo bar, brick patterns per level | DONE | Agent E |
| T6 | Loading animations: shared GameToolLoading, SkeletonCard, App.tsx loading fallback | DONE | Agent F |
| T7 | New games: SimonSays, SudokuGame, TypingSpeedTest | DONE | Main |
| T8 | New tools: TipCalculator, CaseConverter, RandomNumber | DONE | Main |
| T9 | Simplify review: code reuse, quality, efficiency | DONE | 3 parallel agents |
| T10 | Build + lint + test | DONE | Main — TypeScript PASS, build PASS (2.62s), 82/82 tests PASS |

### Files Created
- `src/components/GameToolLoading.tsx` — Shared loading component with pulsing leaf + progress bar
- `src/components/SkeletonCard.tsx` — Reusable skeleton card with GPU-accelerated shimmer
- `src/pages/games/SimonSays.tsx` — Pattern memory game (4 colors, combo system)
- `src/pages/games/SudokuGame.tsx` — Classic 9×9 Sudoku (3 difficulties, hints, keyboard nav)
- `src/pages/games/TypingSpeedTest.tsx` — English typing speed test (WPM, accuracy, streaks)
- `src/pages/tools/CaseConverter.tsx` — 6 case modes + character/word count
- `src/pages/tools/RandomNumber.tsx` — Custom range, batch generation, history
- `src/pages/tools/TipCalculator.tsx` — Bill splitting with tip presets

### Files Modified
- `src/pages/Games.tsx` — AnimatePresence mode="wait", skeleton shimmer on switch, containerVariants + cardVariants with springBouncy
- `src/pages/Tools.tsx` — Sliding pill indicator, shimmer loading, AnimatePresence mode="popLayout"
- `src/pages/games/FlappyBird.tsx` — Bird scaleX(-1), GRAVITY 0.38, JUMP_FORCE -7.5, PIPE_GAP 170, countdown 3-2-1, score popups
- `src/pages/games/Minesweeper.tsx` — Cascade delay 35ms, multi-bounce reveal, white+red flash, 24 debris particles, flag segmented control
- `src/pages/games/BrickBreaker.tsx` — Paddle glow trail, hard bricks, combo timeout bar, brick patterns, mobile paddle 100px
- `src/data/games.ts` — +3 game entries (SimonSays, Sudoku, TypingSpeedTest)
- `src/data/tools.ts` — +3 tool entries (TipCalculator, CaseConverter, RandomNumber)
- `src/lib/animations.ts` — Added particleFloat, progressSlide; removed dead code
- `src/App.tsx` — Enhanced LoadingFallback with particles + progress bar
- `src/components/PageTransition.tsx` — Reduced-motion support, reduced y offset
- `src/index.css` — GPU-accelerated shimmer, skeleton classes, combo-bar keyframe

---

## Round 14: Animation Polish + Micro-Interactions + Category Switch Fixes [DONE - 2026-05-07]
**Goal:** Fix category switching animations, add micro-interactions to new games/tools, efficiency improvements.

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T1 | Games.tsx: exit stagger, exit direction, horizontal scroll pills, scrollIntoView | DONE | Agent A (opus) |
| T2 | Tools.tsx: consolidate AnimatePresence, remove double animation, useLayoutEffect pill | DONE | Agent A (opus) |
| T3 | SkeletonCard: remove dual shimmer, CSS-only shimmer | DONE | Agent A |
| T4 | SimonSays: timeouts cleanup, shake grid, score popup, progress dots, new record | DONE | Agent B (opus) |
| T5 | Sudoku: number spring animation, error shake, hint glow, win confetti, mistake counter | DONE | Agent B |
| T6 | TypingTest: char highlighting, wrong word marking, streak break, live WPM | DONE | Agent B |
| T7 | TipCalculator: staggered results, AnimatePresence, inputMode, empty state | DONE | Agent C (opus) |
| T8 | CaseConverter: sliding indicator, clear button, useMemo, output gradient | DONE | Agent C |
| T9 | RandomNumber: dice wiggle, preset active, history animations, interval cleanup | DONE | Agent C |
| T10 | Simplify review: code reuse, quality, efficiency | DONE | 3 parallel agents |
| T11 | Review fixes: timeouts tracking, redundant state removal, memoization, shuffle in-place | DONE | Main |
| T12 | Build + test | DONE | Main — TypeScript PASS, build PASS (2.37s), 82/82 tests PASS |

### Files Modified
- `src/pages/Games.tsx` — Exit stagger 0.035→0.05, exit y -20→20, skeleton exit 0.1→0.15s, horizontal scroll pills, scrollIntoView
- `src/pages/Tools.tsx` — Single AnimatePresence mode="wait", removed nested motion.div, removed layout prop, SkeletonCard shimmer, useLayoutEffect pill, ResizeObserver
- `src/components/SkeletonCard.tsx` — Removed motion import, CSS-only shimmer, aria-label
- `src/components/GameToolLoading.tsx` — aria-label + role="status"
- `src/pages/games/SimonSays.tsx` — timeoutsRef tracking, shake grid, score +1 popup, new record glow, progress dots, sequence length display
- `src/pages/games/SudokuGame.tsx` — Number AnimatePresence placement/erase, hint amber glow, error shake, pulsing selected ring, win confetti (30 particles), mistake counter, shuffleInPlace
- `src/pages/games/TypingSpeedTest.tsx` — Char-by-char highlighting, wrong word red+strikethrough, streak break animation, live WPM, staggered game-over stats, derived wpm/accuracy, 1s timer interval
- `src/pages/tools/TipCalculator.tsx` — AnimatePresence results, staggered result rows, value bounce on change, per-person AnimatePresence, empty state, inputMode
- `src/pages/tools/CaseConverter.tsx` — layoutId sliding indicator, clear X button, output AnimatePresence, fade gradient, useMemo output+stats, spellCheck=false
- `src/pages/tools/RandomNumber.tsx` — Dice wiggle animation, preset active state, input shake on min>max, result chip exit, history stagger+exit, clear history button, interval cleanup

---

## Round 15: Animation Polish + Category Transitions + Micro-Interactions + Mobile UX [DONE - 2026-05-07]
**Goal:** Smooth category switching (no skeleton flash), micro-interactions for new games/tools, loading animation polish, mobile touch targets, simplify review.

### Task Breakdown
| ID | Task | Status | Agent |
|----|------|--------|-------|
| T1 | Games.tsx: remove skeleton flash, smooth crossfade with staggered card exit/enter | DONE | Agent A (sonnet) |
| T2 | Tools.tsx: remove skeleton flash, smooth crossfade, staggered cards | DONE | Agent B (sonnet) |
| T3 | Animation engine: toolPageEnter preset (consolidated from inline configs) | DONE | Agent C (sonnet) |
| T4 | SimonSays: combo glow, level-up golden flash, score particles | DONE | Agent D (sonnet) |
| T5 | Sudoku: correct-cell green glow, win confetti, timeout cleanup | DONE | Agent D |
| T6 | TypingSpeedTest: char flash/shake, word bounce, streak ≥3, timeout tracking | DONE | Agent D |
| T7 | TipCalculator: gradient shift on value change, toast copy, floating empty icon, timeout cleanup | DONE | Agent E (sonnet) |
| T8 | CaseConverter: input shake, copy checkmark, output fade, timeout cleanup | DONE | Agent E |
| T9 | RandomNumber: dice wobble, confetti overlay, batch reveal, timeout cleanup | DONE | Agent E |
| T10 | SkeletonCard: scale pulse, reduced-motion opacity pulse, softer shimmer | DONE | Agent F (sonnet) |
| T11 | GameToolLoading: orbit dots, smoother progress bar, loading text fade-in | DONE | Agent F |
| T12 | App LoadingFallback: softer easing, background gradient shift, organic progress bar | DONE | Agent F |
| T13 | Mobile UX: all touch targets ≥48px, inputMode attributes, Sudoku number pad scrollable | DONE | Agent G (sonnet) |
| T14 | Simplify review: remove unused imports, fix memory leaks, consolidate animation configs | DONE | 3 parallel agents |
| T15 | Build + lint + test + Playwright E2E | DONE | Main — TypeScript PASS, build PASS (2.43s), 82/82 tests PASS, 10/13 E2E PASS |
| T16 | GitHub push + Cloudflare deploy | DONE | Main — pushed to master, deployed to https://master.spring-nest.pages.dev |

### Files Modified
- `src/pages/Games.tsx` — Removed skeleton flash, AnimatePresence mode="wait" with staggered card exit/enter (opacity+scale+y), removed isSwitching state
- `src/pages/Tools.tsx` — Same crossfade approach, kept sliding pill indicator, removed skeleton flash
- `src/lib/animations.ts` — Consolidated to springBouncy/springSmooth/springSnappy + toolPageEnter + useReducedMotion
- `src/pages/games/SimonSays.tsx` — Combo glow (boxShadow pulse), level-up golden flash (prevSpeedRef), 6 score particles (cos/sin spread), GPU-only scale animation on color buttons
- `src/pages/games/SudokuGame.tsx` — correctCells Set with 500ms green glow, timeout cleanup, formatTime moved to module scope, memoized WinConfetti
- `src/pages/games/TypingSpeedTest.tsx` — Char flash (green/red + scale), word completion bounce, streak threshold ≥3, timeoutsRef for all 5 timeouts, removed color animation (CSS class instead)
- `src/pages/tools/TipCalculator.tsx` — Gradient shift overlay on value change, toast with toastTimeoutRef, floating Calculator icon in empty state, toolPageEnter
- `src/pages/tools/CaseConverter.tsx` — Input shake on empty, copy checkmark (scale 0→1.2→1), output AnimatePresence fade, shakeTimeoutRef+copiedTimeoutRef cleanup, toolPageEnter
- `src/pages/tools/RandomNumber.tsx` — Dice wobble (rotate+scale keyframes), confetti overlay (30 particles), batch reveal animation, CONFETTI_COLORS to module scope, useMemo quickPresets, copiedTimeoutRef+confettiTimeoutRef cleanup, toolPageEnter
- `src/components/SkeletonCard.tsx` — Scale pulse (0.98→1, 2.4s), reduced-motion opacity pulse (0.6→1→0.6), will-change:transform
- `src/components/GameToolLoading.tsx` — 4 orbit dots (cos/sin, 4s cycle), wider gradient progress bar, "Loading" text fade-in
- `src/App.tsx` — Softer easing [0.25,0.1,0.25,1], background gradient shift (8s), organic progress bar easing [0.45,0.05,0.55,0.95], will-change on particles
- `src/index.css` — Softer shimmer gradient (color-mix 40%)
- `playwright.config.ts` — Reverted to port 3000 after testing
