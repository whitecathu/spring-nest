const catalog = require('../../utils/catalog');

Page({
  data: {
    devTools: [],
    securityTools: [],
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.setData({
      devTools: catalog.getBySection('dev'),
      securityTools: catalog.getBySection('security'),
    });
  },

  onOpenTool(e) {
    const tool = (e.detail && e.detail.tool) || e.currentTarget.dataset.tool;
    catalog.openTool(tool);
  },
});
