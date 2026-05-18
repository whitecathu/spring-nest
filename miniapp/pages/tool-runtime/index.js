const { tools } = require('../../data/tools');
const {
  isFavoriteTool,
  recordRecentTool,
  toggleFavoriteTool,
} = require('../../utils/storage');

function findTool(slug) {
  return tools.find((tool) => tool.slug === slug);
}

function decodeSlug(slug) {
  try {
    return decodeURIComponent(slug || '');
  } catch (error) {
    return slug || '';
  }
}

Page({
  data: {
    slug: '',
    tool: null,
    favorite: false,
    statusTitle: '工具工作台',
    statusContent: '基础入口已建立。每个工具的专属交互会按工具批次接入。',
  },

  onLoad(options) {
    const slug = decodeSlug(options.slug);
    const tool = findTool(slug);

    if (!tool) {
      wx.setNavigationBarTitle({ title: '工具不存在' });
      this.setData({
        slug,
        statusTitle: '没有找到工具',
        statusContent: '请返回工具列表重新选择。',
      });
      return;
    }

    recordRecentTool(tool);
    wx.setNavigationBarTitle({ title: tool.title });
    this.setData({
      slug,
      tool,
      favorite: isFavoriteTool(tool.id),
      statusTitle: tool.title,
      statusContent: `${tool.miniCategoryTitle} · ${tool.workbenchType}`,
    });
  },

  handlePrimaryAction() {
    if (this.data.tool) {
      this.copyToolSummary();
      return;
    }
    this.backToTools();
  },

  toggleFavorite() {
    if (!this.data.tool) return;
    const nextFavorites = toggleFavoriteTool(this.data.tool.id);
    const favorite = nextFavorites.includes(this.data.tool.id);
    this.setData({ favorite });
    wx.showToast({
      title: favorite ? '已收藏' : '已取消',
      icon: 'success',
    });
  },

  copyToolSummary() {
    if (!this.data.tool) return;
    wx.setClipboardData({
      data: `${this.data.tool.title}：${this.data.tool.description}`,
    });
  },

  backToTools() {
    wx.switchTab({
      url: '/pages/tools/index',
    });
  },
});
