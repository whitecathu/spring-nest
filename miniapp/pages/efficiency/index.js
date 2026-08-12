const catalog = require('../../utils/catalog');

Page({
  data: {
    timeTools: [],
    learningTools: [],
    docTools: [],
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    const learning = catalog
      .getBySection('learning')
      .slice()
      .sort((a, b) => {
        if (a.slug === 'question-bank-importer') return -1;
        if (b.slug === 'question-bank-importer') return 1;
        return (b.homePriority || 0) - (a.homePriority || 0);
      });
    this.setData({
      timeTools: catalog.getBySection('time'),
      learningTools: learning,
      docTools: catalog.getBySection('doc'),
    });
  },

  onOpenTool(e) {
    const tool = (e.detail && e.detail.tool) || e.currentTarget.dataset.tool;
    if (!tool) return;
    if (tool.slug === 'question-bank-importer') {
      wx.navigateTo({ url: '/packageStudy/pages/home/index' });
      return;
    }
    catalog.openTool(tool);
  },
});
