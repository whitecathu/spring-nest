import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import type { BookkeepingEntry, BookkeepingEntryType } from '../../../lib/bookkeeping';

interface StatisticsChartsProps {
  t: (zh: string, en: string) => string;
  entries: BookkeepingEntry[];
  selectedMonth: string;
  typeFilter: 'all' | BookkeepingEntryType;
}

const COLORS = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#f97316',
];

export default function StatisticsCharts({
  t,
  entries,
  selectedMonth,
  typeFilter,
}: StatisticsChartsProps) {
  // Category pie chart data
  const categoryData = useMemo(() => {
    const types: BookkeepingEntryType[] = typeFilter === 'all' ? ['expense'] : [typeFilter];
    const monthEntries = entries.filter(
      (e) => types.includes(e.type) && e.date.startsWith(selectedMonth),
    );
    const map = new Map<string, number>();
    for (const e of monthEntries) {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [entries, selectedMonth, typeFilter]);

  // Monthly comparison (this month vs last month)
  const comparisonData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevMonth =
      month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;

    const sum = (arr: BookkeepingEntry[]) => arr.reduce((s, e) => s + e.amount, 0);
    const filterByType = (list: BookkeepingEntry[]) =>
      typeFilter === 'all' ? list : list.filter((e) => e.type === typeFilter);

    const current = filterByType(entries.filter((e) => e.date.startsWith(selectedMonth)));
    const prev = filterByType(entries.filter((e) => e.date.startsWith(prevMonth)));

    if (typeFilter === 'all') {
      return [
        {
          name: t('支出', 'Expense'),
          [t('本月', 'This month')]:
            Math.round(sum(current.filter((e) => e.type === 'expense')) * 100) / 100,
          [t('上月', 'Last month')]:
            Math.round(sum(prev.filter((e) => e.type === 'expense')) * 100) / 100,
        },
        {
          name: t('收入', 'Income'),
          [t('本月', 'This month')]:
            Math.round(sum(current.filter((e) => e.type === 'income')) * 100) / 100,
          [t('上月', 'Last month')]:
            Math.round(sum(prev.filter((e) => e.type === 'income')) * 100) / 100,
        },
      ];
    }

    const label = typeFilter === 'expense' ? t('支出', 'Expense') : t('收入', 'Income');
    return [
      {
        name: label,
        [t('本月', 'This month')]: Math.round(sum(current) * 100) / 100,
        [t('上月', 'Last month')]: Math.round(sum(prev) * 100) / 100,
      },
    ];
  }, [entries, selectedMonth, typeFilter, t]);

  // Yearly trend (12 months)
  const trendData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const months: { key: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = month - i;
      const y = m <= 0 ? year - 1 : year;
      const actualM = m <= 0 ? m + 12 : m;
      const key = `${y}-${String(actualM).padStart(2, '0')}`;
      months.push({ key, label: `${actualM}${t('月', '')}` });
    }

    return months.map(({ key, label }) => {
      const monthEntries = entries.filter((e) => e.date.startsWith(key));
      const income = monthEntries
        .filter((e) => e.type === 'income')
        .reduce((s, e) => s + e.amount, 0);
      const expense = monthEntries
        .filter((e) => e.type === 'expense')
        .reduce((s, e) => s + e.amount, 0);

      const result: Record<string, string | number> = { name: label };
      if (typeFilter === 'all' || typeFilter === 'income') {
        result[t('收入', 'Income')] = Math.round(income * 100) / 100;
      }
      if (typeFilter === 'all' || typeFilter === 'expense') {
        result[t('支出', 'Expense')] = Math.round(expense * 100) / 100;
      }
      return result;
    });
  }, [entries, selectedMonth, typeFilter, t]);

  const hasData =
    categoryData.length > 0 ||
    comparisonData.some((d) => (d[t('本月', 'This month')] as number) > 0);

  if (!hasData) {
    return (
      <div className="rounded-2xl bg-surface-container-low p-6 text-center">
        <p className="text-sm text-secondary">
          {t('本月还没有足够数据生成图表。', 'Not enough data this month to generate charts.')}
        </p>
      </div>
    );
  }

  const pieTitle =
    typeFilter === 'income'
      ? t('收入分类占比', 'Income Categories')
      : t('支出分类占比', 'Expense Categories');

  return (
    <div className="space-y-6">
      {/* Category Pie Chart */}
      {categoryData.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-on-surface mb-3">{pieTitle}</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `¥${value.toFixed(2)}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {categoryData.slice(0, 8).map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-secondary">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Comparison */}
      <div>
        <h4 className="text-sm font-bold text-on-surface mb-3">
          {t('月度对比', 'Monthly Comparison')}
        </h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-variant, #e5e7eb)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `¥${value.toFixed(2)}`}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Bar dataKey={t('本月', 'This month')} fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey={t('上月', 'Last month')} fill="#a5b4fc" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Yearly Trend */}
      <div>
        <h4 className="text-sm font-bold text-on-surface mb-3">{t('年度趋势', 'Yearly Trend')}</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-variant, #e5e7eb)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => `¥${value.toFixed(2)}`}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              {(typeFilter === 'all' || typeFilter === 'income') && (
                <Line
                  type="monotone"
                  dataKey={t('收入', 'Income')}
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )}
              {(typeFilter === 'all' || typeFilter === 'expense') && (
                <Line
                  type="monotone"
                  dataKey={t('支出', 'Expense')}
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
