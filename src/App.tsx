import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'motion/react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
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

const LoadingFallback = () => (
  <div className="flex-grow flex items-center justify-center min-h-[50vh] bg-gradient-to-b from-[#E8F5EE]/40 to-[#FFF9F2]/40 dark:from-[#1a2c1f]/40 dark:to-background/40">
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Leaf className="w-12 h-12 text-primary fill-primary/30" />
      </motion.div>
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="font-nunito font-bold text-lg text-primary"
      >
        Spring Nest
      </motion.span>
    </div>
  </div>
);

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
