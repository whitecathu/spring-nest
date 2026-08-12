import { CalendarDays, PiggyBank, TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BookkeepingSummary } from '../../../lib/bookkeeping';

interface BookkeepingSummaryTilesProps {
  t: (zh: string, en: string) => string;
  summary: BookkeepingSummary;
  formatMoney: (value: number) => string;
}

export function BookkeepingSummaryTiles({ t, summary, formatMoney }: BookkeepingSummaryTilesProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryTile
        icon={<TrendingUp className="h-5 w-5" />}
        label={t('本月收入', 'Monthly income')}
        value={formatMoney(summary.income)}
        tone="text-primary"
      />
      <SummaryTile
        icon={<TrendingDown className="h-5 w-5" />}
        label={t('本月支出', 'Monthly expense')}
        value={formatMoney(summary.expense)}
        tone="text-tertiary"
      />
      <SummaryTile
        icon={<PiggyBank className="h-5 w-5" />}
        label={t('本月结余', 'Balance')}
        value={formatMoney(summary.balance)}
        tone={summary.balance >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-300'}
      />
      <SummaryTile
        icon={<CalendarDays className="h-5 w-5" />}
        label={t('有支出日均', 'Daily expense')}
        value={formatMoney(summary.dailyExpense)}
        tone="text-on-surface"
      />
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-surface-variant/30 bg-white/80 p-4 dark:bg-surface-container-high/75">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
        {icon}
      </div>
      <p className="text-xs font-bold uppercase text-secondary">{label}</p>
      <p className={`mt-1 break-words text-xl font-black tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
