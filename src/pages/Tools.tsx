import {
  ArrowLeft,
  ArrowUpDown,
  BookOpen,
  Heart,
  Info,
  Play,
  Search,
  Shield,
  Wrench,
} from 'lucide-react';
import { useState, useMemo, Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { useFavorites } from '../hooks/useFavorites';
import { tools } from '../data/tools';
import SEO from '../components/SEO';
import { trackToolOpen } from '../lib/analytics';
import { getRecentItems, recordVisit } from '../lib/recent';
import {
  springSmooth,
  springBouncy,
  springSnappy,
  gridContainerVariants,
  gridCardVariants,
} from '../lib/animations';
import GameToolLoading from '../components/GameToolLoading';
import { getPrimaryToolCategorySlug, getToolCategoryBySlug } from '../lib/catalogRoutes';
import { collectionJsonLd, faqJsonLd, itemJsonLd } from '../lib/structuredData';
import type { AppItem } from '../types/app';
import { toolComponents } from '../registries/toolRegistry';

const toolsWithInternalH1 = new Set([
  'tool-12',
  'tool-21',
  'tool-22',
  'tool-23',
  'tool-24',
  'tool-25',
]);

type SortMode = 'popular' | 'newest' | 'name' | 'recent';

const sortModes = new Set<SortMode>(['popular', 'newest', 'name', 'recent']);

function getValidSortMode(value: string | null): SortMode {
  return value && sortModes.has(value as SortMode) ? (value as SortMode) : 'popular';
}

function getValidCategory(value: string | null, categories: string[]) {
  if (!value || value === 'all') return 'all';
  return categories.includes(value) ? value : 'all';
}

function matchesCatalogQuery(item: AppItem, query: string) {
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

function getToolFaq(item: AppItem, t: (zh: string, en: string) => string) {
  if (item.faq?.length) {
    return item.faq.map((entry) => ({
      q: t(entry.q, entry.qEn ?? entry.q),
      a: t(entry.a, entry.aEn ?? entry.a),
    }));
  }

  return [
    {
      q: t('这个工具会上传输入内容吗？', 'Does this tool upload my input?'),
      a: t(
        '不会。除天气、IP 查询等明确需要联网的工具外，输入内容默认只在浏览器本地处理。',
        'No. Except tools that clearly need the network, such as weather or IP lookup, inputs are processed locally in your browser.',
      ),
    },
    {
      q: t('是否需要登录？', 'Do I need to sign in?'),
      a: t(
        '不需要。核心功能可以直接使用，收藏和最近使用会保存在本地浏览器。',
        'No. Core features work immediately, while favorites and recent items are saved in local browser storage.',
      ),
    },
  ];
}

export default function Tools() {
  const { t } = useUser();
  const { favoriteIds, toggle } = useFavorites();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryRoute = getToolCategoryBySlug(slug);
  const [query, setQuery] = useState('');
  const pillContainerRef = useRef<HTMLDivElement>(null);
  const [pillLayout, setPillLayout] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const categories = useMemo(() => {
    const cats = [...new Set(tools.map((t) => t.category))];
    return [
      { id: 'all', label: t('全部工具', 'All Tools') },
      ...cats.map((c) => {
        const tool = tools.find((tl) => tl.category === c);
        return { id: c, label: t(c, tool?.categoryEn || c) };
      }),
    ];
  }, [t]);

  const categoryIds = useMemo(() => categories.map((cat) => cat.id), [categories]);
  const queryCategory = getValidCategory(searchParams.get('category'), categoryIds);
  const activeCategory =
    queryCategory !== 'all' ? queryCategory : (categoryRoute?.category ?? 'all');
  const sortMode = getValidSortMode(searchParams.get('sort'));

  const handleCategorySwitch = (catId: string) => {
    if (catId === activeCategory) return;
    const params = new URLSearchParams();
    if (sortMode !== 'popular') params.set('sort', sortMode);

    if (catId === 'all') {
      navigate({ pathname: '/tools', search: params.toString() ? `?${params}` : '' });
    } else {
      const canonicalSlug = getPrimaryToolCategorySlug(catId);
      if (canonicalSlug) {
        navigate({
          pathname: `/tools/${canonicalSlug}`,
          search: params.toString() ? `?${params}` : '',
        });
      } else {
        params.set('category', catId);
        navigate({ pathname: '/tools', search: `?${params}` });
      }
    }

    requestAnimationFrame(() => {
      const container = pillContainerRef.current;
      if (!container) return;
      const activePill = container.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      activePill?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    });
  };

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

  const activeToolBySlug = useMemo(() => {
    if (!slug || categoryRoute) return null;
    return tools.find((tl) => tl.route.endsWith(`/${slug}`)) || null;
  }, [slug, categoryRoute]);

  const [internalToolId, setInternalToolId] = useState<string | null>(null);

  const activeToolId = activeToolBySlug?.id || internalToolId;

  useEffect(() => {
    if (slug && activeToolBySlug) {
      setInternalToolId(activeToolBySlug.id);
    } else if (!slug || categoryRoute) {
      setInternalToolId(null);
    }
  }, [slug, activeToolBySlug, categoryRoute]);

  useEffect(() => {
    if (slug && !categoryRoute && !activeToolBySlug) navigate('/tools', { replace: true });
  }, [slug, categoryRoute, activeToolBySlug, navigate]);

  const filteredTools = useMemo(() => {
    const recentOrder = new Map(
      getRecentItems(20)
        .filter((item) => item.type === 'tool')
        .map((item, index) => [item.id, index]),
    );
    const byCategory =
      activeCategory === 'all' ? tools : tools.filter((tool) => tool.category === activeCategory);
    const byQuery = byCategory.filter((tool) => matchesCatalogQuery(tool, query));

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

  const activeTool = useMemo(
    () => tools.find((t) => t.id === activeToolId) || null,
    [activeToolId],
  );
  const activeToolFeatures = useMemo(
    () =>
      activeTool?.features?.map((feature, index) =>
        t(feature, activeTool.featuresEn?.[index] ?? feature),
      ) ?? [],
    [activeTool, t],
  );

  const handleOpen = (toolId: string) => {
    const tool = tools.find((t) => t.id === toolId);
    if (tool) {
      const toolSlug = tool.route.split('/').pop();
      navigate(`/tools/${toolSlug}`);
    }
  };

  const handleBack = () => {
    navigate('/tools');
  };

  const handleSortChange = (nextSort: SortMode) => {
    const params = new URLSearchParams(searchParams);
    params.delete('category');
    if (nextSort === 'popular') params.delete('sort');
    else params.set('sort', nextSort);
    setSearchParams(params, { replace: false });
  };

  useEffect(() => {
    if (activeTool) {
      trackToolOpen(activeTool.id);
      recordVisit('tool', activeTool.id);
    }
  }, [activeTool]);

  if (activeTool && toolComponents[activeTool.id]) {
    const ToolComponent = toolComponents[activeTool.id];
    const faq = getToolFaq(activeTool, t);
    const relatedTools = tools.filter((tool) => activeTool.related?.includes(tool.id)).slice(0, 3);
    const jsonLd = [itemJsonLd(activeTool), faqJsonLd(faq)];

    return (
      <Suspense fallback={<GameToolLoading />}>
        <SEO
          title={`${t(activeTool.title, activeTool.titleEn)} - Spring Nest 春日小筑`}
          description={t(activeTool.description, activeTool.descriptionEn)}
          canonical={activeTool.route}
          type="website"
          jsonLd={jsonLd}
        />
        <article className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-8">
          <Link
            to="/tools"
            className="mb-5 inline-flex min-h-[48px] items-center gap-2 text-sm font-semibold text-secondary hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('返回工具列表', 'Back to tools')}
          </Link>
          <header className="mb-6 rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-primary">
              <span className="rounded-full bg-primary-container/40 px-3 py-1 text-on-primary-container">
                {t(activeTool.category, activeTool.categoryEn)}
              </span>
              <span className="rounded-full bg-surface-container px-3 py-1 text-secondary">
                {t('免费使用', 'Free to use')}
              </span>
            </div>
            {toolsWithInternalH1.has(activeTool.id) ? (
              <p className="mb-3 text-3xl font-black tracking-tight text-on-surface sm:text-4xl">
                {t(activeTool.title, activeTool.titleEn)}
              </p>
            ) : (
              <h1 className="mb-3 text-3xl font-black tracking-tight text-on-surface sm:text-4xl">
                {t(activeTool.title, activeTool.titleEn)}
              </h1>
            )}
            <p className="max-w-3xl text-base leading-relaxed text-secondary">
              {t(activeTool.description, activeTool.descriptionEn)}
            </p>
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-primary-container/20 p-3 text-sm leading-relaxed text-on-surface-variant">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {t(
                '隐私提示：输入内容不会上传服务器，除非该工具明确说明需要联网功能。',
                'Privacy note: your input is not uploaded to a server unless this tool clearly states that network access is required.',
              )}
            </p>
          </header>

          <section aria-label={t('主功能区域', 'Main tool area')}>
            <ToolComponent onBack={handleBack} />
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-on-surface">
                <Info className="h-5 w-5 text-primary" />
                {t('使用方法', 'How to use')}
              </h2>
              <p className="leading-relaxed text-secondary">
                {t(
                  activeTool.instructions ||
                    '打开工具后按页面提示输入或选择内容，结果会在浏览器本地即时生成。',
                  activeTool.instructionsEn ||
                    'Open the tool, enter or select values as prompted, and results will be generated locally in your browser.',
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5">
              <h2 className="mb-3 text-xl font-bold text-on-surface">
                {t('适用场景', 'Best for')}
              </h2>
              <ul className="space-y-2 text-sm leading-relaxed text-secondary">
                {activeToolFeatures.slice(0, 4).map((feature, index) => (
                  <li key={feature} className="flex gap-2">
                    <span className="font-bold text-primary">{index + 1}.</span>
                    {feature}
                  </li>
                ))}
              </ul>
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

          {relatedTools.length > 0 && (
            <section className="mt-6 rounded-2xl border border-surface-variant/30 bg-white/80 dark:bg-surface-container-high/70 p-5">
              <h2 className="mb-4 text-xl font-bold text-on-surface">
                {t('相关工具', 'Related tools')}
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {relatedTools.map((tool) => (
                  <Link
                    key={tool.id}
                    to={tool.route}
                    className="rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-primary-container/20"
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {tool.icon}
                    </span>
                    <h3 className="mt-2 font-bold text-on-surface">
                      {t(tool.title, tool.titleEn)}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-secondary">
                      {t(tool.description, tool.descriptionEn)}
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

  if (activeTool) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center py-20">
        <p className="text-xl text-secondary mb-4">
          {t('此工具正在开发中，敬请期待', 'This tool is under development. Stay tuned.')}
        </p>
        <button
          onClick={handleBack}
          className="px-6 py-3 bg-primary text-on-primary rounded-full font-semibold min-h-[48px]"
        >
          {t('返回工具列表', 'Back to Tools')}
        </button>
      </div>
    );
  }

  const pageTitle = categoryRoute
    ? `${t(categoryRoute.label, categoryRoute.labelEn)} - Spring Nest 春日小筑`
    : t('在线实用工具合集 - Spring Nest 春日小筑', 'Online Tools Collection - Spring Nest');
  const pageDescription = categoryRoute
    ? t(
        `${categoryRoute.label}收录春日小筑中可直接打开的相关工具，支持搜索、收藏和最近使用。`,
        `${categoryRoute.labelEn} collects related Spring Nest tools with search, favorites, and recent access.`,
      )
    : t(
        'Spring Nest 提供计算器、番茄钟、单位换算、密码生成器、文本处理、随机工具等在线工具，免费、轻量、无需登录。',
        'Spring Nest offers calculators, timers, converters, password, text, random, and other online tools, free, lightweight, and ready without sign-in.',
      );

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 py-10 relative">
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={categoryRoute ? `/tools/${categoryRoute.slug}` : '/tools'}
        jsonLd={collectionJsonLd(
          pageTitle,
          pageDescription,
          categoryRoute ? `/tools/${categoryRoute.slug}` : '/tools',
          filteredTools,
        )}
      />

      {/* Background blur orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-[10%] w-24 h-24 bg-tertiary-container/40 rounded-full blur-2xl animate-float"></div>
        <div className="absolute top-10 right-[15%] w-32 h-32 bg-primary-container/30 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <motion.header
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 sm:mb-16 lg:mb-20 relative pt-16 pb-8"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary-container/20 to-transparent -z-10 rounded-3xl blur-2xl"></div>

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <Wrench className="absolute top-4 right-[25%] text-primary/20 w-10 h-10 pointer-events-none" />
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        >
          <BookOpen className="absolute bottom-8 left-[20%] text-tertiary/20 w-8 h-8 pointer-events-none" />
        </motion.div>

        <h1 className="font-nunito font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#274e3a] dark:text-primary mb-6 flex items-center justify-center gap-4">
          {categoryRoute
            ? t(categoryRoute.label, categoryRoute.labelEn)
            : t('实用小筑', 'Practical Tools')}
        </h1>
        <p className="font-sans text-lg font-medium text-on-surface-variant max-w-2xl mx-auto">
          {pageDescription}
        </p>
      </motion.header>

      <section className="mb-8 rounded-2xl border border-surface-variant/30 bg-white/70 dark:bg-surface-container-high/60 p-5">
        <p className="text-sm leading-7 text-secondary">
          {t(
            '这里汇总了春日小筑的全部在线工具。你可以按分类筛选，也可以搜索工具名称、说明或标签；收藏和最近使用记录只保存在浏览器本地，不会上传。大多数工具在本机完成处理，适合快速计算、写作整理、开发辅助和日常决策。',
            'This page collects every Spring Nest online tool. Filter by category or search by name, description, or tag. Favorites and recent items stay in local browser storage. Most tools process data on-device, useful for quick calculations, writing cleanup, developer tasks, and daily decisions.',
          )}
        </p>
      </section>

      <div className="mb-8 grid gap-3 md:grid-cols-[1fr_auto]">
        <form role="search" onSubmit={(event) => event.preventDefault()} className="relative">
          <label htmlFor="tools-search" className="sr-only">
            {t('搜索工具', 'Search tools')}
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/50" />
          <input
            id="tools-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('搜索名称、说明或标签', 'Search name, description, or tags')}
            className="min-h-[52px] w-full rounded-2xl border border-surface-variant/40 bg-white/80 py-3 pl-12 pr-4 text-on-surface outline-none transition-colors focus:border-primary dark:bg-surface-container-high/70"
          />
        </form>
        <label className="flex min-h-[52px] items-center gap-2 rounded-2xl border border-surface-variant/40 bg-white/80 px-4 text-sm font-semibold text-secondary dark:bg-surface-container-high/70">
          <ArrowUpDown className="h-4 w-4" />
          <span className="sr-only">{t('排序', 'Sort')}</span>
          <select
            value={sortMode}
            onChange={(event) => handleSortChange(event.target.value as SortMode)}
            className="bg-transparent text-on-surface outline-none"
          >
            <option value="popular">{t('按热门排序', 'Popular')}</option>
            <option value="newest">{t('最近更新优先', 'Newest')}</option>
            <option value="recent">{t('最近使用优先', 'Recently used')}</option>
            <option value="name">{t('按名称排序', 'Name')}</option>
          </select>
        </label>
      </div>

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

      <AnimatePresence mode="wait">
        <motion.div
          key={`grid-${activeCategory}`}
          variants={gridContainerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-20"
        >
          {filteredTools.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full flex flex-col items-center justify-center py-20 text-secondary"
            >
              <Wrench className="w-16 h-16 text-secondary/30 mb-4" />
              <p className="font-medium text-lg">
                {t('没有找到相关工具', 'No matching tools found')}
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
            filteredTools.map((tool) => (
              <motion.div
                key={tool.id}
                variants={gridCardVariants}
                whileHover={{ y: -6, transition: springBouncy }}
                whileTap={{ scale: 0.97 }}
                className="glass-card rounded-3xl p-8 transition-all duration-500 hover-glow group"
              >
                <div className="flex flex-col items-center text-center gap-6 mb-6">
                  <div
                    className={`w-24 h-24 rounded-2xl overflow-hidden shrink-0 ${tool.iconBg || 'bg-surface-container'} flex items-center justify-center shadow-inner group-hover:-translate-y-3 group-hover:rotate-12 group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] transition-all duration-500 relative text-4xl`}
                  >
                    {tool.image ? (
                      <>
                        <img
                          src={tool.image}
                          alt={tool.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"></div>
                      </>
                    ) : (
                      <span>{tool.icon}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-nunito font-bold text-2xl text-on-background mb-3 group-hover:text-primary transition-colors">
                      {t(tool.title, tool.titleEn)}
                    </h2>
                    <span className="inline-block px-3 py-1.5 rounded-full font-semibold text-[13px] backdrop-blur-sm bg-primary-container/30 text-on-primary-container">
                      {t(tool.category, tool.categoryEn)}
                    </span>
                  </div>
                </div>
                <p className="font-sans text-base text-on-surface-variant mb-8 line-clamp-3 text-center">
                  {t(tool.description, tool.descriptionEn)}
                </p>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => toggle(tool.id)}
                    className={`p-2 min-h-[48px] min-w-[48px] rounded-full transition-all ${
                      favoriteIds.includes(tool.id)
                        ? 'text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100'
                        : 'text-secondary/40 hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                    }`}
                    aria-label={
                      favoriteIds.includes(tool.id)
                        ? t('取消收藏', 'Remove favorite')
                        : t('收藏', 'Add favorite')
                    }
                  >
                    <Heart
                      className={`w-5 h-5 ${favoriteIds.includes(tool.id) ? 'fill-current' : ''}`}
                    />
                  </button>
                  <motion.button
                    onClick={() => handleOpen(tool.id)}
                    whileHover={{ scale: 1.05, transition: springBouncy }}
                    whileTap={{ scale: 0.93 }}
                    className="py-4 px-8 rounded-xl btn-gradient text-on-primary font-semibold text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4" />
                    {t('打开工具', 'Open Tool')}
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
