import type { BookkeepingEntry } from './bookkeeping';

export interface BudgetConfig {
  [category: string]: number;
}

export interface BudgetStatus {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  ratio: number;
  isOver: boolean;
}

const STORAGE_KEY = 'spring_nest_bookkeeping_budgets';

export function loadBudgets(): BudgetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as BudgetConfig;
  } catch {
    return {};
  }
}

export function saveBudgets(budgets: BudgetConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
}

export function setBudget(category: string, amount: number): BudgetConfig {
  const budgets = loadBudgets();
  if (amount <= 0) {
    delete budgets[category];
  } else {
    budgets[category] = amount;
  }
  saveBudgets(budgets);
  return budgets;
}

export function removeBudget(category: string): BudgetConfig {
  const budgets = loadBudgets();
  delete budgets[category];
  saveBudgets(budgets);
  return budgets;
}

export function getBudgetStatus(
  budgets: BudgetConfig,
  entries: BookkeepingEntry[],
  month: string,
): BudgetStatus[] {
  const monthEntries = entries.filter(
    (e) => e.type === 'expense' && e.date.startsWith(month),
  );

  return Object.entries(budgets)
    .filter(([, budget]) => budget > 0)
    .map(([category, budget]) => {
      const spent = monthEntries
        .filter((e) => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0);
      const ratio = budget > 0 ? spent / budget : 0;
      return {
        category,
        budget,
        spent,
        remaining: budget - spent,
        ratio,
        isOver: spent > budget,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}
