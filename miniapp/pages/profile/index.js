const {
  clearMiniProgramLocalData,
  getFavoriteToolIds,
  getRecentTools,
} = require('../../utils/storage');

Page({
  data: {
    favoriteCount: 0,
    recentCount: 0,
  },

  onShow() {
    this.refreshStats();
  },

  refreshStats() {
    this.setData({
      favoriteCount: getFavoriteToolIds().length,
      recentCount: getRecentTools().length,
    });
  },

  clearLocalData() {
    wx.showModal({
      title: '清理本地数据',
      content: '这会清空收藏和最近使用记录，不影响当前 Web 端。',
      confirmText: '清理',
      confirmColor: '#C2410C',
      success: (result) => {
        if (!result.confirm) return;
        clearMiniProgramLocalData();
        this.refreshStats();
        wx.showToast({
          title: '已清理',
          icon: 'success',
        });
      },
    });
  },
});
