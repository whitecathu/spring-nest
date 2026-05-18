const { categories, tools } = require('../../data/tools');
const {
  consumePendingToolsCategory,
  getFavoriteToolIds,
  getRecentTools,
} = require('../../utils/storage');

const categoryOptions = [
  { slug: 'all', title: '全部', description: '29 个工具' },
  { slug: 'recent', title: '最近', description: '最近使用' },
  { slug: 'favorites', title: '收藏', description: '常用工具' },
  ...categories,
];

function getCategorySlug(slug) {
  return categoryOptions.some((category) => category.slug === slug) ? slug : 'all';
}

function filterTools({ activeCategory, query, favoriteIds, recentTools }) {
  const lowerQuery = query.trim().toLowerCase();
  const recentOrder = new Map(recentTools.map((item, index) => [item.slug, index]));
  const filteredTools = tools.filter((tool) => {
    const categoryMatch =
      activeCategory === 'all' ||
      activeCategory === 'favorites' ||
      activeCategory === 'recent' ||
      tool.miniCategorySlug === activeCategory;
    const queryMatch =
      !lowerQuery ||
      [tool.title, tool.description, tool.miniCategoryTitle, ...(tool.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(lowerQuery);
    const favoriteMatch = activeCategory !== 'favorites' || favoriteIds.includes(tool.id);
    const recentMatch = activeCategory !== 'recent' || recentOrder.has(tool.slug);
    return categoryMatch && queryMatch && favoriteMatch && recentMatch;
  });

  if (activeCategory !== 'recent') return filteredTools;
  return filteredTools.sort((a, b) => recentOrder.get(a.slug) - recentOrder.get(b.slug));
}

Page({
  data: {
    categories: categoryOptions,
    activeCategory: 'all',
    query: '',
    favoriteIds: [],
    recentTools: [],
    visibleTools: tools,
  },

  onShow() {
    const favoriteIds = getFavoriteToolIds();
    const recentTools = getRecentTools();
    const pendingCategory = consumePendingToolsCategory();
    const activeCategory = pendingCategory
      ? getCategorySlug(pendingCategory)
      : this.data.activeCategory;
    this.setData({
      activeCategory,
      favoriteIds,
      recentTools,
      visibleTools: filterTools({
        activeCategory,
        query: this.data.query,
        favoriteIds,
        recentTools,
      }),
    });
  },

  setCategory(event) {
    const activeCategory = getCategorySlug(event.currentTarget.dataset.slug);
    const visibleTools = filterTools({
      activeCategory,
      query: this.data.query,
      favoriteIds: this.data.favoriteIds,
      recentTools: this.data.recentTools,
    });
    this.setData({ activeCategory, visibleTools });
  },

  handleSearchInput(event) {
    const query = event.detail.value;
    const visibleTools = filterTools({
      activeCategory: this.data.activeCategory,
      query,
      favoriteIds: this.data.favoriteIds,
      recentTools: this.data.recentTools,
    });
    this.setData({ query, visibleTools });
  },

  openTool(event) {
    const tool = event.detail;
    if (!tool?.slug) return;
    wx.navigateTo({
      url: `/pages/tool-runtime/index?slug=${encodeURIComponent(tool.slug)}`,
    });
  },
});
