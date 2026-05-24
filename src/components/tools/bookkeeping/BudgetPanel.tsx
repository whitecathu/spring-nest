import { useState } from 'react';
import { Target, Plus, X, AlertTriangle } from 'lucide-react';
import type { BudgetConfig, BudgetStatus } from '../../../lib/bookkeepingBudgets';

interface BudgetPanelProps {
  t: (zh: string, en: string) => string;
  budgets: BudgetConfig;
  budgetStatus: BudgetStatus[];
  expenseCategories: string[];
  onSetBudget: (category: string, amount: number) => void;
  onRemoveBudget: (category: string) => void;
}

export default function BudgetPanel({
  t,
  budgets,
  budgetStatus,
  expenseCategories,
  onSetBudget,
  onRemoveBudget,
}: BudgetPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const unBudgetedCategories = expenseCategories.filter((c) => !budgets[c]);

  const handleAdd = () => {
    const amount = parseFloat(newAmount.replace(/,/g, ''));
    if (!newCategory || isNaN(amount) || amount <= 0) return;
    onSetBudget(newCategory, amount);
    setNewCategory('');
    setNewAmount('');
    setShowAdd(false);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">
            {t('预算管理', 'Budget')}
          </h3>
        </div>
        {!showAdd && unBudgetedCategories.length > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('添加', 'Add')}
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
          >
            <option value="">{t('选择分类', 'Select category')}</option>
            {unBudgetedCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder={t('月预算', 'Monthly budget')}
            className="w-28 text-sm px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
          >
            {t('确定', 'OK')}
          </button>
          <button
            onClick={() => { setShowAdd(false); setNewCategory(''); setNewAmount(''); }}
            className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      )}

      {/* Budget list */}
      {budgetStatus.length === 0 && !showAdd ? (
        <p className="text-sm text-neutral-400 text-center py-3">
          {t('暂无预算，点击添加', 'No budgets yet, click to add')}
        </p>
      ) : (
        <div className="space-y-3">
          {budgetStatus.map((item) => {
            const percent = Math.min(item.ratio * 100, 100);
            const barColor = item.isOver
              ? 'bg-red-500'
              : item.ratio > 0.8
                ? 'bg-amber-500'
                : 'bg-indigo-500';

            return (
              <div key={item.category} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      {item.category}
                    </span>
                    {item.isOver && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">
                      ¥{item.spent.toFixed(0)} / ¥{item.budget.toFixed(0)}
                    </span>
                    <button
                      onClick={() => onRemoveBudget(item.category)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                    >
                      <X className="w-3 h-3 text-neutral-400" />
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {item.isOver && (
                  <p className="text-xs text-red-500 mt-1">
                    {t(
                      `超支 ¥${(item.spent - item.budget).toFixed(2)}`,
                      `Over by ¥${(item.spent - item.budget).toFixed(2)}`,
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
