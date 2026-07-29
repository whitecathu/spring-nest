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
    var items = studyStorage.getIncorrect().map(function (q) {
      return Object.assign({}, q, {
        kindLabel: helpers.kindShortLabel(helpers.detectQuestionKind(q)),
        answerLabel: helpers.normalizeChoiceAnswer(q.answer),
      });
    });
    this.setData({ items: items, isEmpty: items.length === 0 });
  },

  onClearAll() {
    var that = this;
    if (!this.data.items.length) return;
    wx.showModal({
      title: '清空错题本',
      content: '确定清空全部错题记录吗？',
      confirmText: '清空',
      confirmColor: '#B23838',
      success: function (res) {
        if (!res.confirm) return;
        studyStorage.saveIncorrect([]);
        that.refresh();
      },
    });
  },

  onRemove(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    studyStorage.removeIncorrectByIds([id]);
    this.refresh();
  },

  onRestudy() {
    var items = studyStorage.getIncorrect();
    if (!items.length) {
      wx.showToast({ title: '暂无错题', icon: 'none' });
      return;
    }
    var session = sessionUtil.createSession({
      deckId: 'incorrect',
      deckName: '错题本',
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
