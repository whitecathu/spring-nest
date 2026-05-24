import { useState } from 'react';
import { Repeat, Plus, Trash2, Power, X } from 'lucide-react';
import type { RecurringRule, RecurringDraft } from '../../../lib/bookkeepingRecurring';
import { createRecurringRule } from '../../../lib/bookkeepingRecurring';

interface RecurringManagerProps {
  t: (zh: string, en: string) => string;
  rules: RecurringRule[];
  expenseCategories: string[];
  incomeCategories: string[];
  onAdd: (rule: RecurringRule) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function RecurringManager({
  t,
  rules,
  expenseCategories,
  incomeCategories,
  onAdd,
  onToggle,
  onDelete,
}: RecurringManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<RecurringDraft>({
    type: 'expense',
    amount: '',
    category: '餐饮',
    account: '',
    note: '',
    tags: [],
    dayOfMonth: '1',
  });

  const categories = draft.type === 'expense' ? expenseCategories : incomeCategories;

  const handleSubmit = () => {
    const rule = createRecurringRule(draft);
    if (!rule) return;
    onAdd(rule);
    setDraft({
      type: 'expense',
      amount: '',
      category: '餐饮',
      account: '',
      note: '',
      tags: [],
      dayOfMonth: '1',
    });
    setShowForm(false);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
            {t('自动记账', 'Recurring')}
          </h3>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('添加', 'Add')}
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setDraft((d) => ({ ...d, type: 'expense', category: expenseCategories[0] || '其他' }))}
              className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                draft.type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {t('支出', 'Expense')}
            </button>
            <button
              onClick={() => setDraft((d) => ({ ...d, type: 'income', category: incomeCategories[0] || '其他收入' }))}
              className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                draft.type === 'income'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {t('收入', 'Income')}
            </button>
          </div>

          {/* Category + Amount */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="number"
              value={draft.amount}
              onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
              placeholder={t('金额', 'Amount')}
              className="text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
            />
          </div>

          {/* Day of month */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">{t('每月', 'Every month')}</span>
            <select
              value={draft.dayOfMonth}
              onChange={(e) => setDraft((d) => ({ ...d, dayOfMonth: e.target.value }))}
              className="text-sm px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}{t('号', '')}</option>
              ))}
            </select>
            <span className="text-sm text-neutral-500">{t('自动生成', 'auto-generate')}</span>
          </div>

          {/* Note */}
          <input
            type="text"
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
            placeholder={t('备注 (可选)', 'Note (optional)')}
            className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
          />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              {t('取消', 'Cancel')}
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-1.5 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors font-medium"
            >
              {t('添加', 'Add')}
            </button>
          </div>
        </div>
      )}

      {/* Rules list */}
      {rules.length === 0 && !showForm ? (
        <p className="text-sm text-neutral-400 text-center py-3">
          {t('暂无自动记账规则', 'No recurring rules yet')}
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                rule.active
                  ? 'bg-neutral-50 dark:bg-neutral-800'
                  : 'bg-neutral-100/50 dark:bg-neutral-800/50 opacity-60'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  rule.type === 'expense'
                    ? 'bg-red-100 dark:bg-red-950/50 text-red-500'
                    : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-500'
                }`}
              >
                {rule.type === 'expense' ? '↓' : '↑'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {rule.category}
                  </span>
                  <span className={`text-sm font-bold ${rule.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {rule.type === 'expense' ? '-' : '+'}¥{rule.amount.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {t(`每月${rule.dayOfMonth}号`, `${getOrdinal(rule.dayOfMonth)} of each month`)}
                  {rule.note && ` · ${rule.note}`}
                </div>
              </div>
              <button
                onClick={() => onToggle(rule.id)}
                className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                title={rule.active ? t('暂停', 'Pause') : t('启用', 'Enable')}
              >
                <Power className={`w-4 h-4 ${rule.active ? 'text-indigo-500' : 'text-neutral-400'}`} />
              </button>
              <button
                onClick={() => onDelete(rule.id)}
                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
