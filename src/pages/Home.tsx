import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
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
  Gamepad,
  Brain,
  GraduationCap,
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { tools } from '../data/tools';
import { games } from '../data/games';
import { getRecentItems } from '../lib/recent';
import { getNewItems } from '../lib/recommendations';
import SEO from '../components/SEO';

export default function Home() {
  const { t } = useUser();
  const navigate = useNavigate();

  // --- Data ---
  const recentItems = useMemo(() => getRecentItems(6), []);
  const newItems = useMemo(() => getNewItems(8), []);

  const featuredTools = useMemo(
    () =>
      tools
        .filter(item => item.featured)
        .sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0))
        .slice(0, 6),
    [],
  );

  const featuredGames = useMemo(
    () =>
      games
        .filter(item => item.featured)
        .sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0))
        .slice(0, 6),
    [],
  );

  // --- Category definitions ---
  const toolCategories = [
    { label: '学习写作', labelEn: 'Study & Writing', icon: BookOpen, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    { label: '时间效率', labelEn: 'Time & Efficiency', icon: Timer, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    { label: '开发辅助', labelEn: 'Developer Tools', icon: Code2, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { label: '日常实用', labelEn: 'Daily Utility', icon: Zap, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    { label: '安全隐私', labelEn: 'Security & Privacy', icon: Shield, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  ];

  const gameCategories = [
    { label: '反应挑战', labelEn: 'Action', icon: Zap, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    { label: '益智解谜', labelEn: 'Puzzle', icon: Brain, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
    { label: '学习练习', labelEn: 'Educational', icon: GraduationCap, color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  ];

  // --- Shared card component for featured items ---
  const FeaturedCard = ({
    item,
    index,
    actionLabel,
    accentClass,
  }: {
    item: { id: string; icon?: string; iconBg?: string; title: string; titleEn: string; description: string; descriptionEn: string; category: string; categoryEn?: string; route: string };
    index: number;
    actionLabel: string;
    accentClass: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      whileHover={{ y: -8, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
      whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 500, damping: 20 } }}
      onClick={() => navigate(item.route)}
      className="bg-white dark:bg-surface-container-high rounded-2xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_12px_40px_rgba(184,228,201,0.2)] transition-all duration-300 flex flex-col gap-4 border border-surface-variant/20 cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-xl ${item.iconBg || 'bg-surface-container'} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}
        >
          <span className="text-2xl">{item.icon}</span>
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`inline-flex items-center gap-2 px-5 py-2 ${accentClass} rounded-full font-bold text-sm shadow-sm hover:shadow-md transition-all`}
        >
          {actionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-grow">
      <SEO />

      {/* ========== 1. Hero Section ========== */}
      <section className="relative w-full pt-20 pb-16 sm:pt-32 sm:pb-24 px-6 flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-b from-[#E8F5EE] to-[#FFF9F2] dark:from-[#1a2c1f] dark:to-background">
        {/* Floating decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <motion.div
            animate={{ y: [0, -25, 0], x: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 left-[10%] opacity-40 text-primary-container"
          >
            <Cloud className="w-20 h-20 fill-primary-container" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 30, 0], x: [0, -15, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute top-40 right-[15%] opacity-30"
          >
            <Cloud className="w-24 h-24 fill-primary-container text-primary-container" />
          </motion.div>
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute top-[30%] left-[25%] opacity-60 text-tertiary-container"
          >
            <Flower2 className="w-10 h-10 fill-tertiary-container" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360, scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-[20%] right-[25%] opacity-50 text-tertiary-container"
          >
            <Flower2 className="w-12 h-12 fill-tertiary-container" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[10%] right-[30%] opacity-40 text-tertiary-container"
          >
            <Flower2 className="w-8 h-8 fill-tertiary-container" />
          </motion.div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="font-sans font-extrabold text-[clamp(2rem,5vw,3.5rem)] text-primary mb-3 tracking-tight"
          >
            Spring Nest
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-nunito text-2xl font-bold text-secondary mb-4"
          >
            {t('春日小筑', 'Spring Nest')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-nunito text-lg text-secondary/80 max-w-xl mx-auto mb-10"
          >
            {t('轻量实用工具与休闲小游戏合集', 'A curated collection of lightweight tools and casual games')}
          </motion.p>

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
                <motion.div
                  key={`${item.type}-${item.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(item.route)}
                  className="flex-shrink-0 w-44 bg-white dark:bg-surface-container-high rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_24px_rgba(184,228,201,0.15)] transition-all duration-300 cursor-pointer border border-surface-variant/20 flex flex-col items-center gap-3 text-center snap-start"
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
                </motion.div>
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
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(item.route)}
                  className="flex-shrink-0 w-48 bg-white dark:bg-surface-container-high rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_8px_24px_rgba(255,219,205,0.2)] transition-all duration-300 cursor-pointer border border-surface-variant/20 flex flex-col gap-3 snap-start"
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
                </motion.div>
              ))}
            </div>
          </section>
        )}

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
                    whileHover={{ scale: 1.08, y: -3, transition: { type: 'spring', stiffness: 500, damping: 15 } }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/tools')}
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
                    whileHover={{ scale: 1.08, y: -3, transition: { type: 'spring', stiffness: 500, damping: 15 } }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/games')}
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
