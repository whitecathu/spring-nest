const fonts = require('./utils/fonts');

App({
  onLaunch() {
    this.initPrivacy();
    this.initFonts();
  },

  onShow() {},

  onError() {},

  initFonts() {
    fonts
      .loadBrandFonts()
      .then((summary) => {
        this.globalData.fontsReady = true;
        this.globalData.fontsLoaded = summary.loaded;
      })
      .catch(() => {
        this.globalData.fontsReady = true;
        this.globalData.fontsLoaded = 0;
      });
  },

  initPrivacy() {
    if (typeof wx.onNeedPrivacyAuthorization === 'function') {
      wx.onNeedPrivacyAuthorization((resolve) => {
        this.globalData.privacyResolve = resolve;
        // 引导至隐私页完成同意；若已在协议页可由按钮 resolve
        const pages = getCurrentPages();
        const current = pages && pages.length ? pages[pages.length - 1] : null;
        const route = current && current.route ? '/' + current.route : '';
        if (route.indexOf('pages/privacy/index') === -1) {
          wx.navigateTo({
            url: '/pages/privacy/index?needAuth=1',
            fail() {
              // 导航失败时仍 resolve，避免永久阻塞；用户可稍后在关于页查看
              try {
                resolve({ event: 'disagree' });
              } catch (e) {}
            },
          });
        }
      });
    }
  },

  resolvePrivacy(agreed) {
    const resolve = this.globalData.privacyResolve;
    this.globalData.privacyResolve = null;
    if (typeof resolve === 'function') {
      try {
        resolve({ event: agreed ? 'agree' : 'disagree' });
      } catch (e) {}
    }
  },

  globalData: {
    brand: '春日小筑',
    privacyResolve: null,
    fontsReady: false,
    fontsLoaded: 0,
  },
});
