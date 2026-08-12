import { Heart, Gamepad2, Wrench, Play } from 'lucide-react';
import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { useUser } from '../contexts/UserContext';
import { useFavorites } from '../hooks/useFavorites';
import { games as baseGames } from '../data/games';
import { tools as baseTools } from '../data/tools';
import { useCatalogItems } from '../hooks/useCatalogOverrides';
import SEO from '../components/SEO';

export default function Favorites() {
  const { t } = useUser();
  const { favoriteIds, toggle } = useFavorites();
  const navigate = useNavigate();
  const games = useCatalogItems(baseGames, 'game', 'web');
  const tools = useCatalogItems(baseTools, 'tool', 'web');

  const favoriteGames = games.filter((g) => favoriteIds.includes(g.id));
  const favoriteTools = tools.filter((t) => favoriteIds.includes(t.id));
  const totalFavorites = favoriteGames.length + favoriteTools.length;

  const handlePlayGame = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    if (game) navigate(game.route);
  };

  const handleOpenTool = (toolId: string) => {
    const tool = tools.find((t) => t.id === toolId);
    if (tool) navigate(tool.route);
  };

  return (
    <div className="flex-grow w-full max-w-[1200px] mx-auto px-6 py-10 relative">
      <SEO
        title={t('我的收藏 - Spring Nest 春日小筑', 'Favorites - Spring Nest')}
        description={t('查看你收藏的工具和游戏', 'View your favorite tools and games')}
      />
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center forest-readable-hero px-4 py-6">
          <div className="w-16 h-16 rounded-2xl bg-tertiary-container/70 text-tertiary flex items-center justify-center shadow-inner mb-4">
            <Heart className="w-8 h-8 fill-tertiary" />
          </div>
          <h1 className="font-nunito text-3xl font-bold forest-page-title mb-2">
            {t('我的收藏', 'My Favorites')}
          </h1>
          <p className="forest-page-subtitle font-medium">
            {totalFavorites > 0
              ? t(`共收藏了 ${totalFavorites} 个应用`, `You have ${totalFavorites} favorited items`)
              : t('这里珍藏着你最喜爱的应用', 'Here lies your most beloved apps')}
          </p>
        </div>

        {/* Games Section */}
        {favoriteGames.length > 0 && (
          <section>
            <h2 className="font-nunito text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-primary" />
              {t('游戏', 'Games')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteGames.map((item, i) => (
                <div
                  key={item.id}
                  className="bg-white/80 dark:bg-surface-container-high/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm hover:shadow-md border border-surface-variant/30 hover:border-primary/20 transition-all duration-300 group"
                >
                  <div className="flex gap-4">
                    <div
                      className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 ${item.iconBg || 'bg-surface-container'} flex items-center justify-center text-3xl`}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={t(item.title, item.titleEn)}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <span>{item.icon}</span>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-on-surface line-clamp-1">
                            {t(item.title, item.titleEn)}
                          </h3>
                          <button
                            onClick={() => toggle(item.id)}
                            className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                            aria-label={t('取消收藏', 'Remove Favorite')}
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                        <p className="text-xs text-secondary mt-1 line-clamp-2">
                          {t(item.description, item.descriptionEn)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-semibold px-2 py-1 bg-surface-container-high rounded-full text-on-surface-variant">
                          {item.category}
                        </span>
                        <button
                          onClick={() => handlePlayGame(item.id)}
                          className="text-primary hover:text-primary/80 transition-colors bg-primary-container/30 hover:bg-primary-container p-1.5 rounded-lg"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tools Section */}
        {favoriteTools.length > 0 && (
          <section>
            <h2 className="font-nunito text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary" />
              {t('工具', 'Tools')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteTools.map((item, i) => (
                <div
                  key={item.id}
                  className="bg-white/80 dark:bg-surface-container-high/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm hover:shadow-md border border-surface-variant/30 hover:border-primary/20 transition-all duration-300 group"
                >
                  <div className="flex gap-4">
                    <div
                      className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 ${item.iconBg || 'bg-surface-container'} flex items-center justify-center text-3xl`}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={t(item.title, item.titleEn)}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <span>{item.icon}</span>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-on-surface line-clamp-1">
                            {t(item.title, item.titleEn)}
                          </h3>
                          <button
                            onClick={() => toggle(item.id)}
                            className="text-red-400 hover:text-red-600 transition-colors shrink-0"
                            aria-label={t('取消收藏', 'Remove Favorite')}
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                        <p className="text-xs text-secondary mt-1 line-clamp-2">
                          {t(item.description, item.descriptionEn)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs font-semibold px-2 py-1 bg-surface-container-high rounded-full text-on-surface-variant">
                          {item.category}
                        </span>
                        <button
                          onClick={() => handleOpenTool(item.id)}
                          className="text-primary hover:text-primary/80 transition-colors bg-primary-container/30 hover:bg-primary-container p-1.5 rounded-lg"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {totalFavorites === 0 && (
          <div className="forest-empty-panel mx-auto flex max-w-xl flex-col items-center justify-center px-8 py-16 text-secondary">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-secondary/40" />
            </div>
            <p className="font-medium text-lg text-on-surface">
              {t('暂无收藏内容', 'No favorites yet')}
            </p>
            <p className="text-sm text-secondary mb-6">
              {t(
                '快去探索游戏和工具，收藏你喜欢的吧',
                'Explore games and tools and add your favorites',
              )}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/games')}
                className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-semibold text-sm hover:bg-primary-container/80 transition-colors"
              >
                {t('探索游戏', 'Explore Games')}
              </button>
              <button
                onClick={() => navigate('/tools')}
                className="px-6 py-3 bg-tertiary-container text-on-tertiary-container rounded-full font-semibold text-sm hover:bg-tertiary-container/80 transition-colors"
              >
                {t('探索工具', 'Explore Tools')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
