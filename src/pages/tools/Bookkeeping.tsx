import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Download,
  PiggyBank,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import {
  BOOKKEEPING_STORAGE_KEY,
  createBookkeepingEntry,
  deserializeBookkeepingEntries,
  filterBookkeepingEntries,
  getCurrentMonth,
  getTodayDate,
  summarizeBookkeeping,
  toBookkeepingCsv,
  type BookkeepingDraft,
  type BookkeepingEntry,
  type BookkeepingEntryType,
} from '../../lib/bookkeeping';
import { springBouncy, springSmooth, toolPageEnter } from '../../lib/animations';

const expenseCategories = [
  { zh: '餐饮', en: 'Food' },
  { zh: '交通', en: 'Transport' },
  { zh: '购物', en: 'Shopping' },
  { zh: '居住', en: 'Housing' },
  { zh: '学习', en: 'Study' },
  { zh: '健康', en: 'Health' },
  { zh: '娱乐', en: 'Leisure' },
  { zh: '其他', en: 'Other' },
];

const incomeCategories = [
  { zh: '工资', en: 'Salary' },
  { zh: '兼职', en: 'Freelance' },
  { zh: '礼金', en: 'Gift' },
  { zh: '理财', en: 'Investment' },
  { zh: '其他收入', en: 'Other income' },
];

const accountOptions = [
  { zh: '现金', en: 'Cash' },
  { zh: '银行卡', en: 'Bank card' },
  { zh: '微信', en: 'WeChat' },
  { zh: '支付宝', en: 'Alipay' },
];

function loadEntries() {
  if (typeof window === 'undefined') return [];
  return deserializeBookkeepingEntries(window.localStorage.getItem(BOOKKEEPING_STORAGE_KEY));
}

function shiftDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function buildSampleEntries() {
  const samples: BookkeepingDraft[] = [
    {
      type: 'expense',
      amount: '32.80',
      category: '餐饮',
      date: getTodayDate(),
      account: '微信',
      note: '午餐',
    },
    {
      type: 'expense',
      amount: '8.00',
      category: '交通',
      date: shiftDate(-1),
      account: '支付宝',
      note: '地铁',
    },
    {
      type: 'income',
      amount: '5200',
      category: '工资',
      date: shiftDate(-2),
      account: '银行卡',
      note: '月度收入',
    },
    {
      type: 'expense',
      amount: '126.50',
      category: '学习',
      date: shiftDate(-4),
      account: '银行卡',
      note: '课程资料',
    },
  ];

  return samples
    .map((draft, index) =>
      createBookkeepingEntry(draft, {
        id: `book_sample_${index}`,
        now: Date.now() - index * 1000,
      }),
    )
    .filter((entry): entry is BookkeepingEntry => Boolean(entry));
}

