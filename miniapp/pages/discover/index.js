let catalog = null;
try {
  catalog = require('../../utils/catalog');
} catch (e) {
  catalog = null;
}

Page({
  data: {
    query: '',
    searching: false,
    showAll: false,
    quickTools: [],
    dailyTools: [],
    funTools: [],
    allTools: [],
    results: [],
  },

  onLoad() {
    this.refresh();
  },

  onShow() {
    try {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ selected: 0 });
      }
    } catch (e) {}
    this.refresh();
  },

  refresh() {
    try {
      if (!catalog) return;
      const byPriority = (a, b) => (b.homePriority || 0) - (a.homePriority || 0);
      const quickTools = catalog.getQuickTools();
      // 常用工具已展示的入口，下方分区不再重复出现
      const quickSlugs = {};
      (quickTools || []).forEach((t) => {
        if (t && t.slug) quickSlugs[t.slug] = true;
      });
      const withoutQuick = (list) =>
        (list || []).filter((t) => t && t.slug && !quickSlugs[t.slug]).sort(byPriority);
      const dailyTools = withoutQuick(catalog.getBySection('daily'));
      const funTools = withoutQuick(catalog.getBySection('fun'));
      const allTools = catalog.getAllTools();
      this.setData({ quickTools, dailyTools, funTools, allTools });
    } catch (e) {
      console.error('discover refresh failed', e);
    }
  },

  onSearchInput(e) {
    const query = e.detail.value || '';
    const trimmed = query.trim();
    this.setData({
      query,
      searching: !!trimmed,
      showAll: false,
      results: trimmed && catalog ? catalog.searchTools(trimmed) : [],
    });
  },

  onClearSearch() {
    this.setData({
      query: '',
      searching: false,
      results: [],
    });
  },

  onToggleShowAll() {
    this.setData({ showAll: !this.data.showAll });
  },

  onOpenTool(e) {
    const tool = (e.detail && e.detail.tool) || e.currentTarget.dataset.tool;
    if (catalog) catalog.openTool(tool);
  },
});
