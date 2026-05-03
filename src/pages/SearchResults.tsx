import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Gamepad2, Wrench } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { search } from '../services/searchService';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { t } = useUser();

  const results = useMemo(() => search(query), [query]);

  return (
    <div className="flex-grow w-full max-w-[900px] mx-auto px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-on-surface mb-2 flex items-center gap-2">
          <Search className="w-6 h-6 text-primary" />
          {t('搜索结果', 'Search Results')}
        </h1>
        <p className="text-secondary mb-8">
          {t(`关键词："${query}"`, `Keyword: "${query}"`)}
          {results.length > 0 && ` · ${t(`找到 ${results.length} 个结果`, `${results.length} results found`)}`}
        </p>

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-secondary">
            <Search className="w-16 h-16 text-secondary/20 mb-4" />
            <p className="font-medium text-lg">{t('未找到相关结果', 'No results found')}</p>
            <p className="text-sm text-secondary/50 mt-1">{t('试试其他关键词', 'Try different keywords')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <a
                key={result.item.id}
                href={result.item.type === 'game' ? `/games/${result.item.route.split('/').pop()}` : `/tools/${result.item.route.split('/').pop()}`}
                className="block bg-white dark:bg-surface-container-high/20 rounded-2xl p-5 shadow-sm border border-surface-variant/20 hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${result.item.iconBg || 'bg-surface-container'} flex items-center justify-center text-2xl shrink-0`}>
                    {result.item.icon || (result.item.type === 'game' ? '🎮' : '🛠️')}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-on-surface group-hover:text-primary transition-colors">
                        {t(result.item.title, result.item.titleEn)}
                      </h2>
                      {result.item.type === 'game' ? (
                        <Gamepad2 className="w-4 h-4 text-primary/50" />
                      ) : (
                        <Wrench className="w-4 h-4 text-primary/50" />
                      )}
                    </div>
                    <p className="text-sm text-secondary line-clamp-1 mt-0.5">
                      {t(result.item.description, result.item.descriptionEn)}
                    </p>
                    <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 bg-surface-container-high dark:bg-surface-container/30 rounded-full text-on-surface-variant">
                      {result.item.category}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
