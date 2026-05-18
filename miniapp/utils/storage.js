const STORAGE_KEYS = {
  favorites: 'spring_nest_miniapp_favorite_tools',
  recent: 'spring_nest_miniapp_recent_tools',
  pendingToolsCategory: 'spring_nest_miniapp_pending_tools_category',
};

function readArray(key) {
  try {
    const value = wx.getStorageSync(key);
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch (error) {
    return [];
  }
}

function writeArray(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (error) {
    return false;
  }
}

function getFavoriteToolIds() {
  return readArray(STORAGE_KEYS.favorites).filter((id) => typeof id === 'string');
}

function isFavoriteTool(toolId) {
  return getFavoriteToolIds().includes(toolId);
}

function toggleFavoriteTool(toolId) {
  if (!toolId) return getFavoriteToolIds();
  const current = getFavoriteToolIds();
  const next = current.includes(toolId)
    ? current.filter((id) => id !== toolId)
    : [toolId, ...current];
  writeArray(STORAGE_KEYS.favorites, next);
  return next;
}

function getRecentTools() {
  return readArray(STORAGE_KEYS.recent).filter(
    (item) => item && typeof item.id === 'string' && typeof item.slug === 'string',
  );
}

function recordRecentTool(tool) {
  if (!tool?.id || !tool?.slug) return getRecentTools();
  const current = getRecentTools().filter((item) => item.id !== tool.id);
  const next = [
    {
      id: tool.id,
      slug: tool.slug,
      title: tool.title,
      icon: tool.icon || '',
      visitedAt: Date.now(),
    },
    ...current,
  ].slice(0, 12);
  writeArray(STORAGE_KEYS.recent, next);
  return next;
}

function setPendingToolsCategory(categorySlug) {
  if (!categorySlug) return false;
  try {
    wx.setStorageSync(STORAGE_KEYS.pendingToolsCategory, categorySlug);
    return true;
  } catch (error) {
    return false;
  }
}

function consumePendingToolsCategory() {
  try {
    const value = wx.getStorageSync(STORAGE_KEYS.pendingToolsCategory);
    wx.removeStorageSync(STORAGE_KEYS.pendingToolsCategory);
    return typeof value === 'string' ? value : '';
  } catch (error) {
    return '';
  }
}

function clearMiniProgramLocalData() {
  try {
    wx.removeStorageSync(STORAGE_KEYS.favorites);
    wx.removeStorageSync(STORAGE_KEYS.recent);
    wx.removeStorageSync(STORAGE_KEYS.pendingToolsCategory);
  } catch (error) {
    return false;
  }
  return true;
}

module.exports = {
  STORAGE_KEYS,
  clearMiniProgramLocalData,
  consumePendingToolsCategory,
  getFavoriteToolIds,
  getRecentTools,
  isFavoriteTool,
  recordRecentTool,
  setPendingToolsCategory,
  toggleFavoriteTool,
};
