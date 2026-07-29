import { Home, RefreshCw, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { useUser } from '../contexts/UserContext';

export default function Offline() {
  const { t } = useUser();

  return (
    <div className="flex-grow px-6 py-16">
      <SEO
        title={t('离线模式 - Spring Nest 春日小筑', 'Offline - Spring Nest')}
        description={t(
          '当前网络不可用，你仍可以访问已缓存的春日小筑页面。',
          'The network is unavailable, but cached Spring Nest pages may still work.',
        )}
        canonical="/offline"
        noindex
      />
      <section className="mx-auto flex max-w-2xl flex-col items-center text-center forest-readable-hero py-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-container/40 text-primary">
          <WifiOff className="h-9 w-9" />
        </div>
        <h1 className="mb-4 font-nunito text-3xl font-black forest-page-title sm:text-4xl">
          {t('你当前处于离线状态', 'You are offline')}
        </h1>
        <p className="max-w-xl text-base leading-relaxed forest-page-subtitle">
          {t(
            '已缓存的工具和小游戏仍可继续打开。网络恢复后，刷新页面即可回到最新内容。',
            'Cached tools and games may still open. Refresh once your connection returns to load the latest content.',
          )}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 font-bold text-on-primary transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            {t('重试连接', 'Retry')}
          </button>
          <Link
            to="/"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-primary/30 bg-white/80 px-6 font-bold text-primary transition-colors hover:bg-primary-container/30 dark:bg-surface-container-high/70"
          >
            <Home className="h-4 w-4" />
            {t('返回首页', 'Back home')}
          </Link>
        </div>
      </section>
    </div>
  );
}