export default function Bookkeeping({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const lang = t('zh', 'en') === 'zh' ? 'zh' : 'en';
  const [entries, setEntries] = useState<BookkeepingEntry[]>(loadEntries);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [typeFilter, setTypeFilter] = useState<'all' | BookkeepingEntryType>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<BookkeepingDraft>({
    type: 'expense',
    amount: '',
    category: '餐饮',
    date: getTodayDate(),
    account: '现金',
    note: '',
  });
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const toastRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    window.localStorage.setItem(BOOKKEEPING_STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  useEffect(
    () => () => {
      clearTimeout(toastRef.current);
    },
    [],
  );

  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US', {
        style: 'currency',
        currency: 'CNY',
        maximumFractionDigits: 2,
      }),
    [lang],
  );

  const monthEntries = useMemo(
    () => filterBookkeepingEntries(entries, { month: selectedMonth }),
    [entries, selectedMonth],
  );
  const visibleEntries = useMemo(
    () =>
      filterBookkeepingEntries(entries, {
        month: selectedMonth,
        type: typeFilter,
        query,
      }),
    [entries, selectedMonth, typeFilter, query],
  );
  const summary = useMemo(() => summarizeBookkeeping(monthEntries), [monthEntries]);
  const activeCategories = draft.type === 'expense' ? expenseCategories : incomeCategories;

  const formatMoney = (value: number) => moneyFormatter.format(value);

  const showToast = (message: string) => {
    setToast(message);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 1800);
  };

  const handleTypeChange = (nextType: BookkeepingEntryType) => {
    const nextCategory = nextType === 'expense' ? expenseCategories[0].zh : incomeCategories[0].zh;
    setDraft((current) => ({ ...current, type: nextType, category: nextCategory }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entry = createBookkeepingEntry(draft);
    if (!entry) {
      setError(t('请输入有效金额、日期和分类。', 'Enter a valid amount, date, and category.'));
      return;
    }

    setEntries((current) => [entry, ...current]);
    setError('');
    setDraft((current) => ({ ...current, amount: '', note: '' }));
    if (entry.date.slice(0, 7) !== selectedMonth) setSelectedMonth(entry.date.slice(0, 7));
    showToast(t('已保存到本地账本', 'Saved to local ledger'));
  };

  const handleExport = () => {
    if (monthEntries.length === 0) {
      setError(t('当前月份没有可导出的记录。', 'This month has no records to export.'));
      return;
    }

    const blob = new Blob([`\uFEFF${toBookkeepingCsv(monthEntries)}`], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spring-nest-bookkeeping-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setError('');
    showToast(t('CSV 已导出', 'CSV exported'));
  };

  const handleSample = () => {
    setEntries((current) => {
      const withoutSamples = current.filter((entry) => !entry.id.startsWith('book_sample_'));
      return [...buildSampleEntries(), ...withoutSamples];
    });
    setSelectedMonth(getCurrentMonth());
    showToast(t('示例记录已填入', 'Sample records added'));
  };

  const filterButtons: Array<{ id: 'all' | BookkeepingEntryType; label: string }> = [
    { id: 'all', label: t('全部', 'All') },
    { id: 'expense', label: t('支出', 'Expense') },
    { id: 'income', label: t('收入', 'Income') },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <button
        onClick={onBack}
        className="mb-5 -ml-2 flex min-h-[48px] items-center gap-2 px-2 text-sm font-semibold text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-5 w-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div {...toolPageEnter} className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-surface-variant/30 bg-white/85 p-5 shadow-lg shadow-primary-container/20 dark:bg-surface-container-high/80 dark:shadow-none">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-primary">{t('随手记账', 'Quick ledger')}</p>
              <h2 className="mt-1 text-2xl font-black text-on-surface">
                {t('记录一笔收支', 'Add a transaction')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-secondary">
                {t(
                  '数据只保存在当前浏览器，可随时导出 CSV 备份。',
                  'Data stays in this browser and can be exported as CSV anytime.',
                )}
              </p>
            </div>
            <WalletCards className="h-9 w-9 shrink-0 text-primary" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-container-low p-1">
              {(['expense', 'income'] as BookkeepingEntryType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`min-h-[48px] rounded-xl text-sm font-bold transition-colors ${
                    draft.type === type
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-secondary hover:bg-surface-container-high'
                  }`}
                >
                  {type === 'expense' ? t('支出', 'Expense') : t('收入', 'Income')}
                </button>
              ))}
            </div>

            <label className="grid gap-2 text-sm font-bold text-on-surface">
              {t('金额', 'Amount')}
              <div className="relative">
                <CircleDollarSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input
                  value={draft.amount}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, amount: event.target.value }))
                  }
                  inputMode="decimal"
                  placeholder="0.00"
                  className="min-h-[56px] w-full rounded-2xl border border-surface-variant/40 bg-surface-container-low py-3 pl-12 pr-4 text-2xl font-black tabular-nums text-on-surface outline-none transition-colors focus:border-primary"
                />
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-on-surface">
                {t('分类', 'Category')}
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, category: event.target.value }))
                  }
                  className="min-h-[52px] rounded-2xl border border-surface-variant/40 bg-surface-container-low px-4 text-on-surface outline-none focus:border-primary"
                >
                  {activeCategories.map((category) => (
                    <option key={category.zh} value={category.zh}>
                      {t(category.zh, category.en)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-on-surface">
                {t('日期', 'Date')}
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, date: event.target.value }))
                  }
                  className="min-h-[52px] rounded-2xl border border-surface-variant/40 bg-surface-container-low px-4 text-on-surface outline-none focus:border-primary"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
              <label className="grid gap-2 text-sm font-bold text-on-surface">
                {t('账户', 'Account')}
                <select
                  value={draft.account}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, account: event.target.value }))
                  }
                  className="min-h-[52px] rounded-2xl border border-surface-variant/40 bg-surface-container-low px-4 text-on-surface outline-none focus:border-primary"
                >
                  {accountOptions.map((account) => (
                    <option key={account.zh} value={account.zh}>
                      {t(account.zh, account.en)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-on-surface">
                {t('备注', 'Note')}
                <input
                  value={draft.note}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, note: event.target.value }))
                  }
                  placeholder={t(
                    '可选，例如午餐、工资、房租',
                    'Optional, e.g. lunch, salary, rent',
                  )}
                  className="min-h-[52px] rounded-2xl border border-surface-variant/40 bg-surface-container-low px-4 text-on-surface outline-none focus:border-primary"
                />
              </label>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-200"
              >
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                transition={springBouncy}
                className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-bold text-on-primary shadow-md shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                {t('保存记录', 'Save record')}
              </motion.button>
              <button
                type="button"
                onClick={handleSample}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-surface-container-high px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
              >
                <RotateCcw className="h-4 w-4" />
                {t('填入示例', 'Add sample')}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-5">
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

          <div className="rounded-3xl border border-surface-variant/30 bg-white/80 p-5 dark:bg-surface-container-high/75">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-on-surface">
                  {t('月度账目', 'Monthly ledger')}
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  {t(
                    '筛选、查看分类占比并导出本月数据。',
                    'Filter, review categories, and export this month.',
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-surface-container px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
              >
                <Download className="h-4 w-4" />
                {t('导出 CSV', 'Export CSV')}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[160px_1fr]">
              <label className="grid gap-2 text-sm font-bold text-on-surface">
                {t('月份', 'Month')}
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value || getCurrentMonth())}
                  className="min-h-[48px] rounded-2xl border border-surface-variant/40 bg-surface-container-low px-4 text-on-surface outline-none focus:border-primary"
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-on-surface">
                {t('搜索', 'Search')}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/60" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
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
                  onClick={() => setTypeFilter(button.id)}
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
              <h3 className="mb-3 text-sm font-black text-on-surface">
                {t('支出分类占比', 'Expense categories')}
              </h3>
              {summary.categoryTotals.length > 0 ? (
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
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(6, category.ratio * 100)}%` }}
                          transition={springSmooth}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-surface-container-low p-4 text-sm leading-relaxed text-secondary">
                  {t('本月还没有支出记录。', 'No expense records this month yet.')}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-surface-variant/30 bg-white/80 p-5 dark:bg-surface-container-high/75">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-on-surface">
              <ReceiptText className="h-5 w-5 text-primary" />
              {t('记录明细', 'Transactions')}
            </h2>

            <AnimatePresence mode="popLayout">
              {visibleEntries.length > 0 ? (
                <motion.div layout className="space-y-3">
                  {visibleEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={springSmooth}
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
                          <span className="text-sm font-bold text-on-surface">
                            {entry.category}
                          </span>
                          <span className="text-xs font-semibold text-secondary">{entry.date}</span>
                        </div>
                        <p className="mt-2 truncate text-sm text-secondary">
                          {entry.note || t('无备注', 'No note')} · {entry.account}
                        </p>
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
                          onClick={() =>
                            setEntries((current) => current.filter((item) => item.id !== entry.id))
                          }
                          aria-label={t('删除这条记录', 'Delete this record')}
                          title={t('删除', 'Delete')}
                          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-secondary transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-ledger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-surface-container-low p-8 text-center"
                >
                  <ReceiptText className="mx-auto mb-3 h-10 w-10 text-secondary/35" />
                  <p className="text-sm font-semibold text-secondary">
                    {t(
                      '没有匹配的记录。新增一笔或调整筛选条件。',
                      'No matching records. Add one or adjust filters.',
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={springBouncy}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-on-surface px-4 py-2 text-sm font-bold text-surface shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
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
