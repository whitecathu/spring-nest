import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import {
  Gamepad2,
  Wrench,
  ArrowRight,
  Flower2,
  Sparkles,
  Clock,
  Zap,
  BookOpen,
  Timer,
  Code2,
  FileText,
  Shield,
  Brain,
  GraduationCap,
  Search,
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useFavorites } from '../hooks/useFavorites';
import { tools as baseTools } from '../data/tools';
import { games as baseGames } from '../data/games';
import { useCatalogItems } from '../hooks/useCatalogOverrides';
import { getRecentItems } from '../lib/recent';
import { trackSearch } from '../lib/analytics';
import SEO from '../components/SEO';
import { websiteJsonLd } from '../lib/structuredData';
import CatalogItemCard from '../components/CatalogItemCard';
import { MagneticButton } from '../components/GsapSurface';
import { heroItemVariants, heroStageVariants, useReducedMotion } from '../lib/animations';
import GlassSurface from '../components/animations/GlassSurface';
import HomeHeroStage from '../components/animations/HomeHeroStage';
import ShinyText from '../components/animations/ShinyText';

export default function Home() {
  const { t } = useUser();
  const { favoriteIds, toggle } = useFavorites();
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');
  const reducedMotion = useReducedMotion();
  const tools = useCatalogItems(baseTools, 'tool', 'web');
  const games = useCatalogItems(baseGames, 'game', 'web');

  // --- Data ---
  const recentItems = useMemo(() => getRecentItems(6), []);
  const newItems = useMemo(
    () =>
      [...tools, ...games]
        .filter((item) => item.isNew)
        .sort((a, b) => {
          const aOrder = a.catalogSortOrder ?? Number.POSITIVE_INFINITY;
          const bOrder = b.catalogSortOrder ?? Number.POSITIVE_INFINITY;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (b.popularScore ?? 0) - (a.popularScore ?? 0);
        })
        .slice(0, 8),
    [games, tools],
  );
  const homeToolPreview = useMemo(
    () =>
      tools
        .filter((tool) => tool.isNew || tool.featured)
        .sort((a, b) => {
          const newDelta = Number(Boolean(b.isNew)) - Number(Boolean(a.isNew));
          if (newDelta) return newDelta;
          const aOrder = a.catalogSortOrder ?? Number.POSITIVE_INFINITY;
          const bOrder = b.catalogSortOrder ?? Number.POSITIVE_INFINITY;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (b.popularScore ?? 0) - (a.popularScore ?? 0);
        })
        .slice(0, 9),
    [tools],
  );

  const featuredTools = useMemo(
    () =>
      tools
        .filter((item) => item.featured)
        .sort((a, b) => {
          const aOrder = a.catalogSortOrder ?? Number.POSITIVE_INFINITY;
          const bOrder = b.catalogSortOrder ?? Number.POSITIVE_INFINITY;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (b.popularScore ?? 0) - (a.popularScore ?? 0);
        })
        .slice(0, 6),
    [tools],
  );

  const featuredGames = useMemo(
    () =>
      games
        .filter((item) => item.featured)
        .sort((a, b) => {
          const aOrder = a.catalogSortOrder ?? Number.POSITIVE_INFINITY;
          const bOrder = b.catalogSortOrder ?? Number.POSITIVE_INFINITY;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (b.popularScore ?? 0) - (a.popularScore ?? 0);
        })
        .slice(0, 6),
    [games],
  );

  // --- Category definitions ---
  const toolCategories = [
    {
      label: '日常实用',
      labelEn: 'Daily Utility',
      icon: Zap,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    },
    {
      label: '时间效率',
      labelEn: 'Time & Efficiency',
      icon: Timer,
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    },
    {
      label: '开发辅助',
      labelEn: 'Developer Tools',
      icon: Code2,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    },
    {
      label: '学习写作',
      labelEn: 'Study & Writing',
      icon: BookOpen,
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    {
      label: '文档转换',
      labelEn: 'Document Conversion',
      icon: FileText,
      color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    },
    {
      label: '安全隐私',
      labelEn: 'Security & Privacy',
      icon: Shield,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    },
    {
      label: '趣味工具',
      labelEn: 'Fun Tools',
      icon: Sparkles,
      color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    },
  ];

  const gameCategories = [
    {
      label: '反应挑战',
      labelEn: 'Action',
      icon: Zap,
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    },
    {
      label: '益智解谜',
      labelEn: 'Puzzle',
      icon: Brain,
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    },
    {
      label: '学习练习',
      labelEn: 'Educational',
      icon: GraduationCap,
      color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    },
  ];

  const handleHeroSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = heroQuery.trim();
    if (!query) return;
    trackSearch(query);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex-grow">
      <SEO
        title={t(
          '免费在线实用工具与休闲小游戏合集 - Spring Nest 春日小筑',
          'Free Online Tools and Casual Games - Spring Nest',
        )}
        description={t(
          '春日小筑提供免费、轻量、无需登录、即开即用的在线实用工具与休闲小游戏，支持搜索、收藏、最近使用和本地隐私存储。',
          'Spring Nest offers free, lightweight online tools and casual games with search, favorites, recent items, and local-first privacy.',
        )}
        canonical="/"
        jsonLd={websiteJsonLd()}
      />

      {/* ========== 1. Hero Section ========== */}
      <section
        data-forest-terrain="hero"
        className="relative flex min-h-[520px] w-full flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-20 text-center sm:min-h-[560px] sm:pb-24 sm:pt-32 lg:min-h-[620px]"
      >
        <HomeHeroStage toolsCount={tools.length} gamesCount={games.length} />

        <div
          className="relative z-10 flex w-full max-w-5xl flex-col items-center forest-readable-hero"
        >
          <p
            className="font-nunito text-base font-bold text-primary mb-3 tracking-wide"
          >
            <ShinyText
              text="Spring Nest"
              speed={4}
              shineColor="var(--color-primary-container)"
              color="var(--color-primary)"
            />
          </p>
          <h1
            className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl forest-page-title mb-4 tracking-tight max-w-4xl"
          >
            {t('免费在线实用工具与休闲小游戏合集', 'Free Online Tools and Casual Games')}
          </h1>
          <p
            className="font-nunito text-lg forest-page-subtitle max-w-2xl mx-auto mb-8"
          >
            {t(
              '免费、轻量、无需登录、即开即用。搜索工具、小游戏、描述或标签，快速打开你需要的内容。',
              'Free, lightweight, no sign-in required, ready on open. Search tools, games, descriptions, or tags and jump straight in.',
            )}
          </p>

          <form
            onSubmit={handleHeroSearch}
            className="mb-8 w-full min-w-0 self-stretch sm:min-w-[40rem]"
            role="search"
          >
            <label htmlFor="home-search" className="sr-only">
              {t('搜索工具和小游戏', 'Search tools and games')}
            </label>
            <GlassSurface
              borderRadius={16}
              brightness={60}
              opacity={0.95}
              blur={14}
              className="block w-full"
            >
              <div className="flex w-full items-center gap-2 rounded-2xl border border-primary/20 bg-white/90 dark:bg-surface-container-high/90 p-2 shadow-[0_12px_36px_rgba(63,103,81,0.12)]">
                <Search className="ml-3 h-5 w-5 shrink-0 text-primary" />
                <input
                  id="home-search"
                  type="search"
                  value={heroQuery}
                  onChange={(event) => setHeroQuery(event.target.value)}
                  placeholder={t(
                    '搜索计算器、2048、JSON…',
                    'Search calculator, 2048, JSON…',
                  )}
                  className="min-h-[48px] min-w-0 flex-1 bg-transparent px-2 text-base text-on-surface outline-none placeholder:text-secondary/60"
                />
                <button
                  type="submit"
                  className="min-h-[48px] shrink-0 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
                  disabled={!heroQuery.trim()}
                >
                  {t('搜索', 'Search')}
                </button>
              </div>
            </GlassSurface>
          </form>

          <div className="flex w-auto max-w-md flex-col gap-4 sm:flex-row sm:max-w-none">
            <MagneticButton
              onClick={() => navigate('/tools')}
              className="bg-primary text-on-primary font-bold text-base py-3.5 px-8 rounded-2xl shadow-[0_6px_16px_rgba(63,103,81,0.3)] hover:shadow-[0_10px_24px_rgba(63,103,81,0.45)] transition-all duration-300 flex items-center justify-center gap-2.5"
            >
              <Wrench className="w-5 h-5" />
              {t('开始使用工具', 'Explore Tools')}
            </MagneticButton>
            <MagneticButton
              onClick={() => navigate('/games')}
              className="bg-white text-primary font-bold text-base py-3.5 px-8 rounded-2xl shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_24px_rgba(184,228,201,0.4)] dark:bg-surface-container dark:hover:shadow-[0_10px_24px_rgba(47,67,55,0.4)] transition-all duration-300 flex items-center justify-center gap-2.5 border border-primary-container/30"
            >
              <Gamepad2 className="w-5 h-5" />
              {t('玩个小游戏', 'Play a Game')}
            </MagneticButton>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-6">
        {/* ========== 2. Recent Usage ========== */}
        {recentItems.length > 0 && (
          <section className="py-12" data-forest-terrain="cards">
            <div
              className="flex items-center gap-3 mb-6"
            >
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-nunito font-bold text-xl text-on-surface drop-shadow-[0_1px_10px_rgba(255,249,242,0.85)]">
                {t('最近使用', 'Recent')}
              </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
              {recentItems.map((item, i) => (
                <article
                  key={`${item.type}-${item.id}`}
                  className="flex-shrink-0 w-44 snap-start"
                >
                  <Link
                    to={item.route}
                    className="min-h-[150px] bg-white dark:bg-surface-container-high rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_24px_rgba(184,228,201,0.15)] transition-all duration-300 border border-surface-variant/20 flex flex-col items-center gap-3 text-center"
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span className="font-semibold text-sm text-on-surface truncate w-full">
                      {t(item.title, item.titleEn)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.type === 'tool'
                          ? 'bg-primary-container/40 text-on-primary-container'
                          : 'bg-tertiary-container/40 text-on-tertiary-container'
                      }`}
                    >
                      {item.type === 'tool' ? t('工具', 'Tool') : t('游戏', 'Game')}
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ========== 3. Featured Tools ========== */}
        <section className="py-12" data-forest-terrain="cards">
          <div
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <Flower2 className="w-5 h-5 text-primary fill-primary" />
              <h2 className="font-nunito font-bold text-2xl text-on-surface">
                {t('推荐工具', 'Featured Tools')}
              </h2>
            </div>
            <button
              onClick={() => navigate('/tools')}
              className="flex items-center gap-1.5 text-primary font-semibold text-sm hover:underline"
            >
              {t('查看全部', 'View All')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        </section>

        {/* ========== 4. Featured Games ========== */}
        <section className="py-12" data-forest-terrain="cards">
          <div
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-tertiary fill-tertiary" />
              <h2 className="font-nunito font-bold text-2xl text-on-surface">
                {t('推荐游戏', 'Featured Games')}
              </h2>
            </div>
            <button
              onClick={() => navigate('/games')}
              className="flex items-center gap-1.5 text-primary font-semibold text-sm hover:underline"
            >
              {t('查看全部', 'View All')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        </section>

        {/* ========== 5. New Items ========== */}
        {newItems.length > 0 && (
          <section className="py-12" data-forest-terrain="cards">
            <div
              className="flex items-center gap-3 mb-6"
            >
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="font-nunito font-bold text-xl text-on-surface">
                {t('新上线', 'New')}
              </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
              {newItems.map((item, i) => (
                <article
                  key={item.id}
                  className="flex-shrink-0 w-48 snap-start"
                >
                  <Link
                    to={item.route}
                    className="min-h-[88px] bg-white dark:bg-surface-container-high rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_24px_rgba(255,219,205,0.2)] transition-all duration-300 border border-surface-variant/20 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-on-surface truncate">
                            {t(item.title, item.titleEn)}
                          </span>
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
                            {t('新', 'NEW')}
                          </span>
                        </div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.type === 'tool'
                              ? 'bg-primary-container/40 text-on-primary-container'
                              : 'bg-tertiary-container/40 text-on-tertiary-container'
                          }`}
                        >
                          {item.type === 'tool' ? t('工具', 'Tool') : t('游戏', 'Game')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ========== 5b. All Tools ========== */}
        <section className="py-12" data-forest-terrain="cards">
          <div
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="font-nunito font-bold text-2xl text-on-surface">
                {t('全部工具', 'All Tools')}
              </h2>
              <p className="mt-1 text-sm text-secondary">
                {t(
                  '覆盖计算、时间、文本、随机、安全与开发辅助。',
                  'Calculators, time, text, random, security, and developer utilities.',
                )}
              </p>
            </div>
            <Link
              to="/tools"
              className="inline-flex min-h-[48px] items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {t('查看全部', 'View all')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        </section>

        {/* ========== 5c. All Games ========== */}
        <section className="py-12" data-forest-terrain="cards">
          <div
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="font-nunito font-bold text-2xl text-on-surface">
                {t('全部小游戏', 'All Games')}
              </h2>
              <p className="mt-1 text-sm text-secondary">
                {t(
                  '益智解谜、反应挑战、学习练习和经典休闲玩法。',
                  'Puzzle, action, educational, and classic casual games.',
                )}
              </p>
            </div>
            <Link
              to="/games"
              className="inline-flex min-h-[48px] items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {t('查看全部', 'View all')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>
        </section>

        {/* ========== 6. Why Spring Nest ========== */}
        <section className="py-12" data-forest-terrain="cards">
          <div
            className="mb-8"
          >
            <h2 className="font-nunito font-bold text-2xl text-on-surface mb-2">
              {t('为什么选择春日小筑', 'Why Spring Nest')}
            </h2>
            <p className="text-sm text-secondary">
              {t(
                '把常用工具和轻松游戏放在同一个安静入口，减少跳转和账号负担。',
                'One calm place for everyday utilities and casual breaks, without extra accounts or noisy setup.',
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr] gap-4">
            {[
              {
                icon: Shield,
                title: t('隐私优先', 'Privacy first'),
                text: t(
                  '收藏、最近使用和大多数分数只保存在浏览器本地。工具输入默认不上传服务器。',
                  'Favorites, recent items, and most scores stay in local browser storage. Tool inputs are not uploaded by default.',
                ),
              },
              {
                icon: Zap,
                title: t('即开即用', 'Open and use'),
                text: t(
                  '无需登录即可使用核心工具和小游戏，登录不是完成任务的前提。',
                  'Core tools and games work without sign-in. Accounts are not required to finish a task.',
                ),
              },
              {
                icon: Search,
                title: t('快速找到', 'Fast to find'),
                text: t(
                  '可按名称、说明、标签和分类搜索，适合重复打开常用功能。',
                  'Search by name, description, tag, and category for repeat access.',
                ),
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5"
                >
                  <Icon className="mb-4 h-6 w-6 text-primary" />
                  <h3 className="mb-2 font-nunito text-lg font-bold text-on-surface">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-secondary">{item.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ========== 6. Category Quick Links ========== */}
        <section className="py-12 pb-20">
          <div
            className="mb-10"
          >
            <h2 className="font-nunito font-bold text-2xl text-on-surface mb-2">
              {t('分类入口', 'Browse by Category')}
            </h2>
            <p className="text-sm text-secondary">
              {t('快速找到你需要的工具或想玩的游戏', 'Quickly find the tool or game you need')}
            </p>
          </div>

          {/* Tool categories */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-on-surface-variant uppercase tracking-wide">
                {t('工具分类', 'Tool Categories')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {toolCategories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.label}
                    onClick={() => {
                      const routeMap: Record<string, string> = {
                        日常实用: '/tools/daily',
                        时间效率: '/tools/time',
                        开发辅助: '/tools/dev',
                        学习写作: '/tools/study',
                        文档转换: '/tools/document',
                        安全隐私: '/tools/security',
                        趣味工具: '/tools/random',
                      };
                      navigate(routeMap[cat.label] ?? '/tools');
                    }}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-300 ${cat.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(cat.label, cat.labelEn)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game categories */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="w-4 h-4 text-tertiary" />
              <h3 className="font-semibold text-sm text-on-surface-variant uppercase tracking-wide">
                {t('游戏分类', 'Game Categories')}
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {gameCategories.map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.label}
                    onClick={() => navigate(`/games?category=${encodeURIComponent(cat.label)}`)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-300 ${cat.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(cat.label, cat.labelEn)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
