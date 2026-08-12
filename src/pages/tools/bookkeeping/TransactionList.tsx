import { ReceiptText, Trash2 } from 'lucide-react';
import type { BookkeepingEntry } from '../../../lib/bookkeeping';

interface TransactionListProps {
  t: (zh: string, en: string) => string;
  entries: BookkeepingEntry[];
  formatMoney: (value: number) => string;
  onDelete: (id: string) => void;
}

export function TransactionList({ t, entries, formatMoney, onDelete }: TransactionListProps) {
  return (
    <div className="rounded-3xl border border-surface-variant/30 bg-white/80 p-5 dark:bg-surface-container-high/75">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-on-surface">
        <ReceiptText className="h-5 w-5 text-primary" />
        {t('记录明细', 'Transactions')}
      </h2>

      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="grid gap-3 rounded-2xl bg-surface-container-low p-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      entry.type === 'income'
                        ? 'bg-primary-container/50 text-on-primary-container'
                        : 'bg-tertiary-container/50 text-on-tertiary-container'
                    }`}
                  >
                    {entry.type === 'income' ? t('收入', 'Income') : t('支出', 'Expense')}
                  </span>
                  <span className="text-sm font-bold text-on-surface">{entry.category}</span>
                  <span className="text-xs font-semibold text-secondary">{entry.date}</span>
                </div>
                <p className="mt-2 truncate text-sm text-secondary">
                  {entry.note || t('无备注', 'No note')} · {entry.account}
                </p>
                {entry.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary-container/30 px-2 py-0.5 text-[10px] font-semibold text-on-primary-container"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span
                  className={`text-lg font-black tabular-nums ${
                    entry.type === 'income'
                      ? 'text-primary'
                      : 'text-on-surface dark:text-on-surface'
                  }`}
                >
                  {entry.type === 'income' ? '+' : '-'}
                  {formatMoney(entry.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  aria-label={t('删除这条记录', 'Delete this record')}
                  title={t('删除', 'Delete')}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-secondary transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-surface-container-low p-8 text-center">
          <ReceiptText className="mx-auto mb-3 h-10 w-10 text-secondary/35" />
          <p className="text-sm font-semibold text-secondary">
            {t(
              '没有匹配的记录。新增一笔或调整筛选条件。',
              'No matching records. Add one or adjust filters.',
            )}
          </p>
        </div>
      )}
    </div>
  );
}
