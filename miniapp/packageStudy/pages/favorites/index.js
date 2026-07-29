const studyStorage = require('../../utils/storage');
const sessionUtil = require('../../utils/session');
const helpers = require('../../utils/helpers');

Page({
  data: {
    items: [],
    isEmpty: true,
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    var items = studyStorage.getFavorites().map(function (q) {
      return Object.assign({}, q, {
        kindLabel: helpers.kindShortLabel(helpers.detectQuestionKind(q)),
        answerLabel: helpers.normalizeChoiceAnswer(q.answer),
      });
    });
    this.setData({ items: items, isEmpty: items.length === 0 });
  },

  onRemove(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    var question = (this.data.items || []).find(function (q) {
      return q.id === id;
    });
    if (question) studyStorage.toggleFavorite(question);
    this.refresh();
  },

  onRestudy() {
    var items = studyStorage.getFavorites();
    if (!items.length) {
      wx.showToast({ title: '暂无收藏', icon: 'none' });
      return;
    }
    var session = sessionUtil.createSession({
      deckId: 'favorites',
      deckName: '收藏夹',
      mode: 'practice',
      questions: items,
    });
    if (!session) {
      wx.showToast({ title: '无法开始复学', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/packageStudy/pages/practice/index?resume=1' });
  },
});
