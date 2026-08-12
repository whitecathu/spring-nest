import {
  BOOKKEEPING_STORAGE_KEY,
  createBookkeepingEntry,
  deserializeBookkeepingEntries,
  getTodayDate,
  type BookkeepingDraft,
  type BookkeepingEntry,
} from '../../../lib/bookkeeping';

export const accountOptions = [
  { zh: '现金', en: 'Cash' },
  { zh: '银行卡', en: 'Bank card' },
  { zh: '微信', en: 'WeChat' },
  { zh: '支付宝', en: 'Alipay' },
];

export function loadBookkeepingEntries() {
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

export function buildSampleEntries() {
  const samples: BookkeepingDraft[] = [
    {
      type: 'expense',
      amount: '32.80',
      category: '餐饮',
      date: getTodayDate(),
      account: '微信',
      note: '午餐',
      tags: [],
    },
    {
      type: 'expense',
      amount: '8.00',
      category: '交通',
      date: shiftDate(-1),
      account: '支付宝',
      note: '地铁',
      tags: [],
    },
    {
      type: 'income',
      amount: '5200',
      category: '工资',
      date: shiftDate(-2),
      account: '银行卡',
      note: '月度收入',
      tags: [],
    },
    {
      type: 'expense',
      amount: '126.50',
      category: '学习',
      date: shiftDate(-4),
      account: '银行卡',
      note: '课程资料',
      tags: [],
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
