Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/discover/index',
        text: '发现',
        iconPath: '/assets/icons/tab-discover.png',
        selectedIconPath: '/assets/icons/tab-discover-active.png',
      },
      {
        pagePath: '/pages/development/index',
        text: '开发',
        iconPath: '/assets/icons/tab-dev.png',
        selectedIconPath: '/assets/icons/tab-dev-active.png',
      },
      {
        pagePath: '/pages/efficiency/index',
        text: '效率',
        iconPath: '/assets/icons/tab-efficiency.png',
        selectedIconPath: '/assets/icons/tab-efficiency-active.png',
      },
      {
        pagePath: '/pages/profile/index',
        text: '我的',
        iconPath: '/assets/icons/tab-profile.png',
        selectedIconPath: '/assets/icons/tab-profile-active.png',
      },
    ],
  },

  methods: {
    onSwitch(e) {
      const index = Number(e.currentTarget.dataset.index);
      const item = this.data.list[index];
      if (!item) return;
      wx.switchTab({ url: item.pagePath });
    },
  },
});
