import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { Flower2, Sparkles, ArrowRight } from 'lucide-react';
import type { AppItem } from '../../types/app';
import CatalogItemCard from '../../components/CatalogItemCard';
import { gridContainerVariants, gridCardVariants } from '../../lib/animations';

type Translator = (zh: string, en: string) => string;

type FeaturedToolsProps = {
  featuredTools: AppItem[];
  featuredGames: AppItem[];
  favoriteIds: string[];
  toggle: (id: string) => boolean;
  t: Translator;
  reducedMotion: boolean;
};

export default function FeaturedTools({
  featuredTools,
  featuredGames,
  favoriteIds,
  toggle,
  t,
  reducedMotion,
}: FeaturedToolsProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Featured Tools */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
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
            <div key={tool.id}>
              <CatalogItemCard
                item={tool}
                variant="feature"
                actionLabel={t('打开工具', 'Open Tool')}
                to={tool.route}
                isFavorite={favoriteIds.includes(tool.id)}
                onFavorite={toggle}
                t={t}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Featured Games */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-8">
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
            <div key={game.id}>
              <CatalogItemCard
                item={game}
                variant="game"
                actionLabel={t('开始游戏', 'Play')}
                to={game.route}
                isFavorite={favoriteIds.includes(game.id)}
                onFavorite={toggle}
                t={t}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
