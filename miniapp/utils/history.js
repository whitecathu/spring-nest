const storage = require('./storage');
const catalog = require('./catalog');

const HISTORY_KEY = 'history:v1';
const MERGE_WINDOW_MS = 60 * 1000;
const MAX_HISTORY = 100;

function createId() {
  return Date.now() + '-' + Math.floor(Math.random() * 1e9).toString(16);
}

function normalizeValid(records) {
  const known = new Set(catalog.getAllTools().map((t) => t.slug));
  return (records || [])
    .filter((r) => r && known.has(r.toolId))
    .sort((a, b) => b.openedAt - a.openedAt)
    .slice(0, MAX_HISTORY);
}

function saveValid(records) {
  const valid = normalizeValid(records);
  storage.setJSON(HISTORY_KEY, valid);
  return valid;
}

function getHistory() {
  return normalizeValid(storage.getJSON(HISTORY_KEY, []));
}

function addHistory(toolId) {
  const tool = catalog.findBySlug(toolId);
  if (!tool) throw new Error('工具不存在，无法记录历史。');

  const records = getHistory();
  const now = Date.now();
  const existingIndex = records.findIndex((r) => r.toolId === toolId);

  if (existingIndex >= 0 && now - records[existingIndex].openedAt < MERGE_WINDOW_MS) {
    records[existingIndex] = Object.assign({}, records[existingIndex], { openedAt: now });
  } else {
    records.unshift({
      id: createId(),
      toolId: toolId,
      name: tool.title,
      openedAt: now,
    });
  }

  return saveValid(records);
}

function clearHistory() {
  storage.setJSON(HISTORY_KEY, []);
  return [];
}

function removeHistoryItem(id) {
  return saveValid(getHistory().filter((r) => r.id !== id));
}

function formatHistoryTime(openedAt, now) {
  now = now || Date.now();
  const diff = Math.max(0, now - openedAt);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return '刚刚';
  if (diff < hour) return Math.floor(diff / minute) + ' 分钟前';
  if (diff < day) return Math.floor(diff / hour) + ' 小时前';
  if (diff < 2 * day) return '昨天';
  const d = new Date(openedAt);
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const dayNum = d.getDate().toString().padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + dayNum;
}

module.exports = {
  HISTORY_KEY,
  MAX_HISTORY,
  addHistory,
  getHistory,
  clearHistory,
  removeHistoryItem,
  formatHistoryTime,
};
