Page({
  data: {
    version: 'V1.0.0',
  },

  onOpenPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/index' });
  },
});
