import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  Gamepad2,
  Wrench,
  ArrowRight,
  Cloud,
  Flower2,
  Sparkles,
  Clock,
  Zap,
  BookOpen,
  Timer,
  Code2,
  Shield,
  Brain,
  GraduationCap,
  Search,
  Heart,
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useFavorites } from '../hooks/useFavorites';
import { tools } from '../data/tools';
import { games } from '../data/games';
import { getRecentItems } from '../lib/recent';
import { getNewItems } from '../lib/recommendations';
import { trackSearch } from '../lib/analytics';
import SEO from '../components/SEO';
import { websiteJsonLd } from '../lib/structuredData';

// --- Shared card component for featured items (extracted for stable identity) ---
function FeaturedCard({
  item,
  index,
  actionLabel,
  accentClass,
  favoriteIds,
  onFavorite,
  t,
}: {
  item: {
    id: string;
    icon?: string;
    iconBg?: string;
    title: string;
    titleEn: string;
    description: string;
    descriptionEn: string;
    category: string;
    categoryEn?: string;
    route: string;
  };
  index: number;
  actionLabel: string;
  accentClass: string;
  favoriteIds: string[];
  onFavorite: (id: string) => void;
  t: (zh: string, en: string) => string;
}) {
  const isFavorite = favoriteIds.includes(item.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      whileHover={{
        y: -10,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 15 },
      }}
      whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 500, damping: 20 } }}
      className="bg-white dark:bg-surface-container-high rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_12px_40px_rgba(184,228,201,0.2)] transition-all duration-300 flex flex-col gap-4 border border-surface-variant/20 hover:border-primary/20 group relative overflow-hidden"
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(184,228,201,0.15), rgba(255,208,189,0.1))',
        }}
      />
      <button
        type="button"
        onClick={() => onFavorite(item.id)}
        className={`absolute right-4 top-4 z-[1] flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
          isFavorite
            ? 'bg-red-50 text-red-500 dark:bg-red-900/20'
            : 'bg-white/70 text-secondary hover:bg-red-50 hover:text-red-500 dark:bg-surface-container/70'
        }`}
        aria-label={isFavorite ? t('取消收藏', 'Remove favorite') : t('收藏', 'Add favorite')}
      >
        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
      </button>
      <Link
        to={item.route}
        className="relative z-0 flex flex-1 flex-col gap-4"
        aria-label={t(`打开${item.title}`, `Open ${item.titleEn}`)}
      >
        <div className="flex items-start gap-4 pr-10">
          <div
            className={`w-14 h-14 rounded-xl ${item.iconBg || 'bg-surface-container'} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}
          >
            <span className="text-2xl" aria-hidden="true">
              {item.icon}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-nunito font-bold text-lg text-on-surface group-hover:text-primary transition-colors truncate">
              {t(item.title, item.titleEn)}
            </h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/40 text-on-primary-container">
              {item.categoryEn ? t(item.category, item.categoryEn) : item.category}
            </span>
          </div>
        </div>
        <p className="text-sm text-secondary line-clamp-2 leading-relaxed">
          {t(item.description, item.descriptionEn)}
        </p>
        <div className="mt-auto pt-2">
          <span
            className={`inline-flex items-center gap-2 px-5 py-2 ${accentClass} rounded-full font-bold text-sm shadow-sm group-hover:shadow-md transition-all`}
          >
            {actionLabel}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export default function Home() {
  const { t } = useUser();
  const { favoriteIds, toggle } = useFavorites();
  const navigate = useNavigate();
  const [heroQuery, setHeroQuery] = useState('');

  // Parallax for hero clouds
  const { scrollY } = useScroll();
  const cloudY1 = useTransform(scrollY, [0, 500], [0, -60]);
  const cloudY2 = useTransform(scrollY, [0, 500], [0, -40]);

  // --- Data ---
  const recentItems = useMemo(() => getRecentItems(6), []);
  const newItems = useMemo(() => getNewItems(8), []);

  const featuredTools = useMemo(
    () =>
      tools
        .filter((item) => item.featured)
        .sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0))
        .slice(0, 6),
    [],
  );

  const featuredGames = useMemo(
    () =>
      games
        .filter((item) => item.featured)
        .sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0))
        .slice(0, 6),
    [],
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
      <section className="relative w-full pt-20 pb-16 sm:pt-32 sm:pb-24 px-6 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#E8F5EE] to-[#FFF9F2] dark:from-[#1a2c1f] dark:to-background">
        {/* Floating decorations */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden z-0"
          style={{ willChange: 'transform' }}
        >
          <motion.div
            style={{ y: cloudY1 }}
            className="absolute top-20 left-[10%] opacity-40 text-primary-container"
          >
            <motion.div
              animate={{ y: [0, -25, 0], x: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Cloud className="w-20 h-20 fill-primary-container" />
            </motion.div>
          </motion.div>
          <motion.div style={{ y: cloudY2 }} className="absolute top-40 right-[15%] opacity-30">
            <motion.div
              animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <Cloud className="w-24 h-24 fill-primary-container text-primary-container" />
            </motion.div>
          </motion.div>
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute top-[30%] left-[25%] opacity-60 text-tertiary-container"
            style={{ willChange: 'transform' }}
          >
            <Flower2 className="w-10 h-10 fill-tertiary-container" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360, scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-[20%] right-[25%] opacity-50 text-tertiary-container"
            style={{ willChange: 'transform' }}
          >
            <Flower2 className="w-12 h-12 fill-tertiary-container" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[10%] right-[30%] opacity-40 text-tertiary-container"
            style={{ willChange: 'transform' }}
          >
            <Flower2 className="w-8 h-8 fill-tertiary-container" />
          </motion.div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.p
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="font-nunito text-base font-bold text-primary mb-3 tracking-wide"
          >
            Spring Nest
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-sans font-extrabold text-3xl sm:text-4xl lg:text-5xl text-primary mb-4 tracking-tight max-w-4xl"
          >
            {t('免费在线实用工具与休闲小游戏合集', 'Free Online Tools and Casual Games')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-nunito text-lg text-secondary/80 max-w-2xl mx-auto mb-8"
          >
            {t(
              '免费、轻量、无需登录、即开即用。搜索工具、小游戏、描述或标签，快速打开你需要的内容。',
              'Free, lightweight, no sign-in required, ready on open. Search tools, games, descriptions, or tags and jump straight in.',
            )}
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            onSubmit={handleHeroSearch}
            className="w-full max-w-2xl mb-8"
            role="search"
          >
            <label htmlFor="home-search" className="sr-only">
              {t('搜索工具和小游戏', 'Search tools and games')}
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-white/90 dark:bg-surface-container-high/90 p-2 shadow-[0_12px_36px_rgba(63,103,81,0.12)]">
              <Search className="ml-3 h-5 w-5 shrink-0 text-primary" />
              <input
                id="home-search"
                type="search"
                value={heroQuery}
                onChange={(event) => setHeroQuery(event.target.value)}
                placeholder={t(
                  '搜索计算器、2048、JSON、随机...',
                  'Search calculator, 2048, JSON, random...',
                )}
                className="min-h-[48px] flex-1 bg-transparent px-2 text-base text-on-surface outline-none placeholder:text-secondary/60"
              />
              <button
                type="submit"
                className="min-h-[48px] rounded-xl bg-primary px-5 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={!heroQuery.trim()}
              >
                {t('搜索', 'Search')}
              </button>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/tools')}
              className="bg-primary text-on-primary font-bold text-base py-3.5 px-8 rounded-2xl shadow-[0_6px_16px_rgba(63,103,81,0.3)] hover:shadow-[0_10px_24px_rgba(63,103,81,0.45)] transition-all duration-300 flex items-center justify-center gap-2.5"
            >
              <Wrench className="w-5 h-5" />
              {t('开始使用工具', 'Explore Tools')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/games')}
              className="bg-white text-primary font-bold text-base py-3.5 px-8 rounded-2xl shadow-[0_6px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_24px_rgba(184,228,201,0.4)] dark:bg-surface-container dark:hover:shadow-[0_10px_24px_rgba(47,67,55,0.4)] transition-all duration-300 flex items-center justify-center gap-2.5 border border-primary-container/30"
            >
              <Gamepad2 className="w-5 h-5" />
              {t('玩个小游戏', 'Play a Game')}
            </motion.button>
          </motion.div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-6">
        {/* ========== 2. Recent Usage ========== */}
        {recentItems.length > 0 && (
          <section className="py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-6"
            >
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="font-nunito font-bold text-xl text-on-surface">
                {t('最近使用', 'Recent')}
              </h2>
            </motion.div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
              {recentItems.map((item, i) => (
                <motion.article
                  key={`${item.type}-${item.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
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
                </motion.article>
              ))}
            </div>
          </section>
        )}

        {/* ========== 3. Featured Tools ========== */}
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <Flower2 className="w-5 h-5 text-primary fill-primary" />
              <h2 className="font-nunito font-bold text-2xl text-on-surface">
                {t('推荐工具', 'Featured Tools')}
              </h2>
            </div>
            <motion.button
              whileHover={{ x: 6, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
              onClick={() => navigate('/tools')}
              className="flex items-center gap-1.5 text-primary font-semibold text-sm hover:underline"
            >
              {t('查看全部', 'View All')}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool, i) => (
              <FeaturedCard
                key={tool.id}
                item={tool}
                index={i}
                actionLabel={t('打开工具', 'Open Tool')}
                accentClass="bg-primary-container text-on-primary-container"
                favoriteIds={favoriteIds}
                onFavorite={toggle}
                t={t}
              />
            ))}
          </div>
        </section>

        {/* ========== 4. Featured Games ========== */}
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-tertiary fill-tertiary" />
              <h2 className="font-nunito font-bold text-2xl text-on-surface">
                {t('推荐游戏', 'Featured Games')}
              </h2>
            </div>
            <motion.button
              whileHover={{ x: 6, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
              onClick={() => navigate('/games')}
              className="flex items-center gap-1.5 text-primary font-semibold text-sm hover:underline"
            >
              {t('查看全部', 'View All')}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGames.map((game, i) => (
              <FeaturedCard
                key={game.id}
                item={game}
                index={i}
                actionLabel={t('开始游戏', 'Play')}
                accentClass="bg-tertiary-container text-on-tertiary-container"
                favoriteIds={favoriteIds}
                onFavorite={toggle}
                t={t}
              />
            ))}
          </div>
        </section>

        {/* ========== 5. New Items ========== */}
        {newItems.length > 0 && (
          <section className="py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 mb-6"
            >
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="font-nunito font-bold text-xl text-on-surface">
                {t('新上线', 'New')}
              </h2>
            </motion.div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
              {newItems.map((item, i) => (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
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
                </motion.article>
              ))}
            </div>
          </section>
        )}

        {/* ========== 5b. All Tools ========== */}
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
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
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.slice(0, 9).map((tool, i) => (
              <FeaturedCard
                key={tool.id}
                item={tool}
                index={i}
                actionLabel={t('立即使用', 'Use now')}
                accentClass="bg-primary-container text-on-primary-container"
                favoriteIds={favoriteIds}
                onFavorite={toggle}
                t={t}
              />
            ))}
          </div>
        </section>

        {/* ========== 5c. All Games ========== */}
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
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
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.slice(0, 9).map((game, i) => (
              <FeaturedCard
                key={game.id}
                item={game}
                index={i}
                actionLabel={t('开始游戏', 'Play')}
                accentClass="bg-tertiary-container text-on-tertiary-container"
                favoriteIds={favoriteIds}
                onFavorite={toggle}
                t={t}
              />
            ))}
          </div>
        </section>

        {/* ========== 6. Why Spring Nest ========== */}
        <section className="py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
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
          </motion.div>
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
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5"
                >
                  <Icon className="mb-4 h-6 w-6 text-primary" />
                  <h3 className="mb-2 font-nunito text-lg font-bold text-on-surface">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-secondary">{item.text}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* ========== 6. Category Quick Links ========== */}
        <section className="py-12 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="font-nunito font-bold text-2xl text-on-surface mb-2">
              {t('分类入口', 'Browse by Category')}
            </h2>
            <p className="text-sm text-secondary">
              {t('快速找到你需要的工具或想玩的游戏', 'Quickly find the tool or game you need')}
            </p>
          </motion.div>

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
                  <motion.button
                    key={cat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    whileHover={{
                      scale: 1.08,
                      y: -3,
                      transition: { type: 'spring', stiffness: 500, damping: 15 },
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/tools?category=${encodeURIComponent(cat.label)}`)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-300 ${cat.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(cat.label, cat.labelEn)}
                  </motion.button>
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
                  <motion.button
                    key={cat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    whileHover={{
                      scale: 1.08,
                      y: -3,
                      transition: { type: 'spring', stiffness: 500, damping: 15 },
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/games?category=${encodeURIComponent(cat.label)}`)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-300 ${cat.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(cat.label, cat.labelEn)}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
