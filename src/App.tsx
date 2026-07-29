import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import Navigation from './components/Navigation';
import AnnouncementBanner from './components/AnnouncementBanner';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';
import ParticleBackground from './components/ParticleBackground';
import DynamicSpringBackground from './components/animations/DynamicSpringBackground';
import { ConsentProvider } from './contexts/ConsentContext';
import CookieBanner from './components/CookieBanner';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useReducedMotion, pageTransitionVariants, softEase } from './lib/animations';
import { trackPageView } from './lib/analytics';
import { useSwipeNavigation } from './lib/useSwipeNavigation';
import { getBackgroundProfileForLocation } from './lib/backgroundProfiles';
import { reportWebVitals } from './lib/webVitals';
import { Leaf } from 'lucide-react';
import SkipLink from './components/accessibility/SkipLink';
import { ForestRuntimeProvider, useForestRuntime, useForestRuntimeSelector } from './lib/forest/ForestRuntime';
import StartupSplash from './components/StartupSplash';
import ForestCursor from './components/animations/ForestCursor';
import ForestAmbientEggs from './components/animations/ForestAmbientEggs';
import ForestScrollDamper from './components/animations/ForestScrollDamper';

const Home = lazy(() => import('./pages/Home'));
const Games = lazy(() => import('./pages/Games'));
const Tools = lazy(() => import('./pages/Tools'));
const About = lazy(() => import('./pages/About'));
const Profile = lazy(() => import('./pages/Profile'));
const Favorites = lazy(() => import('./pages/Favorites'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Admin = lazy(() => import('./pages/Admin'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Offline = lazy(() => import('./pages/Offline'));
const NotFound = lazy(() => import('./pages/NotFound'));

const LoadingFallback = () => {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || reducedMotion) return;

    // Logo floating animation
    if (logoRef.current) {
      gsap.to(logoRef.current, {
        y: -8,
        scale: 1.05,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    }

    // Label entrance
    if (labelRef.current) {
      gsap.fromTo(labelRef.current,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power2.out' }
      );
    }

    // Progress bar animation
    if (progressRef.current) {
      gsap.fromTo(progressRef.current,
        { x: '-100%' },
        { x: '100%', duration: 2.5, repeat: -1, ease: 'power1.inOut' }
      );
    }

    return () => {
      gsap.killTweensOf([containerRef.current, logoRef.current, labelRef.current, progressRef.current]);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="flex-grow flex items-center justify-center min-h-[100svh] bg-gradient-to-b from-[#E8F5EE]/40 to-[#FFF9F2]/40 dark:from-[#1a2c1f]/40 dark:to-background/40"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <ParticleBackground />
          <div ref={logoRef}>
            <Leaf className="w-12 h-12 text-primary fill-primary/30" />
          </div>
        </div>
        <span
          ref={labelRef}
          className="font-nunito font-bold text-lg text-primary"
        >
          Spring Nest
        </span>
        {!reducedMotion && (
          <div className="loading-progress">
            <div
              ref={progressRef}
              className="h-full bg-primary/60 rounded-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

function applyFormControlAccessibleNames() {
  const controls = document.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >('input:not([type="hidden"]), textarea, select');

  controls.forEach((control) => {
    if (
      control.getAttribute('aria-label') ||
      control.getAttribute('aria-labelledby') ||
      control.getAttribute('title')
    )
      return;
    if (control.closest('label')) return;

    const id = control.getAttribute('id');
    if (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) return;

    const placeholder = control.getAttribute('placeholder')?.replace(/\s+/g, ' ').trim();
    const fallback =
      placeholder ||
      control.getAttribute('name') ||
      (control.tagName.toLowerCase() === 'select' ? '选择选项' : control.getAttribute('type')) ||
      '表单控件';

    control.setAttribute('aria-label', fallback);
  });
}

function PageWrapper({
  children,
  reducedMotion,
}: {
  children: React.ReactNode;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || reducedMotion) return;

    gsap.fromTo(ref.current,
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
    );

    return () => {
      if (ref.current) gsap.killTweensOf(ref.current);
    };
  }, [reducedMotion]);

  if (reducedMotion) return children;
  return (
    <div
      ref={ref}
      style={{ transformOrigin: '50% 18%', willChange: 'transform, opacity' }}
    >
      {children}
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const { onTouchStart, onTouchEnd } = useSwipeNavigation();
  const mainRef = useRef<HTMLElement>(null);
  const forest = useForestRuntime();
  const idleMs = useForestRuntimeSelector((s) => s.idleMs);
  const scrollSection = useForestRuntimeSelector((s) => s.scroll.section);
  const [splashDone, setSplashDone] = useState(false);
  const [forceSplash, setForceSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('replaySplash') === '1';
  });
  const backgroundProfile = useMemo(
    () => getBackgroundProfileForLocation(location.pathname, location.search),
    [location.pathname, location.search],
  );

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.search]);

  useEffect(() => {
    forest.registerScroller(mainRef.current);
  }, [forest, splashDone]);

  useEffect(() => {
    forest.setSplashActive(!splashDone);
  }, [forest, splashDone]);

  useEffect(() => {
    const replay = () => {
      setForceSplash(true);
      setSplashDone(false);
      forest.setSplashActive(true);
    };
    window.addEventListener('forest:replay-splash', replay);
    return () => window.removeEventListener('forest:replay-splash', replay);
  }, [forest]);

  useEffect(() => {
    if (!forceSplash) return;
    void import('./lib/forest/forestSplashMemory').then(({ clearForestSplashMemory }) => {
      clearForestSplashMemory();
    });
    const params = new URLSearchParams(location.search);
    if (params.get('replaySplash') === '1') {
      params.delete('replaySplash');
      const next = `${location.pathname}${params.toString() ? `?${params}` : ''}${location.hash}`;
      window.history.replaceState(null, '', next || '/');
    }
  }, [forceSplash, location.hash, location.pathname, location.search]);

  useEffect(() => {
    applyFormControlAccessibleNames();
    const observer = new MutationObserver(applyFormControlAccessibleNames);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    reportWebVitals();
  }, []);

  const damperEnabled =
    !reducedMotion &&
    !forest.flags.isGameRoute &&
    forest.tier !== 'low' &&
    splashDone;

  const cursorEnabled =
    forest.tier !== 'low' &&
    forest.flags.finePointer &&
    !forest.flags.isGameRoute &&
    !forest.flags.reducedMotion &&
    splashDone;

  const eggsEnabled = forest.tier === 'high' && !forest.flags.isGameRoute && !forest.flags.reducedMotion && splashDone;

  return (
          <div
            className="relative isolate flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-background font-sans text-on-surface selection:bg-primary-container selection:text-on-primary-container transition-colors duration-300"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
              <SkipLink />
              <DynamicSpringBackground profile={backgroundProfile} />
              {!splashDone && (
                <StartupSplash
                  forceShow={forceSplash}
                  onComplete={() => {
                    setSplashDone(true);
                    setForceSplash(false);
                  }}
                />
              )}
              <div
                className="contents"
                inert={!splashDone ? true : undefined}
                aria-hidden={!splashDone ? true : undefined}
              >
              <ForestCursor enabled={cursorEnabled} />
              <ForestAmbientEggs
                enabled={eggsEnabled}
                idleMs={idleMs}
                onStrongWind={() => forest.pulseStrongWind()}
                onGust={(x, y) => forest.pulseGust(x, y)}
                onResetScroll={() => forest.resetScrollView()}
                onBrightness={(n) => forest.setBrightnessBoost(n)}
              />
              <Navigation />
              <AnnouncementBanner />
              <ForestScrollDamper
                scrollerRef={mainRef}
                enabled={damperEnabled}
                damping={
                  scrollSection === 'hero'
                    ? 1.4
                    : scrollSection === 'cards'
                      ? 1.1
                      : scrollSection === 'footer'
                        ? 1.0
                        : 1.2
                }
              />
              <main
                id="main-content"
                ref={mainRef}
                data-forest-ui
                className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain [perspective:1400px]"
              >
                <Suspense fallback={<LoadingFallback />}>
                  <Routes location={location} key={location.pathname}>
                      <Route
                        path="/"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Home />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/games"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Games />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/games/:slug"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Games />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/tools"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Tools />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/tools/:slug"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Tools />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/about"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <About />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Profile />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/favorites"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Favorites />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/leaderboard"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Leaderboard />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Admin />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/feedback"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Feedback />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/privacy"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Privacy />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/terms"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Terms />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/offline"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <Offline />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="/search"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <SearchResults />
                          </PageWrapper>
                        }
                      />
                      <Route
                        path="*"
                        element={
                          <PageWrapper reducedMotion={reducedMotion}>
                            <NotFound />
                          </PageWrapper>
                        }
                      />
                    </Routes>
                </Suspense>
                <Footer />
              </main>
              <PwaUpdatePrompt />
              {splashDone && <CookieBanner />}
              </div>
            </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ConsentProvider>
        <UserProvider>
          <ErrorBoundary>
            <ForestRuntimeProvider>
              <AppShell />
            </ForestRuntimeProvider>
          </ErrorBoundary>
        </UserProvider>
      </ConsentProvider>
    </ThemeProvider>
  );
}
