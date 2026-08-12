import { lazy, Suspense } from 'react';
import { Download, FileUp, Search } from 'lucide-react';
import {
  getCurrentMonth,
  type BookkeepingEntry,
  type BookkeepingEntryType,
  type BookkeepingSummary,
} from '../../../lib/bookkeeping';

const StatisticsCharts = lazy(
  () => import('../../../components/tools/bookkeeping/StatisticsCharts'),
);

interface MonthlyLedgerPanelProps {
  t: (zh: string, en: string) => string;
  entries: BookkeepingEntry[];
  selectedMonth: string;
  onSelectedMonthChange: (month: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  typeFilter: 'all' | BookkeepingEntryType;
  onTypeFilterChange: (type: 'all' | BookkeepingEntryType) => void;
  summary: BookkeepingSummary;
  formatMoney: (value: number) => string;
  showCharts: boolean;
  onToggleCharts: () => void;
  onOpenImporter: () => void;
  onExport: () => void;
}

export function MonthlyLedgerPanel({
  t,
  entries,
  selectedMonth,
  onSelectedMonthChange,
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  summary,
  formatMoney,
  showCharts,
  onToggleCharts,
  onOpenImporter,
  onExport,
}: MonthlyLedgerPanelProps) {
  const filterButtons: Array<{ id: 'all' | BookkeepingEntryType; label: string }> = [
    { id: 'all', label: t('全部', 'All') },
    { id: 'expense', label: t('支出', 'Expense') },
    { id: 'income', label: t('收入', 'Income') },
  ];

  return (
    <div className="rounded-3xl border border-surface-variant/30 bg-white/80 p-5 dark:bg-surface-container-high/75">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-on-surface">{t('月度账目', 'Monthly ledger')}</h2>
          <p className="mt-1 text-sm text-secondary">
            {t(
              '筛选、查看分类占比并导出本月数据。',
              'Filter, review categories, and export this month.',
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenImporter}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-surface-container px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
          >
            <FileUp className="h-4 w-4" />
            {t('导入', 'Import')}
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-surface-container px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
          >
            <Download className="h-4 w-4" />
            {t('导出 CSV', 'Export CSV')}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[160px_1fr]">
        <label className="grid gap-2 text-sm font-bold text-on-surface">
          {t('月份', 'Month')}
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => onSelectedMonthChange(event.target.value || getCurrentMonth())}
            className="min-h-[48px] rounded-2xl border border-surface-variant/40 bg-surface-container-low px-4 text-on-surface outline-none focus:border-primary"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-on-surface">
          {t('搜索', 'Search')}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/60" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t(
                '搜索分类、账户、备注或日期',
                'Search category, account, note, or date',
              )}
              className="min-h-[48px] w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low py-3 pl-11 pr-4 text-on-surface outline-none focus:border-primary"
            />
          </div>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filterButtons.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={() => onTypeFilterChange(button.id)}
            className={`min-h-[44px] rounded-full px-4 text-sm font-bold transition-colors ${
              typeFilter === button.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black text-on-surface">
            {typeFilter === 'income'
              ? t('收入分类占比', 'Income categories')
              : t('支出分类占比', 'Expense categories')}
          </h3>
          <button
            type="button"
            onClick={onToggleCharts}
            className="text-xs font-bold text-indigo-500 transition-colors hover:text-indigo-600"
          >
            {showCharts ? t('简化视图', 'Simple') : t('图表视图', 'Charts')}
          </button>
        </div>
        {showCharts ? (
          <Suspense
            fallback={
              <p role="status" className="rounded-2xl bg-surface-container-low p-4 text-secondary">
                {t('正在加载图表…', 'Loading charts…')}
              </p>
            }
          >
            <StatisticsCharts
              t={t}
              entries={entries}
              selectedMonth={selectedMonth}
              typeFilter={typeFilter}
            />
          </Suspense>
        ) : summary.categoryTotals.length > 0 ? (
          <div className="space-y-3">
            {summary.categoryTotals.slice(0, 6).map((category) => (
              <div key={category.category}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="font-semibold text-on-surface">{category.category}</span>
                  <span className="font-bold tabular-nums text-secondary">
                    {formatMoney(category.total)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(category.ratio * 100, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-surface-container-low p-4 text-sm leading-relaxed text-secondary">
            {typeFilter === 'income'
              ? t('本月还没有收入记录。', 'No income records this month yet.')
              : t('本月还没有支出记录。', 'No expense records this month yet.')}
          </p>
        )}
      </div>
    </div>
  );
}
