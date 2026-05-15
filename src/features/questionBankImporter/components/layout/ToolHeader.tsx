import { BookOpen, FileUp, RotateCcw, Settings, Star, TriangleAlert } from 'lucide-react';
import type { AppView } from '../../store/questionBankStore';
import { appConfig } from '../../config/appConfig';

const navItems: Array<{ view: AppView; label: string; icon: typeof FileUp }> = [
  { view: 'import', label: '导入', icon: FileUp },
  { view: 'bank', label: '题库', icon: BookOpen },
  { view: 'review', label: '复习', icon: RotateCcw },
  { view: 'wrong', label: '错题', icon: TriangleAlert },
  { view: 'settings', label: '设置', icon: Settings },
];

interface ToolHeaderProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  questionCount: number;
}

export function ToolHeader({ activeView, onViewChange, questionCount }: ToolHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-outline-soft)] bg-[color:rgb(249_250_246_/_0.86)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <button
          type="button"
          className="flex min-h-11 items-center gap-3 text-left"
          onClick={() => onViewChange('import')}
          aria-label="回到导入页"
        >
          <span className="grid size-11 place-items-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-soft">
            <Star size={20} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold text-[var(--color-ink)]">
              {appConfig.appName}
            </span>
            <span className="block text-xs text-[var(--color-muted)]">{appConfig.routePath}</span>
          </span>
        </button>

        <nav
          className="flex gap-2 overflow-x-auto rounded-full bg-[color:rgb(255_255_255_/_0.7)] p-1 shadow-soft"
          aria-label="主导航"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.view === activeView;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => onViewChange(item.view)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                  active
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                    : 'text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]'
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
                {item.view === 'bank' && questionCount ? (
                  <span className="rounded-full bg-[color:rgb(255_255_255_/_0.25)] px-2 text-xs">
                    {questionCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
