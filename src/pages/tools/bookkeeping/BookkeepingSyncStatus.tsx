import { Cloud, CloudOff, LoaderCircle, RotateCw } from 'lucide-react';
import type {
  BookkeepingSyncError,
  BookkeepingSyncStatus as SyncStatus,
} from './useBookkeepingCloudSync';

interface BookkeepingSyncStatusProps {
  t: (zh: string, en: string) => string;
  status: SyncStatus;
  lastError: BookkeepingSyncError | null;
  onRetry: () => void;
}

export function BookkeepingSyncStatus({
  t,
  status,
  lastError,
  onRetry,
}: BookkeepingSyncStatusProps) {
  if (status === 'error') {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-200"
      >
        <CloudOff className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1">
          {t('云同步失败，本地数据已保存：', 'Cloud sync failed; local data is safe: ')}
          {lastError?.message ?? t('未知错误', 'Unknown error')}
        </span>
        <button
          type="button"
          onClick={onRetry}
          aria-label={t('重试云同步', 'Retry cloud sync')}
          className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-red-100 px-3 font-bold hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900"
        >
          <RotateCw className="h-3.5 w-3.5" />
          {t('重试', 'Retry')}
        </button>
      </div>
    );
  }

  const state =
    status === 'syncing'
      ? {
          label: t('正在同步云端', 'Syncing to cloud'),
          icon: <LoaderCircle className="h-4 w-4 animate-spin" />,
        }
      : status === 'synced'
        ? {
            label: t('云端已同步', 'Cloud synced'),
            icon: <Cloud className="h-4 w-4" />,
          }
        : {
            label: t('仅本地保存', 'Saved locally only'),
            icon: <CloudOff className="h-4 w-4" />,
          };

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex min-h-9 items-center gap-2 rounded-full bg-surface-container-low px-3 text-xs font-semibold text-secondary"
    >
      {state.icon}
      {state.label}
    </div>
  );
}
