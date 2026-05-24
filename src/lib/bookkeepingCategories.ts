export type CategoryType = 'expense' | 'income';

export interface CategoryConfig {
  expense: string[];
  income: string[];
}

export const BOOKKEEPING_CATEGORIES_KEY = 'spring_nest_bookkeeping_categories';

const DEFAULT_EXPENSE = ['餐饮', '交通', '购物', '居住', '学习', '健康', '娱乐', '其他'];
const DEFAULT_INCOME = ['工资', '兼职', '礼金', '理财', '其他收入'];

const CATEGORY_I18N: Record<string, { zh: string; en: string }> = {
  餐饮: { zh: '餐饮', en: 'Food' },
  交通: { zh: '交通', en: 'Transport' },
  购物: { zh: '购物', en: 'Shopping' },
  居住: { zh: '居住', en: 'Housing' },
  学习: { zh: '学习', en: 'Study' },
  健康: { zh: '健康', en: 'Health' },
  娱乐: { zh: '娱乐', en: 'Leisure' },
  其他: { zh: '其他', en: 'Other' },
  工资: { zh: '工资', en: 'Salary' },
  兼职: { zh: '兼职', en: 'Freelance' },
  礼金: { zh: '礼金', en: 'Gift' },
  理财: { zh: '理财', en: 'Investment' },
  其他收入: { zh: '其他收入', en: 'Other income' },
};

export function getCategoryLabel(name: string, lang: 'zh' | 'en'): string {
  return CATEGORY_I18N[name]?.[lang] ?? name;
}

export function getDefaultCategories(): CategoryConfig {
  return { expense: [...DEFAULT_EXPENSE], income: [...DEFAULT_INCOME] };
}

export function loadCategories(): CategoryConfig {
  if (typeof window === 'undefined') return getDefaultCategories();
  try {
    const raw = window.localStorage.getItem(BOOKKEEPING_CATEGORIES_KEY);
    if (!raw) return getDefaultCategories();
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed.expense) &&
      parsed.expense.length > 0 &&
      Array.isArray(parsed.income) &&
      parsed.income.length > 0
    ) {
      return {
        expense: parsed.expense.map(String),
        income: parsed.income.map(String),
      };
    }
    return getDefaultCategories();
  } catch {
    return getDefaultCategories();
  }
}

export function saveCategories(config: CategoryConfig): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BOOKKEEPING_CATEGORIES_KEY, JSON.stringify(config));
}

export function addCategory(type: CategoryType, name: string): CategoryConfig {
  const config = loadCategories();
  const trimmed = name.trim();
  if (!trimmed || config[type].includes(trimmed)) return config;
  config[type].push(trimmed);
  saveCategories(config);
  return config;
}

export function removeCategory(type: CategoryType, name: string): CategoryConfig {
  const config = loadCategories();
  config[type] = config[type].filter((c) => c !== name);
  if (config[type].length === 0) config[type] = type === 'expense' ? ['其他'] : ['其他收入'];
  saveCategories(config);
  return config;
}

export function resetCategories(): CategoryConfig {
  const config = getDefaultCategories();
  saveCategories(config);
  return config;
}
