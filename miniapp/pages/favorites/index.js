const favorites = require('../../utils/favorites');
const catalog = require('../../utils/catalog');

Page({
  data: {
    tools: [],
    empty: true,
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const ids = favorites.getFavorites();
    const tools = ids.map((id) => catalog.findBySlug(id)).filter(Boolean);
    this.setData({ tools, empty: tools.length === 0 });
  },

  onOpenTool(e) {
    const tool = (e.detail && e.detail.tool) || e.currentTarget.dataset.tool;
    catalog.openTool(tool);
  },
});
