import { Gamepad2, Heart, Play, Flower2, Cloud } from 'lucide-react';
import { useState, useMemo, lazy, Suspense, useEffect, useRef, type ComponentType, type LazyExoticComponent } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { useFavorites } from '../hooks/useFavorites';
import { games } from '../data/games';
import SEO from '../components/SEO';
import { trackGameStart } from '../lib/analytics';
import { recordVisit } from '../lib/recent';
import { springBouncy } from '../lib/animations';
import GameToolLoading from '../components/GameToolLoading';
import SkeletonCard from '../components/SkeletonCard';

const Game2048 = lazy(() => import('./games/Game2048'));
const MemoryGame = lazy(() => import('./games/MemoryGame'));
const WhackAMole = lazy(() => import('./games/WhackAMole'));
const ColorMerge = lazy(() => import('./games/ColorMerge'));
const ForestWalk = lazy(() => import('./games/ForestWalk'));
const Snake = lazy(() => import('./games/Snake'));
const ReactionTest = lazy(() => import('./games/ReactionTest'));
const NumberPuzzle = lazy(() => import('./games/NumberPuzzle'));
const TicTacToe = lazy(() => import('./games/TicTacToe'));
const TypingChallenge = lazy(() => import('./games/TypingChallenge'));
const ColorStroop = lazy(() => import('./games/ColorStroop'));
const Minesweeper = lazy(() => import('./games/Minesweeper'));
const FlappyBird = lazy(() => import('./games/FlappyBird'));
const BrickBreaker = lazy(() => import('./games/BrickBreaker'));
const SimonSays = lazy(() => import('./games/SimonSays'));
const SudokuGame = lazy(() => import('./games/SudokuGame'));
const TypingSpeedTest = lazy(() => import('./games/TypingSpeedTest'));

const gameComponents: Record<string, LazyExoticComponent<ComponentType<{ onBack: () => void }>>> = {
  'game-1': Game2048,
  'game-2': MemoryGame,
  'game-3': WhackAMole,
  'game-4': ColorMerge,
  'game-5': ForestWalk,
  'game-6': Snake,
  'game-7': ReactionTest,
  'game-8': NumberPuzzle,
  'game-9': TicTacToe,
  'game-10': TypingChallenge,
  'game-11': ColorStroop,
  'game-12': Minesweeper,
  'game-13': FlappyBird,
  'game-14': BrickBreaker,
  'game-15': SimonSays,
  'game-16': SudokuGame,
  'game-17': TypingSpeedTest,
};



/** Staggered container variants for the game grid */
const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/** Card entrance/exit variants — bouncy in, snappy out */
const cardVariants = {
  initial: { opacity: 0, scale: 0.92, y: 24 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springBouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.88,
    y: 20,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const },
  },
};

