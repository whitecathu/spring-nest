import {
  ArrowLeft,
  ArrowUpDown,
  Cloud,
  Flower2,
  Gamepad2,
  Heart,
  Info,
  Play,
  RotateCcw,
  Search,
  Smartphone,
} from 'lucide-react';
import {
  useState,
  useMemo,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { useFavorites } from '../hooks/useFavorites';
import { games } from '../data/games';
import SEO from '../components/SEO';
import ErrorBoundary from '../components/ErrorBoundary';
import { trackGameStart } from '../lib/analytics';
import { getRecentItems, recordVisit } from '../lib/recent';
import {
  springBouncy,
  springSmooth,
  springSnappy,
  gridContainerVariants,
  gridCardVariants,
  useReducedMotion,
} from '../lib/animations';
import GameToolLoading from '../components/GameToolLoading';
import { collectionJsonLd, faqJsonLd, itemJsonLd } from '../lib/structuredData';
import { getGameCategoryBySlug } from '../lib/catalogRoutes';
import type { AppItem } from '../types/app';
import { gameComponents } from '../registries/gameRegistry';

type GameSortMode = 'popular' | 'newest' | 'name' | 'recent';

const sortModes = new Set<GameSortMode>(['popular', 'newest', 'name', 'recent']);

function getValidSortMode(value: string | null): GameSortMode {
  return value && sortModes.has(value as GameSortMode) ? (value as GameSortMode) : 'popular';
}

function getValidCategory(value: string | null, categories: string[]) {
  if (!value || value === 'all') return 'all';
  return categories.includes(value) ? value : 'all';
}

function matchesGameQuery(item: AppItem, query: string) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return [
    item.title,
    item.titleEn,
    item.description,
    item.descriptionEn,
    item.category,
    item.categoryEn,
    item.instructions ?? '',
    ...(item.tags ?? []),
    ...(item.features ?? []),
  ]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

function getGameFaq(item: AppItem, t: (zh: string, en: string) => string) {
  if (item.faq?.length) {
    return item.faq.map((entry) => ({
      q: t(entry.q, entry.qEn ?? entry.q),
      a: t(entry.a, entry.aEn ?? entry.a),
    }));
  }

  return [
    {
      q: t('需要登录才能玩吗？', 'Do I need to sign in?'),
      a: t(
        '不需要。游戏可直接开始，最高分等记录会优先保存在浏览器本地。',
        'No. You can play immediately, and high scores are saved locally in your browser first.',
      ),
    },
    {
      q: t('手机上能玩吗？', 'Can I play on mobile?'),
      a: t(
        '可以。游戏页会尽量提供触屏操作；如果游戏支持键盘，也会保留桌面端键盘操作。',
        'Yes. Game pages provide touch controls where practical, while desktop keyboard controls stay available when supported.',
      ),
    },
  ];
}

export default function Games() {
  const { t } = useUser();
  const { favoriteIds, toggle } = useFavorites();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryRoute = getGameCategoryBySlug(slug);
  const [query, setQuery] = useState('');
  const pillContainerRef = useRef<HTMLDivElement>(null);
  const [pillLayout, setPillLayout] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const reducedMotion = useReducedMotion();

  // Find game by route slug
  const activeGameBySlug = useMemo(() => {
    if (!slug || categoryRoute) return null;
    return games.find((g) => g.route.endsWith(`/${slug}`)) || null;
  }, [slug, categoryRoute]);

  const [internalGameId, setInternalGameId] = useState<string | null>(null);
  const activeGameId = activeGameBySlug?.id || internalGameId;

  useEffect(() => {
    if (slug && activeGameBySlug) {
      setInternalGameId(activeGameBySlug.id);
    } else if (!slug || categoryRoute) {
      setInternalGameId(null);
    }
  }, [slug, activeGameBySlug, categoryRoute]);

  const categories = useMemo(() => {
    const cats = [...new Set(games.map((g) => g.category))];
    return [
      { id: 'all', label: t('全部游戏', 'All Games') },
      ...cats.map((c) => {
        const game = games.find((g) => g.category === c);
        return { id: c, label: t(c, game?.categoryEn || c) };
      }),
    ];
  }, [t]);

  const categoryIds = useMemo(() => categories.map((cat) => cat.id), [categories]);
  const queryCategory = getValidCategory(searchParams.get('category'), categoryIds);
  const activeCategory =
    queryCategory !== 'all' ? queryCategory : (categoryRoute?.category ?? 'all');
  const sortMode = getValidSortMode(searchParams.get('sort'));

  useEffect(() => {
    if (slug && !categoryRoute && !activeGameBySlug) navigate('/games', { replace: true });
  }, [slug, categoryRoute, activeGameBySlug, navigate]);

  const filteredGames = useMemo(() => {
    const recentOrder = new Map(
      getRecentItems(20)
        .filter((item) => item.type === 'game')
        .map((item, index) => [item.id, index]),
    );
    const byCategory =
      activeCategory === 'all' ? games : games.filter((game) => game.category === activeCategory);
    const byQuery = byCategory.filter((game) => matchesGameQuery(game, query));

    return [...byQuery].sort((a, b) => {
      if (sortMode === 'newest') return Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
      if (sortMode === 'name')
        return t(a.title, a.titleEn).localeCompare(t(b.title, b.titleEn), 'zh-Hans-CN');
      if (sortMode === 'recent') {
        const aRecent = recentOrder.get(a.id) ?? Number.POSITIVE_INFINITY;
        const bRecent = recentOrder.get(b.id) ?? Number.POSITIVE_INFINITY;
        if (aRecent !== bRecent) return aRecent - bRecent;
      }
      return (b.popularScore ?? 0) - (a.popularScore ?? 0);
    });
  }, [activeCategory, query, sortMode, t]);

  const activeGame = useMemo(
    () => games.find((g) => g.id === activeGameId) || null,
    [activeGameId],
  );

  const handlePlay = useCallback(
    (gameId: string) => {
      const game = games.find((g) => g.id === gameId);
      if (game) {
        const gameSlug = game.route.split('/').pop();
        navigate(`/games/${gameSlug}`);
      }
    },
    [navigate],
  );

  const handleBack = useCallback(() => {
    navigate('/games');
  }, [navigate]);

  const handleSortChange = useCallback(
    (nextSort: GameSortMode) => {
      const params = new URLSearchParams(searchParams);
      if (activeCategory !== 'all') params.set('category', activeCategory);
      else params.delete('category');
      if (nextSort === 'popular') params.delete('sort');
      else params.set('sort', nextSort);
      setSearchParams(params, { replace: false });
    },
    [activeCategory, searchParams, setSearchParams],
  );

  const updatePillLayout = () => {
    const container = pillContainerRef.current;
    if (!container) return;
    const activePill = container.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (activePill) {
      const containerRect = container.getBoundingClientRect();
      const pillRect = activePill.getBoundingClientRect();
      const newLeft = pillRect.left - containerRect.left + container.scrollLeft;
      const newWidth = pillRect.width;
      setPillLayout((prev) => {
        if (prev.left === newLeft && prev.width === newWidth) return prev;
        return { left: newLeft, width: newWidth };
      });
    }
  };

  useLayoutEffect(() => {
    updatePillLayout();
  }, [activeCategory]);

  useEffect(() => {
    const container = pillContainerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => updatePillLayout());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleCategorySwitch = useCallback(
    (catId: string) => {
      if (catId === activeCategory) return;
      const params = new URLSearchParams(searchParams);
      if (catId === 'all') params.delete('category');
      else params.set('category', catId);
      if (sortMode !== 'popular') params.set('sort', sortMode);
      else params.delete('sort');
      setSearchParams(params, { replace: false });

      requestAnimationFrame(() => {
        const container = pillContainerRef.current;
        if (!container) return;
        const activePill = container.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
        activePill?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      });
    },
    [activeCategory, searchParams, setSearchParams, sortMode],
  );

  useEffect(() => {
    if (activeGame) {
      trackGameStart(activeGame.id);
      recordVisit('game', activeGame.id);
    }
  }, [activeGame]);

  if (activeGame && gameComponents[activeGame.id]) {
    const GameComponent = gameComponents[activeGame.id];
    const faq = getGameFaq(activeGame, t);
    const relatedGames = games.filter((game) => activeGame.related?.includes(game.id)).slice(0, 3);
    const jsonLd = [itemJsonLd(activeGame), faqJsonLd(faq)];

    return (
      <Suspense fallback={<GameToolLoading />}>
        <SEO
          title={`${t(activeGame.title, activeGame.titleEn)} - Spring Nest 春日小筑`}
          description={t(activeGame.description, activeGame.descriptionEn)}
          canonical={activeGame.route}
          type="website"
          jsonLd={jsonLd}
        />
        <article className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-8">
          <Link
            to="/games"
            className="mb-5 inline-flex min-h-[48px] items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('返回游戏列表', 'Back to games')}
          </Link>
          <header className="mb-6 rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
              <span className="rounded-full bg-tertiary-container/40 px-3 py-1 text-on-tertiary-container">
                {t(activeGame.category, activeGame.categoryEn)}
              </span>
              <span className="rounded-full bg-surface-container px-3 py-1 text-secondary">
                {t('无需登录', 'No sign-in')}
              </span>
            </div>
            <p className="mb-3 text-3xl font-black tracking-tight text-on-surface sm:text-4xl">
              {t(activeGame.title, activeGame.titleEn)}
            </p>
            <p className="max-w-3xl text-base leading-relaxed text-secondary">
              {t(activeGame.description, activeGame.descriptionEn)}
            </p>
          </header>

          <section aria-label={t('主游戏区域', 'Main game area')}>
            <ErrorBoundary
              fallback={
                <div className="rounded-2xl border border-red-200 bg-red-50/80 p-5 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
                  <h2 className="text-lg font-bold">{t('游戏运行时出错', 'Game runtime error')}</h2>
                  <p className="mt-2 text-sm leading-6">
                    {t(
                      '这个游戏暂时无法继续运行，其他页面仍可继续使用。请返回列表或刷新后重试。',
                      'This game cannot continue right now. The rest of the site remains available. Return to the list or refresh and try again.',
                    )}
                  </p>
                </div>
              }
            >
              <GameComponent onBack={handleBack} />
            </ErrorBoundary>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-on-surface">
                <Info className="h-5 w-5 text-primary" />
                {t('玩法说明', 'How to play')}
              </h2>
              <p className="text-sm leading-relaxed text-secondary">
                {t(
                  activeGame.instructions || '打开游戏后按页面提示开始，完成目标即可得分。',
                  activeGame.instructionsEn ||
                    'Open the game and follow the on-page prompt to start. Complete the objective to score.',
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-on-surface">
                <RotateCcw className="h-5 w-5 text-primary" />
                {t('键盘操作', 'Keyboard')}
              </h2>
              <p className="text-sm leading-relaxed text-secondary">
                {t(
                  '支持键盘的游戏通常使用方向键、空格或 Enter。具体按键以游戏区域内提示为准。',
                  'Keyboard-enabled games usually use arrow keys, Space, or Enter. Follow the game area prompts for exact controls.',
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-on-surface">
                <Smartphone className="h-5 w-5 text-primary" />
                {t('移动端操作', 'Mobile')}
              </h2>
              <p className="text-sm leading-relaxed text-secondary">
                {t(
                  '移动端可使用点击、滑动或屏幕按钮操作。横屏游戏建议保持屏幕稳定，避免页面滚动干扰。',
                  'On mobile, use taps, swipes, or on-screen buttons. For landscape-style games, keep the screen steady to avoid accidental page scrolling.',
                )}
              </p>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5">
            <h2 className="mb-4 text-xl font-bold text-on-surface">FAQ</h2>
            <div className="space-y-4">
              {faq.map((entry) => (
                <div key={entry.q}>
                  <h3 className="font-semibold text-on-surface">{entry.q}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-secondary">{entry.a}</p>
                </div>
              ))}
            </div>
          </section>

          {relatedGames.length > 0 && (
            <section className="mt-6 rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5">
              <h2 className="mb-4 text-xl font-bold text-on-surface">
                {t('相关游戏', 'Related games')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {relatedGames.map((game) => (
                  <Link
                    key={game.id}
                    to={game.route}
                    className="rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-tertiary-container/20"
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {game.icon}
                    </span>
                    <h3 className="mt-2 font-bold text-on-surface">
                      {t(game.title, game.titleEn)}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-secondary">
                      {t(game.description, game.descriptionEn)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </Suspense>
    );
  }

  if (activeGame) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <p className="text-xl text-secondary mb-4">
          {t(
            '这个游戏暂时无法打开，请返回列表选择其他游戏。',
            'This game cannot be opened right now. Please return to the list.',
          )}
        </p>
        <button
          onClick={handleBack}
          className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold min-h-[48px]"
        >
          {t('返回游戏列表', 'Back to Games')}
        </button>
      </div>
    );
  }

  const pageTitle = categoryRoute
    ? `${t(categoryRoute.label, categoryRoute.labelEn)} - Spring Nest 春日小筑`
    : t('休闲小游戏合集 - Spring Nest 春日小筑', 'Casual Games Collection - Spring Nest');
  const pageDescription = categoryRoute
    ? t(
        `${categoryRoute.label}收录春日小筑中可直接打开的相关小游戏，支持搜索、分类筛选和本地最高分记录。`,
        `${categoryRoute.labelEn} collects related Spring Nest games with search, category filtering, and local high scores.`,
      )
    : t(
        'Spring Nest 提供 2048、记忆翻牌、扫雷、贪吃蛇、打字测速等休闲小游戏，免费、轻量、无需登录。',
        'Spring Nest offers 2048, memory match, minesweeper, snake, typing speed, and other casual games, free, lightweight, and playable without sign-in.',
      );

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 py-10 relative">
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={categoryRoute ? `/games/${categoryRoute.slug}` : '/games'}
        jsonLd={collectionJsonLd(
          pageTitle,
          pageDescription,
          categoryRoute ? `/games/${categoryRoute.slug}` : '/games',
          filteredGames,
        )}
      />

      {/* Decorative floating elements */}
      <motion.div
        {...(!reducedMotion && {
          animate: { y: [0, -20, 0], rotate: [0, 5, -5, 0] },
          transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
        })}
        className="absolute top-10 left-10 text-primary-fixed-dim opacity-40 select-none pointer-events-none"
      >
        <Flower2 className="w-12 h-12" />
      </motion.div>
      <motion.div
        {...(!reducedMotion && {
          animate: { x: [0, 15, 0], y: [0, 10, 0] },
          transition: { duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 },
        })}
        className="absolute top-40 right-10 text-tertiary-fixed-dim opacity-40 select-none pointer-events-none"
      >
        <Cloud className="w-10 h-10" />
      </motion.div>

      {/* Background blur orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-[10%] w-24 h-24 bg-tertiary-container/40 rounded-full blur-2xl animate-float"></div>
        <div className="absolute top-10 right-[15%] w-32 h-32 bg-primary-container/30 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 sm:mb-16 lg:mb-20 relative pt-8 pb-4"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-tertiary-container/20 to-transparent -z-10 rounded-3xl blur-2xl"></div>
        <h1 className="font-nunito font-extrabold text-3xl sm:text-4xl lg:text-5xl text-on-surface mb-6 flex items-center justify-center gap-4">
          <Gamepad2 className="text-primary w-10 h-10" />
          {categoryRoute
            ? t(categoryRoute.label, categoryRoute.labelEn)
            : t('游戏天堂', 'Game Paradise')}
        </h1>
        <p className="font-sans text-lg font-medium text-on-surface-variant max-w-2xl mx-auto">
          {pageDescription}
        </p>
      </motion.header>

      <section className="mb-8 rounded-2xl border border-surface-variant/30 bg-white/70 dark:bg-surface-container-high/60 p-5">
        <p className="text-sm leading-7 text-secondary">
          {t(
            '这里汇总了春日小筑的全部小游戏。你可以按类型筛选，也可以搜索名称、玩法或标签；多数游戏会把最高分保存在浏览器本地，不需要账号即可开始。适合短暂休息、反应训练、打字练习和经典解谜。',
            'This page collects every Spring Nest game. Filter by type or search by name, gameplay, or tag. Most games save high scores in local browser storage and can be played without an account. Good for short breaks, reaction training, typing practice, and classic puzzles.',
          )}
        </p>
      </section>

      <div className="mb-8 grid gap-3 md:grid-cols-[1fr_auto]">
        <form role="search" onSubmit={(event) => event.preventDefault()} className="relative">
          <label htmlFor="games-search" className="sr-only">
            {t('搜索小游戏', 'Search games')}
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/50" />
          <input
            id="games-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('搜索名称、玩法或标签', 'Search name, gameplay, or tags')}
            className="min-h-[52px] w-full rounded-2xl border border-surface-variant/40 bg-white/80 py-3 pl-12 pr-4 text-on-surface outline-none transition-colors focus:border-primary dark:bg-surface-container-high/70"
          />
        </form>
        <label className="flex min-h-[52px] items-center gap-2 rounded-2xl border border-surface-variant/40 bg-white/80 px-4 text-sm font-semibold text-secondary dark:bg-surface-container-high/70">
          <ArrowUpDown className="h-4 w-4" />
          <span className="sr-only">{t('排序', 'Sort')}</span>
          <select
            value={sortMode}
            onChange={(event) => handleSortChange(event.target.value as GameSortMode)}
            className="bg-transparent text-on-surface outline-none"
          >
            <option value="popular">{t('按热门排序', 'Popular')}</option>
            <option value="newest">{t('最近更新优先', 'Newest')}</option>
            <option value="recent">{t('最近使用优先', 'Recently used')}</option>
            <option value="name">{t('按名称排序', 'Name')}</option>
          </select>
        </label>
      </div>

      {/* Category pills with sliding indicator */}
      <motion.div
        ref={pillContainerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex overflow-x-auto flex-nowrap sm:flex-wrap scrollbar-hide justify-center gap-4 mb-16 relative"
      >
        <motion.div
          className="absolute top-0 h-full bg-primary rounded-full shadow-lg shadow-primary/30 pointer-events-none"
          animate={{ left: pillLayout.left, width: pillLayout.width }}
          transition={springSmooth}
          style={{ zIndex: 0 }}
        />
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            onClick={() => handleCategorySwitch(cat.id)}
            aria-pressed={activeCategory === cat.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springSnappy}
            className={`shrink-0 px-8 py-3 min-h-[48px] rounded-full font-semibold text-sm relative z-[1] transition-colors duration-300 ${
              activeCategory === cat.id
                ? 'text-on-primary'
                : 'glass-pill text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            {cat.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Card grid with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`grid-${activeCategory}`}
          variants={gridContainerVariants}
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
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Gamepad2 className="w-16 h-16 text-secondary/30 mb-4" />
              </motion.div>
              <p className="font-medium text-lg">
                {t('没有找到相关游戏', 'No matching games found')}
              </p>
              <button
                onClick={() => {
                  setQuery('');
                  handleCategorySwitch('all');
                }}
                className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-bold text-on-primary"
              >
                {t('清除筛选', 'Clear filters')}
              </button>
            </motion.div>
          ) : (
            filteredGames.map((game) => (
              <motion.div
                key={game.id}
                variants={gridCardVariants}
                whileHover={{ y: -8, transition: springBouncy }}
                whileTap={{ scale: 0.97 }}
                className="glass-card rounded-3xl p-6 transition-all duration-500 hover-glow group"
              >
                {game.image ? (
                  <div className="w-full h-48 rounded-2xl overflow-hidden bg-surface-container-low flex items-center justify-center relative">
                    <img
                      src={game.image}
                      alt={game.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                  </div>
                ) : (
                  <div
                    className={`w-full h-48 rounded-2xl ${game.iconBg || 'bg-surface-container-low'} flex items-center justify-center text-6xl`}
                  >
                    {game.icon}
                  </div>
                )}
                <div className="flex items-start gap-4 mt-4">
                  <div
                    className={`w-16 h-16 rounded-2xl ${game.iconBg || 'bg-surface-container'} flex items-center justify-center shrink-0 shadow-inner group-hover:-translate-y-3 group-hover:rotate-12 group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all duration-500 text-2xl`}
                  >
                    {game.icon || <Gamepad2 className="text-primary w-8 h-8" />}
                  </div>
                  <div className="flex-grow">
                    <h2 className="font-nunito text-lg text-on-surface font-bold group-hover:text-primary transition-colors">
                      {t(game.title, game.titleEn)}
                    </h2>
                    <span className="inline-block px-3 py-1 rounded-full font-semibold text-[13px] backdrop-blur-sm bg-tertiary-container/30 text-on-tertiary-container">
                      {t(game.category, game.categoryEn)}
                    </span>
                  </div>
                </div>
                <p className="font-sans text-base text-on-surface-variant line-clamp-2 mt-3">
                  {t(game.description, game.descriptionEn)}
                </p>
                <div className="mt-auto pt-4 flex justify-between items-center">
                  <button
                    onClick={() => toggle(game.id)}
                    className={`p-2 min-h-[48px] min-w-[48px] rounded-full transition-all ${
                      favoriteIds.includes(game.id)
                        ? 'text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100'
                        : 'text-secondary/40 hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                    }`}
                    aria-label={
                      favoriteIds.includes(game.id)
                        ? t('取消收藏', 'Remove favorite')
                        : t('收藏', 'Add favorite')
                    }
                  >
                    <Heart
                      className={`w-5 h-5 ${favoriteIds.includes(game.id) ? 'fill-current' : ''}`}
                    />
                  </button>
                  <motion.button
                    onClick={() => handlePlay(game.id)}
                    whileHover={{ scale: 1.05, transition: springBouncy }}
                    whileTap={{ scale: 0.93 }}
                    className="py-4 px-8 rounded-xl btn-gradient text-on-primary font-semibold text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    {t('开始游戏', 'Play')}
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
