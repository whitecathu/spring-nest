import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { useUser } from '../contexts/UserContext';

export default function PwaUpdatePrompt() {
  const { t } = useUser();
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<
    ((reloadPage?: boolean) => Promise<void>) | null
  >(null);

  useEffect(() => {
    const update = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        setUpdateServiceWorker(() => async (reloadPage = true) => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          if (reloadPage) window.location.reload();
        });
      },
    });

    setUpdateServiceWorker(() => update);
  }, []);

  if (!needRefresh || !updateServiceWorker) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border border-primary/20 bg-white/95 p-4 shadow-[0_16px_48px_rgba(63,103,81,0.18)] backdrop-blur dark:bg-surface-container-high/95">
      <div className="flex items-start gap-3">
        <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-on-surface">{t('发现新版本', 'New version available')}</p>
          <p className="mt-1 text-sm leading-relaxed text-secondary">
            {t('点击刷新即可使用最新内容。', 'Refresh to use the latest content.')}
          </p>
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-on-primary"
          >
            {t('刷新', 'Refresh')}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-surface-container"
          aria-label={t('关闭更新提示', 'Dismiss update prompt')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
