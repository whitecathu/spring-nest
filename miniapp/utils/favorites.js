const storage = require('./storage');
const catalog = require('./catalog');

const FAVORITES_KEY = 'favorites:v1';

function saveValid(ids) {
  const known = new Set(catalog.getAllTools().map((t) => t.slug));
  const next = [];
  const seen = {};
  (ids || []).forEach((id) => {
    if (known.has(id) && !seen[id]) {
      seen[id] = true;
      next.push(id);
    }
  });
  storage.setJSON(FAVORITES_KEY, next);
  return next;
}

function getFavorites() {
  return saveValid(storage.getJSON(FAVORITES_KEY, []));
}

function isFavorite(toolId) {
  return getFavorites().indexOf(toolId) >= 0;
}

function toggleFavorite(toolId) {
  const ids = getFavorites();
  const idx = ids.indexOf(toolId);
  if (idx >= 0) {
    ids.splice(idx, 1);
  } else {
    if (!catalog.findBySlug(toolId)) {
      throw new Error('工具不存在，无法收藏。');
    }
    ids.unshift(toolId);
  }
  return saveValid(ids);
}

module.exports = {
  FAVORITES_KEY,
  getFavorites,
  isFavorite,
  toggleFavorite,
};
