const catalog = require('../../../utils/catalog');
const favorites = require('../../../utils/favorites');
const historyUtil = require('../../../utils/history');
const toast = require('../../../utils/toast');
const storage = require('../../../utils/storage');

const STORAGE_KEY = 'bookkeeping:ledger:v1';
const CATEGORIES = ['餐饮', '交通', '购物', '居住', '工资', '其它'];

function uid() {
  return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadLedger() {
  const list = storage.getJSON(STORAGE_KEY, []);
  return Array.isArray(list) ? list : [];
}

function saveLedger(list) {
  storage.setJSON(STORAGE_KEY, list);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function entryMonth(item) {
  if (item && item.date && String(item.date).length >= 7) {
    return String(item.date).slice(0, 7);
  }
  if (item && item.ts) {
    return new Date(item.ts).toISOString().slice(0, 7);
  }
  return currentMonth();
}

function buildMonthOptions(list) {
  const set = {};
  list.forEach((item) => {
    set[entryMonth(item)] = true;
  });
  set[currentMonth()] = true;
  return Object.keys(set).sort().reverse();
}

function summarize(list) {
  let income = 0;
  let expense = 0;
  list.forEach((item) => {
    const amount = Number(item.amount) || 0;
    if (item.type === 'income') income += amount;
    else expense += amount;
  });
  return {
    income: round2(income),
    expense: round2(expense),
    balance: round2(income - expense),
  };
}

function buildBars(list) {
  const map = {};
  list.forEach((item) => {
    if (item.type !== 'expense') return;
    const key = item.category || '其它';
    map[key] = (map[key] || 0) + (Number(item.amount) || 0);
  });
  const entries = Object.keys(map).map((k) => ({ label: k, value: map[k] }));
  const max = entries.reduce((m, e) => Math.max(m, e.value), 0) || 1;
  return entries.map((e) => ({
    label: e.label,
    value: round2(e.value),
    height: Math.max(8, Math.round((e.value / max) * 100)),
  }));
}

function csvEscape(value) {
  const text = String(value == null ? '' : value);
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function toCsv(list) {
  const header = 'date,type,category,amount,note';
  const rows = list.map((item) =>
    [
      csvEscape(item.date || ''),
      csvEscape(item.type === 'income' ? 'income' : 'expense'),
      csvEscape(item.category || ''),
      csvEscape(item.amount),
      csvEscape(item.note || ''),
    ].join(','),
  );
  return header + '\n' + rows.join('\n');
}

function filterEntries(list, month, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  return list
    .filter((item) => entryMonth(item) === month)
    .filter((item) => {
      if (!q) return true;
      const hay = [item.category, item.note, item.date, item.type, String(item.amount)]
        .join(' ')
        .toLowerCase();
      return hay.indexOf(q) >= 0;
    })
    .sort((a, b) => (b.ts || 0) - (a.ts || 0));
}

Page({
  data: {
    tool: null,
    favorite: false,
    allEntries: [],
    entries: [],
    summary: { income: 0, expense: 0, balance: 0 },
    bars: [],
    formType: 'expense',
    formAmount: '',
    formNote: '',
    formCategory: '餐饮',
    categories: CATEGORIES,
    categoryIndex: 0,
    monthOptions: [],
    monthIndex: 0,
    selectedMonth: '',
    searchQuery: '',
  },

  onLoad() {
    const tool = catalog.findBySlug('bookkeeping');
    try {
      historyUtil.addHistory('bookkeeping');
    } catch (e) {}
    this.setData({
      tool: tool || {
        title: '随手记账',
        description: '本地账本，收支一目了然',
        icon: '📒',
        bg: '#c0edd1',
        color: '#274f3a',
      },
      favorite: favorites.isFavorite('bookkeeping'),
      selectedMonth: currentMonth(),
    });
    wx.setNavigationBarTitle({ title: (tool && tool.title) || '随手记账' });
    this.refresh();
  },

  onToggleFavorite() {
    try {
      favorites.toggleFavorite('bookkeeping');
      const next = favorites.isFavorite('bookkeeping');
      this.setData({ favorite: next });
      toast.showToast(next ? '已加入收藏。' : '已取消收藏。');
    } catch (e) {
      toast.showToast(e.message || '收藏失败');
    }
  },

  refresh() {
    const allEntries = loadLedger().slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const monthOptions = buildMonthOptions(allEntries);
    let selectedMonth = this.data.selectedMonth || currentMonth();
    if (monthOptions.indexOf(selectedMonth) < 0) {
      selectedMonth = monthOptions[0] || currentMonth();
    }
    const monthIndex = Math.max(0, monthOptions.indexOf(selectedMonth));
    const entries = filterEntries(allEntries, selectedMonth, this.data.searchQuery);
    this.setData({
      allEntries,
      monthOptions,
      monthIndex,
      selectedMonth,
      entries,
      summary: summarize(entries),
      bars: buildBars(entries),
    });
  },

  onMonthChange(e) {
    const monthIndex = Number(e.detail.value);
    const selectedMonth = this.data.monthOptions[monthIndex] || currentMonth();
    const entries = filterEntries(this.data.allEntries, selectedMonth, this.data.searchQuery);
    this.setData({
      monthIndex,
      selectedMonth,
      entries,
      summary: summarize(entries),
      bars: buildBars(entries),
    });
  },

  onSearchInput(e) {
    const searchQuery = e.detail.value || '';
    const entries = filterEntries(this.data.allEntries, this.data.selectedMonth, searchQuery);
    this.setData({
      searchQuery,
      entries,
      summary: summarize(entries),
      bars: buildBars(entries),
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  setType(e) {
    const formType = e.currentTarget.dataset.type;
    const formCategory = formType === 'income' ? '工资' : '餐饮';
    const categoryIndex = Math.max(0, CATEGORIES.indexOf(formCategory));
    this.setData({ formType, formCategory, categoryIndex });
  },

  onCategory(e) {
    const categoryIndex = Number(e.detail.value);
    this.setData({
      categoryIndex,
      formCategory: CATEGORIES[categoryIndex] || '其它',
    });
  },

  addEntry() {
    const amount = Number(this.data.formAmount);
    if (!isFinite(amount) || amount <= 0) {
      toast.showToast('请输入有效金额');
      return;
    }
    const now = new Date();
    const entry = {
      id: uid(),
      type: this.data.formType === 'income' ? 'income' : 'expense',
      amount: round2(amount),
      note: String(this.data.formNote || '').trim(),
      category: this.data.formCategory || '其它',
      ts: now.getTime(),
      date: now.toISOString().slice(0, 10),
    };
    const list = loadLedger();
    list.push(entry);
    saveLedger(list);
    this.setData({
      formAmount: '',
      formNote: '',
      selectedMonth: entryMonth(entry),
    });
    toast.showSuccess('已记一笔');
    this.refresh();
  },

  removeEntry(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除记录',
      content: '确定删除这一笔吗？',
      success: (res) => {
        if (!res.confirm) return;
        const list = loadLedger().filter((item) => item.id !== id);
        saveLedger(list);
        this.refresh();
      },
    });
  },

  clearAll() {
    if (!this.data.entries.length) return;
    wx.showModal({
      title: '清空本月可见记录',
      content: '将删除当前筛选结果中的记录（不影响其它月份）。',
      confirmColor: '#ba1a1a',
      success: (res) => {
        if (!res.confirm) return;
        const removeIds = {};
        this.data.entries.forEach((item) => {
          removeIds[item.id] = true;
        });
        const list = loadLedger().filter((item) => !removeIds[item.id]);
        saveLedger(list);
        this.refresh();
        toast.showToast('已清空当前筛选');
      },
    });
  },

  exportCsv() {
    const list = this.data.entries || [];
    if (!list.length) {
      toast.showToast('当前没有可导出的记录');
      return;
    }
    const csv = '\uFEFF' + toCsv(list);
    const month = this.data.selectedMonth || currentMonth();
    const fileName = 'bookkeeping-' + month + '.csv';

    wx.showActionSheet({
      itemList: ['分享 CSV 文件', '复制 CSV 到剪贴板'],
      success: (res) => {
        if (res.tapIndex === 1) {
          wx.setClipboardData({
            data: csv,
            success: () => toast.showSuccess('已复制 CSV'),
          });
          return;
        }
        if (!wx.getFileSystemManager || !wx.env || !wx.env.USER_DATA_PATH) {
          wx.setClipboardData({
            data: csv,
            success: () => toast.showSuccess('已复制 CSV（当前环境不支持分享文件）'),
          });
          return;
        }
        const filePath = wx.env.USER_DATA_PATH + '/' + fileName;
        try {
          wx.getFileSystemManager().writeFile({
            filePath: filePath,
            data: csv,
            encoding: 'utf8',
            success: () => {
              if (typeof wx.shareFileMessage === 'function') {
                wx.shareFileMessage({
                  filePath: filePath,
                  fileName: fileName,
                  success: () => toast.showSuccess('已唤起分享'),
                  fail: () => {
                    wx.setClipboardData({
                      data: csv,
                      success: () => toast.showSuccess('分享失败，已复制 CSV'),
                    });
                  },
                });
              } else {
                wx.setClipboardData({
                  data: csv,
                  success: () => toast.showSuccess('已复制 CSV'),
                });
              }
            },
            fail: () => toast.showToast('导出失败'),
          });
        } catch (e) {
          toast.showToast((e && e.message) || '导出失败');
        }
      },
    });
  },
});
