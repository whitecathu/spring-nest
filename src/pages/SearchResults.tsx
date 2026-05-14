import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpDown, Search, Sparkles } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { search, type SearchResult } from '../services/searchService';
import { getRecommendedForEmpty } from '../lib/recommendations';
import SEO from '../components/SEO';

/** Safely highlight query matches in text without dangerouslySetInnerHTML */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

type TypeFilter = 'all' | 'tools' | 'games';
type SearchSort = 'relevance' | 'popular' | 'newest';

const typeFilters = new Set<TypeFilter>(['all', 'tools', 'games']);
const searchSorts = new Set<SearchSort>(['relevance', 'popular', 'newest']);

function getTypeFilter(value: string | null): TypeFilter {
  return value && typeFilters.has(value as TypeFilter) ? (value as TypeFilter) : 'all';
}

function getSearchSort(value: string | null): SearchSort {
  return value && searchSorts.has(value as SearchSort) ? (value as SearchSort) : 'relevance';
}

const SUGGESTED_KEYWORDS = [
  { zh: '番茄钟', en: 'Pomodoro' },
  { zh: '2048', en: '2048' },
  { zh: 'JSON', en: 'JSON' },
  { zh: '密码', en: 'Password' },
];

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { t } = useUser();
  const [draftQuery, setDraftQuery] = useState(query);
  const activeType = getTypeFilter(searchParams.get('type'));
  const activeSort = getSearchSort(searchParams.get('sort'));

  const allResults = useMemo(() => search(query), [query]);
  const recommended = useMemo(() => getRecommendedForEmpty(6), []);

  const filteredResults = useMemo(() => {
    const byType =
      activeType === 'all'
        ? allResults
        : allResults.filter((r) => r.item.type === (activeType === 'tools' ? 'tool' : 'game'));

    return [...byType].sort((a, b) => {
      if (activeSort === 'popular') return (b.item.popularScore ?? 0) - (a.item.popularScore ?? 0);
      if (activeSort === 'newest')
        return Number(Boolean(b.item.isNew)) - Number(Boolean(a.item.isNew));
      return b.score - a.score;
    });
  }, [allResults, activeSort, activeType]);

  const toolCount = useMemo(
    () => allResults.filter((r) => r.item.type === 'tool').length,
    [allResults],
  );
  const gameCount = useMemo(
    () => allResults.filter((r) => r.item.type === 'game').length,
    [allResults],
  );

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  const tabs: { key: TypeFilter; label: string; count: number }[] = [
    { key: 'all', label: t('全部', 'All'), count: allResults.length },
    { key: 'tools', label: t('工具', 'Tools'), count: toolCount },
    { key: 'games', label: t('游戏', 'Games'), count: gameCount },
  ];

  const updateParam = (key: 'type' | 'sort', value: string) => {
    const params = new URLSearchParams(searchParams);
    if ((key === 'type' && value === 'all') || (key === 'sort' && value === 'relevance')) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    setSearchParams(params, { replace: false });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams);
    const nextQuery = draftQuery.trim();
    if (nextQuery) params.set('q', nextQuery);
    else params.delete('q');
    setSearchParams(params, { replace: false });
  };

  return (
    <div className="flex-grow w-full max-w-[900px] mx-auto px-6 py-10">
      <SEO
        title={
          query
            ? `${t('搜索', 'Search')}: ${query} - Spring Nest`
            : t('搜索 - Spring Nest 春日小筑', 'Search - Spring Nest')
        }
        description={
          query
            ? t(
                `在 Spring Nest 中搜索"${query}"的结果`,
                `Search results for "${query}" on Spring Nest`,
              )
            : undefined
        }
      />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-on-surface mb-2 flex items-center gap-2">
          <Search className="w-6 h-6 text-primary" />
          {t('搜索结果', 'Search Results')}
        </h1>
        <p className="text-secondary mb-6">
          {query ? (
            <>
              {t(`关键词："${query}"`, `Keyword: "${query}"`)}
              {allResults.length > 0 &&
                ` · ${t(`找到 ${allResults.length} 个结果`, `${allResults.length} results found`)}`}
            </>
          ) : (
            t('输入关键词开始搜索', 'Enter a keyword to start searching')
          )}
        </p>

        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]"
        >
          <label className="sr-only" htmlFor="search-results-input">
            {t('搜索工具和小游戏', 'Search tools and games')}
          </label>
          <input
            id="search-results-input"
            type="search"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder={t('输入关键词', 'Enter a keyword')}
            className="min-h-[52px] rounded-2xl border border-surface-variant/40 bg-white/80 px-4 text-on-surface outline-none transition-colors focus:border-primary dark:bg-surface-container-high/70"
          />
          <button
            type="submit"
            className="min-h-[52px] rounded-2xl bg-primary px-6 font-bold text-on-primary"
          >
            {t('搜索', 'Search')}
          </button>
        </form>

        {/* Filter Tabs */}
        {allResults.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateParam('type', tab.key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeType === tab.key
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-high dark:bg-surface-container/30 text-on-surface-variant hover:bg-surface-container-high/80'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-xs opacity-70">{tab.count}</span>
                </motion.button>
              ))}
            </div>
            <label className="flex min-h-[44px] items-center gap-2 rounded-2xl border border-surface-variant/40 bg-white/80 px-4 text-sm font-semibold text-secondary dark:bg-surface-container-high/70">
              <ArrowUpDown className="h-4 w-4" />
              <span className="sr-only">{t('排序', 'Sort')}</span>
              <select
                value={activeSort}
                onChange={(event) => updateParam('sort', event.target.value)}
                className="bg-transparent text-on-surface outline-none"
              >
                <option value="relevance">{t('按相关度排序', 'Relevance')}</option>
                <option value="popular">{t('按热门排序', 'Popular')}</option>
                <option value="newest">{t('最新优先', 'Newest')}</option>
              </select>
            </label>
          </div>
        )}

        {/* Results List */}
        <AnimatePresence mode="wait">
          {allResults.length > 0 ? (
            <motion.div
              key={`${activeType}-${activeSort}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {filteredResults.map((result, index) => (
                <SearchResultCard
                  key={result.item.id}
                  result={result}
                  query={query}
                  index={index}
                  t={t}
                />
              ))}
              {filteredResults.length === 0 && (
                <div className="text-center py-10 text-secondary">
                  <p className="text-sm">{t('该分类下无结果', 'No results in this category')}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Suggested Keywords */}
              <div className="mb-10">
                <p className="text-sm text-secondary mb-3">
                  {t('试试这些关键词', 'Try these keywords')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_KEYWORDS.map((kw) => (
                    <Link
                      key={kw.zh}
                      to={`/search?q=${encodeURIComponent(kw.zh)}`}
                      className="px-4 py-2 rounded-full bg-surface-container-high dark:bg-surface-container/30 text-on-surface-variant text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {t(kw.zh, kw.en)}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Empty State with Recommendations */}
              <div className="flex flex-col items-center justify-center py-10 text-secondary">
                <Search className="w-16 h-16 text-secondary/20 mb-4" />
                <p className="font-medium text-lg">{t('未找到相关结果', 'No results found')}</p>
                <p className="text-sm text-secondary/50 mt-1 mb-8">
                  {t(
                    '试试其他关键词，或探索下面的推荐',
                    'Try different keywords, or explore our recommendations below',
                  )}
                </p>

                <div className="w-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="font-bold text-on-surface">
                      {t('为你推荐', 'Recommended for You')}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommended.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="block bg-white dark:bg-surface-container-high/20 rounded-2xl p-4 shadow-sm border border-surface-variant/20 hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
                      >
                        <Link to={item.route} className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl ${item.iconBg || 'bg-surface-container'} flex items-center justify-center text-xl shrink-0`}
                          >
                            {item.icon || (item.type === 'game' ? '🎮' : '🛠️')}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                                {t(item.title, item.titleEn)}
                              </h3>
                              <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                {item.type === 'game' ? t('游戏', 'Game') : t('工具', 'Tool')}
                              </span>
                            </div>
                            <p className="text-xs text-secondary line-clamp-1 mt-0.5">
                              {t(item.description, item.descriptionEn)}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SearchResultCard({
  result,
  query,
  index,
  t,
}: {
  result: SearchResult;
  query: string;
  index: number;
  t: (zh: string, en: string) => string;
}) {
  const { item } = result;
  const href =
    item.type === 'game'
      ? `/games/${item.route.split('/').pop()}`
      : `/tools/${item.route.split('/').pop()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="block bg-white dark:bg-surface-container-high/20 rounded-2xl p-5 shadow-sm border border-surface-variant/20 hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
    >
      <Link to={href} className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl ${item.iconBg || 'bg-surface-container'} flex items-center justify-center text-2xl shrink-0`}
        >
          {item.icon || (item.type === 'game' ? '🎮' : '🛠️')}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-on-surface group-hover:text-primary transition-colors">
              <HighlightText text={t(item.title, item.titleEn)} query={query} />
            </h2>
            {/* Type badge */}
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {item.type === 'game' ? t('游戏', 'Game') : t('工具', 'Tool')}
            </span>
            {/* Category badge */}
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-surface-container-high dark:bg-surface-container/30 text-on-surface-variant">
              {t(item.category, item.categoryEn)}
            </span>
            {/* New badge */}
            {item.isNew && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {t('新', 'New')}
              </span>
            )}
          </div>
          <p className="text-sm text-secondary line-clamp-1 mt-0.5">
            <HighlightText text={t(item.description, item.descriptionEn)} query={query} />
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
