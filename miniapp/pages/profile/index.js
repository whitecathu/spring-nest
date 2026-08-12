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
      return this.saveLocalProfile((this.data.user && this.data.user.nickName) || '', url, true);
    }
  },

  onNickInput(e) {
    const value = (e && e.detail && e.detail.value) || '';
    this.setData({ draftNickName: value });
  },

  saveLocalProfile(nickName, avatarUrl, replacingAvatar) {
    wx.showLoading({ title: '保存中', mask: true });
    return auth
      .loginWithProfile({ nickName: nickName, avatarUrl: avatarUrl })
      .then((user) => {
        wx.hideLoading();
        this.setData({ draftAvatarUrl: user.avatarUrl || '' });
        this.refreshUser();
        wx.showToast({
          title: replacingAvatar ? '头像已保存' : '已保存到本机',
          icon: 'success',
        });
        return user;
      })
      .catch((err) => {
        wx.hideLoading();
        if (replacingAvatar) {
          const current = auth.getUser();
          this.setData({ draftAvatarUrl: (current && current.avatarUrl) || '' });
          this.refreshUser();
        }
        wx.showToast({ title: (err && err.message) || '保存失败', icon: 'none' });
        return null;
      });
  },

  onLogin() {
    const nickName = String(this.data.draftNickName || '').trim();
    const avatarUrl = this.data.draftAvatarUrl || '';
    if (!nickName) {
      wx.showToast({ title: '请先填写昵称', icon: 'none' });
      return;
    }

    const doLogin = () => {
      this.saveLocalProfile(nickName, avatarUrl, false);
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
      title: '清除本机资料',
      content: '将清除本机保存的头像与昵称，不影响收藏与工具数据。不会触及任何云端账号。',
      success: (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '清除中', mask: true });
        auth
          .logout()
          .then(() => {
            wx.hideLoading();
            this.setData({ draftNickName: '', draftAvatarUrl: '' });
            this.refreshUser();
            wx.showToast({ title: '已清除', icon: 'none' });
          })
          .catch((err) => {
            wx.hideLoading();
            wx.showToast({ title: (err && err.message) || '清除失败', icon: 'none' });
          });
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
