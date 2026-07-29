const history = require('../../utils/history');
const catalog = require('../../utils/catalog');
const toast = require('../../utils/toast');

Page({
  data: {
    records: [],
    empty: true,
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const records = history
      .getHistory()
      .map((r) => {
        const tool = catalog.findBySlug(r.toolId);
        if (!tool) return null;
        return Object.assign({}, r, {
          timeText: history.formatHistoryTime(r.openedAt),
          tool: tool,
        });
      })
      .filter(Boolean);
    this.setData({ records, empty: records.length === 0 });
  },

  onOpen(e) {
    const slug = e.currentTarget.dataset.slug;
    const tool = catalog.findBySlug(slug);
    if (tool) catalog.openTool(tool);
  },

  onRemove(e) {
    const id = e.currentTarget.dataset.id;
    history.removeHistoryItem(id);
    this.refresh();
  },

  onClear() {
    wx.showModal({
      title: '清空记录',
      content: '确定清空全部使用记录？',
      success: (res) => {
        if (res.confirm) {
          history.clearHistory();
          this.refresh();
          toast.showToast('已清空');
        }
      },
    });
  },
});
