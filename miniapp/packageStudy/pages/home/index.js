const studyStorage = require('../../utils/storage');
const sessionUtil = require('../../utils/session');
const sample = require('../../utils/sample');
const helpers = require('../../utils/helpers');

Page({
  data: {
    decks: [],
    filteredDecks: [],
    searchQuery: '',
    searchHint: '',
    activeSession: null,
    resumeLabel: '',
    resumeMeta: '',
    isEmpty: true,
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    var decks = studyStorage.getDecks().map(function (deck) {
      var total = deck.questions.length;
      var mastered = deck.questions.filter(function (q) {
        return q.mastered;
      }).length;
      var masteryRate = total > 0 ? Math.round((mastered / total) * 100) : 0;
      return Object.assign({}, deck, {
        questionCount: total,
        masteryRate: masteryRate,
        lastReviewedLabel: deck.lastReviewed || '尚未复习',
      });
    });
    var activeSession = sessionUtil.loadActiveSession();
    var resumeLabel = '';
    var resumeMeta = '';
    if (activeSession) {
      resumeLabel = '继续' + helpers.modeLabel(activeSession.mode);
      resumeMeta =
        (activeSession.deckName || '上次题集') +
        ' · 第 ' +
        (activeSession.currentQuestionIdx + 1) +
        ' / ' +
        activeSession.questions.length +
        ' 题';
      if (activeSession.mode === 'exam' && activeSession.examAnswers) {
        resumeMeta += ' · 已答 ' + Object.keys(activeSession.examAnswers).length + ' 题';
      }
    }
    this.setData({
      decks: decks,
      isEmpty: decks.length === 0,
      activeSession: activeSession,
      resumeLabel: resumeLabel,
      resumeMeta: resumeMeta,
    });
    this.applySearch(this.data.searchQuery || '');
  },

  applySearch(query) {
    var normalized = String(query || '')
      .trim()
      .toLowerCase();
    var decks = this.data.decks || [];
    var filtered = decks;
    var matchTotal = 0;
    if (normalized) {
      filtered = decks
        .map(function (deck) {
          var deckText = [deck.name, deck.desc, deck.emoji].filter(Boolean).join(' ').toLowerCase();
          var deckMatches = deckText.indexOf(normalized) >= 0;
          var matchCount = deck.questions.reduce(function (count, q) {
            var text = [q.stem, q.answer, q.explanation, q.category, q.tag]
              .concat(q.options || [])
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            return text.indexOf(normalized) >= 0 ? count + 1 : count;
          }, 0);
          matchTotal += matchCount;
          return Object.assign({}, deck, {
            matchCount: matchCount,
            deckMatches: deckMatches,
          });
        })
        .filter(function (item) {
          return item.deckMatches || item.matchCount > 0;
        });
    }
    this.setData({
      filteredDecks: filtered,
      searchHint: normalized
        ? '找到 ' + filtered.length + ' 个题集，命中 ' + matchTotal + ' 道题。'
        : '',
    });
  },

  onSearchInput(e) {
    var value = (e.detail && e.detail.value) || '';
    this.setData({ searchQuery: value });
    this.applySearch(value);
  },

  onClearSearch() {
    this.setData({ searchQuery: '' });
    this.applySearch('');
  },

  goImport() {
    wx.navigateTo({ url: '/packageStudy/pages/import/index' });
  },

  goIncorrect() {
    wx.navigateTo({ url: '/packageStudy/pages/incorrect/index' });
  },

  goFavorites() {
    wx.navigateTo({ url: '/packageStudy/pages/favorites/index' });
  },

  goStats() {
    wx.navigateTo({ url: '/packageStudy/pages/stats/index' });
  },

  goDeck(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: '/packageStudy/pages/set-detail/index?id=' + encodeURIComponent(id) });
  },

  onResumeSession() {
    var session = sessionUtil.loadActiveSession();
    if (!session) {
      wx.showToast({ title: '没有可继续的进度', icon: 'none' });
      this.refresh();
      return;
    }
    wx.navigateTo({ url: '/packageStudy/pages/practice/index?resume=1' });
  },

  onDiscardSession() {
    var that = this;
    wx.showModal({
      title: '放弃进度',
      content: '确定放弃当前未完成的学习会话吗？',
      confirmText: '放弃',
      confirmColor: '#B23838',
      success: function (res) {
        if (!res.confirm) return;
        sessionUtil.clearActiveSession();
        that.refresh();
      },
    });
  },

  onSeedSample() {
    sample.seedSampleDeck();
    wx.showToast({ title: '已加入示例题集', icon: 'success' });
    this.refresh();
  },
});
