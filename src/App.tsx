import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'motion/react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useReducedMotion } from './lib/animations';
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
const NotFound = lazy(() => import('./pages/NotFound'));

const particles = [
  { x: -40, y: -30, delay: 0, size: 4 },
  { x: 35, y: -25, delay: 0.5, size: 3 },
  { x: -30, y: 25, delay: 1, size: 5 },
  { x: 40, y: 20, delay: 1.5, size: 3 },
  { x: 0, y: -40, delay: 0.8, size: 4 },
  { x: -20, y: 35, delay: 1.2, size: 3 },
];

const softEase = [0.25, 0.1, 0.25, 1] as const;

const LoadingFallback = () => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="flex-grow flex items-center justify-center min-h-[50vh] bg-gradient-to-b from-[#E8F5EE]/40 to-[#FFF9F2]/40 dark:from-[#1a2c1f]/40 dark:to-background/40"
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
          {!reducedMotion && particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-primary/20"
              style={{ width: p.size, height: p.size, left: '50%', top: '50%', willChange: 'transform, opacity' }}
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

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ErrorBoundary>
          <div className="min-h-screen flex flex-col font-sans selection:bg-primary-container selection:text-on-primary-container relative bg-background text-on-surface transition-colors duration-300">
            <Navigation />
            <main className="flex-grow flex flex-col relative overflow-hidden">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/games/:slug" element={<Games />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/tools/:slug" element={<Tools />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </ErrorBoundary>
      </UserProvider>
    </ThemeProvider>
  );
}
