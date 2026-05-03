import { Gamepad2, Heart, Play, Flower2, Cloud } from 'lucide-react';
import { useState, useMemo, lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { useFavorites } from '../hooks/useFavorites';
import { games } from '../data/games';

const Game2048 = lazy(() => import('./games/Game2048'));
const MemoryGame = lazy(() => import('./games/MemoryGame'));
const WhackAMole = lazy(() => import('./games/WhackAMole'));
const ColorMerge = lazy(() => import('./games/ColorMerge'));
const ForestWalk = lazy(() => import('./games/ForestWalk'));

const gameComponents: Record<string, LazyExoticComponent<ComponentType<{ onBack: () => void }>>> = {
  'game-1': Game2048,
  'game-2': MemoryGame,
  'game-3': WhackAMole,
  'game-4': ColorMerge,
  'game-5': ForestWalk,
};

export default function Games() {
  const { t } = useUser();
  const { favoriteIds, toggle } = useFavorites();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [activeCategory, setActiveCategory] = useState('all');

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
    return [{ id: 'all', label: t('全部游戏', 'All Games') }, ...cats.map(c => ({ id: c, label: c }))];
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

  if (activeGame && gameComponents[activeGame.id]) {
    const GameComponent = gameComponents[activeGame.id];
    return (
      <Suspense fallback={<div className="flex-grow flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
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
    <div className="flex-grow flex flex-col items-center w-full max-w-[1200px] mx-auto px-6 py-10 relative">
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
        <h1 className="font-nunito text-4xl font-bold text-on-surface mb-2 flex items-center justify-center gap-3">
          <Gamepad2 className="text-primary w-10 h-10" />
          {t('游戏天堂', 'Game Paradise')}
        </h1>
        <p className="font-sans text-lg font-medium text-on-surface-variant">{t('治愈小游戏，解锁休闲好时光', 'Healing casual games, unlocking good relaxing times')}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap justify-center gap-4 mb-12"
      >
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-pressed={activeCategory === cat.id}
            className={`font-semibold text-sm px-6 py-2 rounded-full transition-all duration-300 ${
              activeCategory === cat.id
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container dark:bg-surface-container dark:hover:bg-primary-container dark:hover:text-on-primary-container'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full mb-16">
        <AnimatePresence>
          {filteredGames.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-20 text-secondary"
            >
              <Gamepad2 className="w-16 h-16 text-secondary/30 mb-4" />
              <p className="font-medium text-lg">{t('暂无游戏', 'No games found')}</p>
            </motion.div>
          )}
          {filteredGames.map((game, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
              key={game.id}
              className="bg-white dark:bg-surface-container-high rounded-xl p-6 shadow-[0_8px_30px_rgba(217,239,224,0.4)] dark:shadow-none hover:shadow-[0_12px_40px_rgba(254,233,239,0.6)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all duration-300 flex flex-col gap-4 group"
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
                <div className={`w-16 h-16 rounded-lg ${game.iconBg || 'bg-surface-container-low'} flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-6 transition-transform duration-300 text-2xl`}>
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
                <button
                  onClick={() => handlePlay(game.id)}
                  className="bg-gradient-to-r from-primary-container to-primary text-on-primary font-semibold text-sm px-6 py-2 rounded-full flex items-center gap-2 hover:shadow-lg transition-all duration-300"
                >
                  <Play className="w-4 h-4" />
                  {t('开始游戏', 'Play')}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
