import { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import {
  useReducedMotion,
  pageTransitionVariants,
  softEase,
  floatingParticles,
} from './lib/animations';
import { trackPageView } from './lib/analytics';
import { useSwipeNavigation } from './lib/useSwipeNavigation';
import { Leaf } from 'lucide-react';

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

  return (
    <motion.div
      className="flex-grow flex items-center justify-center min-h-[100svh] bg-gradient-to-b from-[#E8F5EE]/40 to-[#FFF9F2]/40 dark:from-[#1a2c1f]/40 dark:to-background/40"
      animate={
        reducedMotion
          ? {}
          : {
              background: [
                'linear-gradient(to bottom, rgba(232,245,238,0.4), rgba(255,249,242,0.4))',
                'linear-gradient(to bottom, rgba(220,240,230,0.4), rgba(245,240,235,0.4))',
                'linear-gradient(to bottom, rgba(232,245,238,0.4), rgba(255,249,242,0.4))',
              ],
            }
      }
      transition={{ duration: 8, repeat: Infinity, ease: softEase }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {/* Floating particles — softer easing curves */}
          {!reducedMotion &&
            floatingParticles.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary/20"
                style={{
                  width: p.size,
                  height: p.size,
                  left: '50%',
                  top: '50%',
                  willChange: 'transform, opacity',
                }}
                animate={{
                  x: [0, p.x, 0],
                  y: [0, p.y, 0],
                  opacity: [0, 0.55, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: softEase,
                }}
              />
            ))}
          {/* Pulsing logo */}
          <motion.div
            animate={reducedMotion ? {} : { y: [0, -8, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: softEase }}
          >
            <Leaf className="w-12 h-12 text-primary fill-primary/30" />
          </motion.div>
        </div>
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: softEase }}
          className="font-nunito font-bold text-lg text-primary"
        >
          Spring Nest
        </motion.span>
        {/* Animated progress bar — organic cubic-bezier easing */}
        {!reducedMotion && (
          <div className="loading-progress">
            <motion.div
              className="h-full bg-primary/60 rounded-full"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: [0.45, 0.05, 0.55, 0.95] }}
            />
          </div>
        )}
      </div>
    </motion.div>
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
  if (reducedMotion) return children;
  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransitionVariants}>
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const { onTouchStart, onTouchEnd } = useSwipeNavigation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.search]);

  useEffect(() => {
    applyFormControlAccessibleNames();
    const observer = new MutationObserver(applyFormControlAccessibleNames);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <ErrorBoundary>
          <div
            className="h-screen flex flex-col font-sans selection:bg-primary-container selection:text-on-primary-container relative bg-background text-on-surface transition-colors duration-300 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <Navigation />
            <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden relative overscroll-y-contain">
              <Suspense fallback={<LoadingFallback />}>
                <AnimatePresence mode="wait">
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
                </AnimatePresence>
              </Suspense>
              <Footer />
            </main>
            <PwaUpdatePrompt />
          </div>
        </ErrorBoundary>
      </UserProvider>
    </ThemeProvider>
  );
}
