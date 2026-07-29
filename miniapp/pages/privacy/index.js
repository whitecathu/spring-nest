Page({
  data: {
    needAuth: false,
  },

  onLoad(query) {
    this.setData({
      needAuth: !!(query && (query.needAuth === '1' || query.needAuth === 1)),
    });
  },

  onAgreePrivacy() {
    const app = getApp();
    if (app && typeof app.resolvePrivacy === 'function') {
      app.resolvePrivacy(true);
    }
    wx.showToast({ title: '已同意', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack({ fail() {} });
    }, 400);
  },

  onDisagreePrivacy() {
    const app = getApp();
    if (app && typeof app.resolvePrivacy === 'function') {
      app.resolvePrivacy(false);
    }
    wx.navigateBack({
      fail() {
        wx.switchTab({ url: '/pages/discover/index' });
      },
    });
  },
});
