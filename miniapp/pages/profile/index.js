const auth = require('../../utils/auth');
const favorites = require('../../utils/favorites');
const history = require('../../utils/history');

Page({
  data: {
    loggedIn: false,
    user: null,
    draftNickName: '',
    draftAvatarUrl: '',
    favCount: 0,
    histCount: 0,
    version: '1.0.0',
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.refreshUser();
    this.refreshCounts();
  },

  refreshUser() {
    const user = auth.getUser();
    this.setData({
      loggedIn: !!user,
      user: user,
      draftNickName: (user && user.nickName) || this.data.draftNickName || '',
      draftAvatarUrl: this.data.draftAvatarUrl || (user && user.avatarUrl) || '',
    });
  },

  refreshCounts() {
    const favs = favorites.getFavorites() || [];
    const records = history.getHistory() || [];
    this.setData({
      favCount: favs.length,
      histCount: records.length,
    });
  },

  onChooseAvatar(e) {
    const url = e && e.detail && e.detail.avatarUrl;
    if (!url) return;
    this.setData({ draftAvatarUrl: url });
    if (this.data.loggedIn) {
      const user = Object.assign({}, this.data.user || {}, { avatarUrl: url });
      auth.setUser(user);
      this.refreshUser();
    }
  },

  onNickInput(e) {
    const value = (e && e.detail && e.detail.value) || '';
    this.setData({ draftNickName: value });
  },

  onLogin() {
    const nickName = String(this.data.draftNickName || '').trim();
    const avatarUrl = this.data.draftAvatarUrl || '';
    if (!nickName) {
      wx.showToast({ title: '请先填写昵称', icon: 'none' });
      return;
    }

    const doLogin = () => {
      wx.showLoading({ title: '登录中', mask: true });
      auth
        .loginWithProfile({ nickName: nickName, avatarUrl: avatarUrl })
        .then(() => {
          wx.hideLoading();
          wx.showToast({ title: '登录成功', icon: 'success' });
          this.refreshUser();
        })
        .catch((err) => {
          wx.hideLoading();
          wx.showToast({ title: (err && err.message) || '登录失败', icon: 'none' });
        });
    };

    if (typeof wx.requirePrivacyAuthorize === 'function') {
      wx.requirePrivacyAuthorize({
        success: doLogin,
        fail: () => {
          wx.navigateTo({ url: '/pages/privacy/index?needAuth=1' });
        },
      });
      return;
    }
    doLogin();
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '将清除本机保存的头像与昵称，不影响收藏与工具数据。',
      success: (res) => {
        if (!res.confirm) return;
        auth.logout();
        this.setData({ draftNickName: '', draftAvatarUrl: '' });
        this.refreshUser();
        wx.showToast({ title: '已退出', icon: 'none' });
      },
    });
  },

  onOpenFavorites() {
    wx.navigateTo({ url: '/pages/favorites/index' });
  },

  onOpenHistory() {
    wx.navigateTo({ url: '/pages/history/index' });
  },

  onOpenPrivacy() {
    wx.navigateTo({ url: '/pages/privacy/index' });
  },

  onOpenAbout() {
    wx.navigateTo({ url: '/pages/about/index' });
  },
});
