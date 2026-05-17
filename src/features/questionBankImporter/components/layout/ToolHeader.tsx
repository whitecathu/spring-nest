import { BookOpen, FileUp, RotateCcw, Settings, Star, TriangleAlert } from 'lucide-react';
import type { AppView } from '../../store/questionBankStore';
import { appConfig } from '../../config/appConfig';

const navItems: Array<{ view: AppView; label: string; icon: typeof FileUp }> = [
  { view: 'import', label: '导入', icon: FileUp },
  { view: 'bank', label: '题库', icon: BookOpen },
  { view: 'workbench', label: '复习', icon: RotateCcw },
  { view: 'wrong', label: '错题', icon: TriangleAlert },
  { view: 'settings', label: '设置', icon: Settings },
];

const viewLabels: Record<AppView, string> = {
  workbench: '复习',
  import: '导入',
  bank: '题库',
  review: '复习中',
  wrong: '错题',
  settings: '设置',
};

interface ToolHeaderProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  questionCount: number;
}

export function ToolHeader({ activeView, onViewChange, questionCount }: ToolHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--color-outline-soft)] bg-[color:rgb(249_250_246_/_0.9)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 md:px-8 md:py-4">
          <button
            type="button"
            className="flex min-h-11 min-w-0 items-center gap-3 text-left"
            onClick={() => onViewChange('workbench')}
            aria-label="回到复习工作台"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-[1rem] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-soft md:size-11 md:rounded-2xl">
              <Star size={19} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold text-[var(--color-ink)]">
                {appConfig.appName}
              </span>
              <span className="hidden text-xs text-[var(--color-muted)] sm:block">
                {appConfig.routePath}
              </span>
              <span className="block text-xs text-[var(--color-muted)] sm:hidden">
                本地题库复习
              </span>
            </span>
          </button>

          <div className="flex min-w-0 shrink-0 flex-col items-end gap-1 md:hidden">
            <span className="max-w-[8rem] truncate rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
              {questionCount ? `${questionCount} 题` : '未导入'}
            </span>
            <span className="text-[11px] font-semibold text-[var(--color-muted)]">
              {viewLabels[activeView]}
            </span>
          </div>

          <nav
            className="hidden gap-2 overflow-x-auto rounded-full bg-[color:rgb(255_255_255_/_0.7)] p-1 shadow-soft md:flex"
            aria-label="主导航"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.view === activeView || (item.view === 'workbench' && activeView === 'review');
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => onViewChange(item.view)}
                  aria-current={active ? 'page' : undefined}
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
      <nav
        className="qb-mobile-bottom-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 gap-1 border-t border-[var(--color-outline-soft)] bg-[color:rgb(249_250_246_/_0.94)] px-2 pt-2 shadow-[0_-12px_34px_rgb(26_51_38_/_0.12)] backdrop-blur md:hidden"
        aria-label="移动端主导航"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.view === activeView || (item.view === 'workbench' && activeView === 'review');
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onViewChange(item.view)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-[0.95rem] px-1 text-[11px] font-bold transition active:scale-[0.98] ${
                active
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                  : 'text-[var(--color-muted)] active:bg-[var(--color-primary-soft)]'
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
              {item.view === 'bank' && questionCount ? (
                <span className="absolute right-1 top-1 rounded-full bg-[var(--color-accent-yellow)] px-1.5 text-[10px] leading-4 text-[var(--color-ink)]">
                  {questionCount > 99 ? '99+' : questionCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </>
  );
}
