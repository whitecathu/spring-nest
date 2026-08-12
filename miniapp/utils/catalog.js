const data = require('../data/tools.js');

const QUICK_SLUGS = ['calculator', 'pomodoro', 'converter'];

const PACKAGE_PATHS = {
  'question-bank-importer': '/packageStudy/pages/home/index',
  scanner: '/packageTools/pages/scanner/index',
  bookkeeping: '/packageTools/pages/bookkeeping/index',
};

const BG_MAP = {
  'bg-primary-fixed/40 text-primary': { bg: 'rgba(192,237,209,0.4)', color: '#274f3a' },
  'bg-secondary-fixed/40 text-secondary': { bg: 'rgba(180,242,181,0.4)', color: '#336a3a' },
  'bg-tertiary-fixed/40 text-tertiary': { bg: 'rgba(255,219,206,0.4)', color: '#604033' },
  'bg-surface-variant/80 text-on-surface-variant': {
    bg: 'rgba(231,226,219,0.8)',
    color: '#414943',
  },
  'bg-primary text-on-primary': { bg: '#274f3a', color: '#ffffff' },
  'bg-secondary-container/40 text-secondary': { bg: 'rgba(180,242,181,0.4)', color: '#336a3a' },
  'bg-tertiary-container/30 text-tertiary': { bg: 'rgba(122,87,73,0.3)', color: '#604033' },
  'bg-primary-container text-on-primary-container': { bg: '#3f6751', color: '#b7e3c8' },
  'bg-surface-variant text-on-surface-variant': { bg: '#e7e2db', color: '#414943' },
  'bg-secondary/20 text-secondary': { bg: 'rgba(51,106,58,0.2)', color: '#336a3a' },
  'bg-primary/20 text-primary': { bg: 'rgba(39,79,58,0.2)', color: '#274f3a' },
  'bg-tertiary-fixed/30 text-tertiary': { bg: 'rgba(255,219,206,0.3)', color: '#604033' },
  'bg-surface text-primary': { bg: '#fef8f2', color: '#274f3a' },
  'bg-[#566572] text-white': { bg: '#566572', color: '#ffffff' },
  'bg-[#716a5c] text-white': { bg: '#716a5c', color: '#ffffff' },
  'bg-[#b8baa8] text-white': { bg: '#b8baa8', color: '#ffffff' },
  'bg-[#7ba98f] text-white': { bg: '#7ba98f', color: '#ffffff' },
  'bg-[#c3cbb8] text-white': { bg: '#c3cbb8', color: '#ffffff' },
  'bg-secondary-container text-secondary': { bg: '#b4f2b5', color: '#336a3a' },
};

const OFFLINE_SLUGS = new Set(
  Array.isArray(data.offlineSlugs) && data.offlineSlugs.length
    ? data.offlineSlugs
    : ['weather', 'ip-lookup', 'text-to-speech'],
);

const HIDDEN_SLUGS = new Set(Array.isArray(data.hiddenSlugs) ? data.hiddenSlugs : []);

function isOfflineSlug(slug) {
  return OFFLINE_SLUGS.has(slug);
}

function isHiddenSlug(slug) {
  return HIDDEN_SLUGS.has(slug);
}

function isUnavailableSlug(slug) {
  return isOfflineSlug(slug) || isHiddenSlug(slug);
}

function decorate(tool) {
  if (!tool) return null;
  const mapped = BG_MAP[tool.bg] || { bg: '#c0edd1', color: '#274f3a' };
  const offline = !!(tool.offline || isOfflineSlug(tool.slug));
  const hidden = !!(tool.hidden || isHiddenSlug(tool.slug));
  return Object.assign({}, tool, {
    bg: mapped.bg,
    color: mapped.color,
    bgClass: tool.bg,
    packagePath: PACKAGE_PATHS[tool.slug] || '',
    offline: offline,
    hidden: hidden,
    unavailable: offline || hidden,
  });
}

function getAllTools(options) {
  const includeUnavailable = !!(options && options.includeUnavailable);
  const includeOffline = includeUnavailable || !!(options && options.includeOffline);
  return (data.tools || [])
    .map(decorate)
    .filter(
      (tool) => tool && (includeUnavailable || (!tool.hidden && (includeOffline || !tool.offline))),
    );
}

function findBySlug(slug, options) {
  if (!slug) return null;
  const includeUnavailable = !!(options && options.includeUnavailable);
  const includeOffline = includeUnavailable || !!(options && options.includeOffline);
  const list = data.tools || [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].slug === slug) {
      const tool = decorate(list[i]);
      if (tool && tool.hidden && !includeUnavailable) return null;
      if (tool && tool.offline && !includeOffline) return null;
      return tool;
    }
  }
  return null;
}

function getByTab(tabId) {
  return getAllTools().filter((t) => t.tabId === tabId);
}

function getBySection(section) {
  return getAllTools().filter((t) => t.section === section);
}

function searchTools(query, options) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return [];
  return getAllTools(options).filter((t) => {
    const hay = (
      t.title +
      ' ' +
      (t.titleEn || '') +
      ' ' +
      t.description +
      ' ' +
      (t.descriptionEn || '') +
      ' ' +
      t.slug +
      ' ' +
      (t.tags || []).join(' ')
    ).toLowerCase();
    return hay.indexOf(q) >= 0;
  });
}

function getQuickTools() {
  return QUICK_SLUGS.map((slug) => findBySlug(slug)).filter(Boolean);
}

function getTabs() {
  return (data.tabs || []).slice();
}

function getCategories() {
  return (data.categories || []).slice();
}

function openTool(tool) {
  if (!tool) return;
  if (tool.unavailable || isUnavailableSlug(tool.slug)) {
    wx.showToast({ title: '该工具已暂时下线', icon: 'none' });
    return;
  }
  if (tool.packagePath) {
    wx.navigateTo({ url: tool.packagePath });
    return;
  }
  if (PACKAGE_PATHS[tool.slug]) {
    wx.navigateTo({ url: PACKAGE_PATHS[tool.slug] });
    return;
  }
  wx.navigateTo({ url: '/pages/tool-runtime/index?slug=' + encodeURIComponent(tool.slug) });
}

module.exports = {
  getAllTools,
  findBySlug,
  getByTab,
  getBySection,
  searchTools,
  getQuickTools,
  getTabs,
  getCategories,
  openTool,
  isOfflineSlug,
  isHiddenSlug,
  isUnavailableSlug,
  PACKAGE_PATHS,
  QUICK_SLUGS,
  OFFLINE_SLUGS,
  HIDDEN_SLUGS,
  catalog: data,
};