export default function Games() {
  const { t } = useUser();
  const { favoriteIds, toggle } = useFavorites();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isSwitching, setIsSwitching] = useState(false);
  const pillContainerRef = useRef<HTMLDivElement>(null);

  // Find game by route slug
  const activeGameBySlug = useMemo(() => {
    if (!slug) return null;
    return games.find(g => g.route.endsWith(`/${slug}`)) || null;
  }, [slug]);

  // Internal state for in-page detail (when no URL slug)
  const [internalGameId, setInternalGameId] = useState<string | null>(null);

  // When navigating via URL, use slug-based game; otherwise use internal state
  const activeGameId = activeGameBySlug?.id || internalGameId;

  // Sync internal state with URL
  useEffect(() => {
    if (slug && activeGameBySlug) {
      setInternalGameId(activeGameBySlug.id);
    } else if (!slug) {
      setInternalGameId(null);
    }
  }, [slug, activeGameBySlug]);

  const categories = useMemo(() => {
    const cats = [...new Set(games.map(g => g.category))];
    return [
      { id: 'all', label: t('全部游戏', 'All Games') },
      ...cats.map(c => {
        const game = games.find(g => g.category === c);
        return { id: c, label: t(c, game?.categoryEn || c) };
      }),
    ];
  }, [t]);

  const filteredGames = useMemo(
    () => activeCategory === 'all' ? games : games.filter(g => g.category === activeCategory),
    [activeCategory]
  );

  const activeGame = useMemo(
    () => games.find(g => g.id === activeGameId) || null,
    [activeGameId]
  );

  const handlePlay = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game) {
      const gameSlug = game.route.split('/').pop();
      navigate(`/games/${gameSlug}`);
    }
  };

  const handleBack = () => {
    navigate('/games');
  };

  const handleCategorySwitch = (catId: string) => {
    if (catId === activeCategory || isSwitching) return;
    setIsSwitching(true);
    setActiveCategory(catId);

    // Scroll active pill into view
    requestAnimationFrame(() => {
      const container = pillContainerRef.current;
      if (!container) return;
      const activePill = container.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      activePill?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    });
  };

  // Auto-clear switching state after shimmer period
  useEffect(() => {
    if (isSwitching) {
      const timer = setTimeout(() => setIsSwitching(false), 180);
      return () => clearTimeout(timer);
    }
  }, [isSwitching]);

  // Track game open
  useEffect(() => {
    if (activeGame) {
      trackGameStart(activeGame.id);
      recordVisit('game', activeGame.id);
    }
  }, [activeGame]);

  if (activeGame && gameComponents[activeGame.id]) {
    const GameComponent = gameComponents[activeGame.id];
    return (
      <Suspense fallback={<GameToolLoading />}>
        <SEO title={`${t(activeGame.title, activeGame.titleEn)} - Spring Nest`} description={t(activeGame.description, activeGame.descriptionEn)} type="game" />
        <GameComponent onBack={handleBack} />
      </Suspense>
    );
  }

  if (activeGame) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <p className="text-xl text-secondary mb-4">{t('此游戏正在开发中，敬请期待', 'This game is under development. Stay tuned.')}</p>
        <button onClick={handleBack} className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold">
          {t('返回游戏列表', 'Back to Games')}
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex-grow flex flex-col items-center w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10 relative"
    >
      <SEO title={t('休闲小游戏合集 - Spring Nest 春日小筑', 'Casual Games Collection - Spring Nest')} description={t('Spring Nest 提供多款轻松有趣的休闲小游戏，包括 2048、记忆翻牌、打地鼠等。', 'Spring Nest offers fun casual games including 2048, Memory Match, Whack-A-Mole, and more.')} />
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 text-primary-fixed-dim opacity-40 select-none pointer-events-none"
      >
        <Flower2 className="w-12 h-12" />
      </motion.div>
      <motion.div
        animate={{ x: [0, 15, 0], y: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-40 right-10 text-tertiary-fixed-dim opacity-40 select-none pointer-events-none"
      >
        <Cloud className="w-10 h-10" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="font-nunito text-3xl sm:text-4xl font-bold text-on-surface mb-2 flex items-center justify-center gap-3">
          <Gamepad2 className="text-primary w-10 h-10" />
          {t('游戏天堂', 'Game Paradise')}
        </h1>
        <p className="font-sans text-lg font-medium text-on-surface-variant">{t('治愈小游戏，解锁休闲好时光', 'Healing casual games, unlocking good relaxing times')}</p>
      </motion.div>

      <motion.div
        ref={pillContainerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex overflow-x-auto flex-nowrap scrollbar-hide justify-start sm:justify-center gap-4 mb-12"
      >
        {categories.map(cat => (
          <motion.button
            key={cat.id}
            onClick={() => handleCategorySwitch(cat.id)}
            aria-pressed={activeCategory === cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className={`shrink-0 font-semibold text-sm px-6 py-2 rounded-full transition-colors duration-300 ${
              activeCategory === cat.id
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container dark:bg-surface-container dark:hover:bg-primary-container dark:hover:text-on-primary-container'
            }`}
          >
            {cat.label}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {isSwitching ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full mb-16"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={`grid-${activeCategory}`}
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 w-full mb-16"
          >
            {filteredGames.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-20 text-secondary"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Gamepad2 className="w-16 h-16 text-secondary/30 mb-4" />
                </motion.div>
                <p className="font-medium text-lg">{t('暂无游戏', 'No games found')}</p>
              </motion.div>
            ) : (
              filteredGames.map((game) => (
                <motion.div
                  key={game.id}
                  variants={cardVariants}
                  whileHover={{ y: -8, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white dark:bg-surface-container-high rounded-xl p-6 shadow-[0_8px_30px_rgba(217,239,224,0.4)] dark:shadow-none hover:shadow-[0_12px_40px_rgba(254,233,239,0.6)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-shadow duration-300 flex flex-col gap-4 group"
                >
                  {game.image ? (
                    <div className="w-full h-48 rounded-lg overflow-hidden bg-surface-container-low flex items-center justify-center relative">
                      <img src={game.image} alt={game.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                    </div>
                  ) : (
                    <div className={`w-full h-48 rounded-lg ${game.iconBg || 'bg-surface-container-low'} flex items-center justify-center text-6xl`}>
                      {game.icon}
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`w-16 h-16 rounded-lg ${game.iconBg || 'bg-surface-container-low'} flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-12 transition-transform duration-300 text-2xl`}>
                      {game.icon || <Gamepad2 className="text-primary w-8 h-8" />}
                    </div>
                    <div className="flex-grow">
                      <h2 className="font-sans text-lg text-on-surface font-bold group-hover:text-primary transition-colors">{t(game.title, game.titleEn)}</h2>
                      <p className="font-sans text-sm font-semibold text-on-surface-variant opacity-70">{game.category}</p>
                    </div>
                  </div>
                  <p className="font-sans text-base text-on-surface-variant line-clamp-2 mt-2">{t(game.description, game.descriptionEn)}</p>
                  <div className="mt-auto pt-4 flex justify-between items-center">
                    <button
                      onClick={() => toggle(game.id)}
                      className={`p-2 rounded-full transition-all ${
                        favoriteIds.includes(game.id)
                          ? 'text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100'
                          : 'text-secondary/40 hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                      }`}
                      aria-label={favoriteIds.includes(game.id) ? t('取消收藏', 'Remove favorite') : t('收藏', 'Add favorite')}
                    >
                      <Heart className={`w-5 h-5 ${favoriteIds.includes(game.id) ? 'fill-current' : ''}`} />
                    </button>
                    <motion.button
                      onClick={() => handlePlay(game.id)}
                      whileHover={{ scale: 1.05, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                      whileTap={{ scale: 0.93 }}
                      className="bg-gradient-to-r from-primary-container to-primary text-on-primary font-semibold text-sm px-6 py-2 rounded-full flex items-center gap-2 hover:shadow-lg transition-shadow duration-300"
                    >
                      <Play className="w-4 h-4" />
                      {t('开始游戏', 'Play')}
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
