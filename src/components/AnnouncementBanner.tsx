import { useEffect, useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { fetchActiveAnnouncements, type Announcement } from '../services/announcementService';

const dismissedKey = 'spring_nest_dismissed_announcements';

function getDismissedIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(dismissedKey) || '[]');
    return Array.isArray(parsed)
      ? new Set(parsed.filter((value) => typeof value === 'string'))
      : new Set<string>();
  } catch {
    // localStorage may be unavailable or data corrupted
    return new Set<string>();
  }
}

function severityClass(severity: Announcement['severity']) {
  if (severity === 'critical')
    return 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100';
  if (severity === 'warning')
    return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100';
  if (severity === 'success')
    return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100';
  return 'border-primary/20 bg-primary-container/30 text-on-primary-container dark:border-primary/20 dark:bg-primary/15 dark:text-primary';
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    fetchActiveAnnouncements('web').then((items) => {
      const dismissed = getDismissedIds();
      setAnnouncement(items.find((item) => !dismissed.has(item.id)) ?? null);
    });
  }, []);

  if (!announcement) return null;

  const Icon =
    announcement.severity === 'warning' || announcement.severity === 'critical'
      ? AlertTriangle
      : Info;

  return (
    <div className="relative z-40 px-4 pt-3">
      <div
        className={`mx-auto flex max-w-5xl items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm ${severityClass(announcement.severity)}`}
      >
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{announcement.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-85">{announcement.body}</p>
        </div>
        <button
          type="button"
          aria-label="关闭公告"
          onClick={() => {
            const dismissed = getDismissedIds();
            dismissed.add(announcement.id);
            localStorage.setItem(dismissedKey, JSON.stringify([...dismissed]));
            setAnnouncement(null);
          }}
          className="rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
