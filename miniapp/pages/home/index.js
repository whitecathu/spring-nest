const { categories, tools } = require('../../data/tools');
const { getRecentTools, setPendingToolsCategory } = require('../../utils/storage');

function getHomeTools() {
  return tools
    .filter((tool) => tool.homePriority > 0)
    .sort((a, b) => b.homePriority - a.homePriority)
    .slice(0, 8);
}

function findToolBySlug(slug) {
  return tools.find((tool) => tool.slug === slug);
}

Page({
  data: {
    query: '',
    categories,
    homeTools: getHomeTools(),
    recentTools: [],
    searchResults: [],
  },

  onShow() {
    this.setData({
      recentTools: getRecentTools(),
    });
  },

  handleSearchInput(event) {
    const query = event.detail.value.trim();
    const lowerQuery = query.toLowerCase();
    const searchResults = query
      ? tools
          .filter((tool) =>
            [tool.title, tool.description, tool.miniCategoryTitle, ...(tool.tags || [])]
              .join(' ')
              .toLowerCase()
              .includes(lowerQuery),
          )
          .slice(0, 8)
      : [];
    this.setData({ query, searchResults });
  },

  openTool(event) {
    const slug = event.currentTarget.dataset.slug;
    const detailTool = event.detail?.slug ? event.detail : null;
    const tool = detailTool || findToolBySlug(slug);
    if (!tool?.slug) return;
    wx.navigateTo({
      url: `/pages/tool-runtime/index?slug=${encodeURIComponent(tool.slug)}`,
    });
  },

  openToolsTab(event) {
    setPendingToolsCategory(event.currentTarget.dataset.slug);
    wx.switchTab({
      url: '/pages/tools/index',
    });
  },
});
