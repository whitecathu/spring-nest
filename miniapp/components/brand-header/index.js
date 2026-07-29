Component({
  properties: {},
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
  },
  lifetimes: {
    attached() {
      let statusBarHeight = 20;
      let navBarHeight = 44;
      try {
        if (typeof wx.getWindowInfo === 'function') {
          const win = wx.getWindowInfo();
          statusBarHeight = Math.max(0, (win && win.statusBarHeight) || 20);
        } else if (typeof wx.getSystemInfoSync === 'function') {
          const sys = wx.getSystemInfoSync();
          statusBarHeight = Math.max(0, (sys && sys.statusBarHeight) || 20);
        }
      } catch (e) {
        statusBarHeight = 20;
      }

      try {
        const menu = wx.getMenuButtonBoundingClientRect();
        if (menu && menu.height > 0 && menu.top >= statusBarHeight) {
          navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height;
        }
      } catch (e) {
        navBarHeight = 44;
      }

      if (!navBarHeight || navBarHeight < 32 || navBarHeight > 72) {
        navBarHeight = 44;
      }

      this.setData({ statusBarHeight, navBarHeight });
    },
  },
});
