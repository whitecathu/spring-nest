const studyStorage = require('../../utils/storage');
const sessionUtil = require('../../utils/session');
const helpers = require('../../utils/helpers');

Page({
  data: {
    deckId: '',
    deck: null,
    mode: 'reccite',
    dailyPlanCount: 50,
    dailyPlanMax: 100,
    examQuestionCount: 50,
    examDurationMinutes: 60,
    kindStats: [],
    activeDeckSession: null,
    resumeMeta: '',
    incorrectCount: 0,
    favoriteCount: 0,
    questionCount: 0,
  },

  onLoad(query) {
    this.deckId = (query && query.id) || '';
    this.setData({ deckId: this.deckId });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    var deck = studyStorage.getDeckById(this.deckId);
    if (!deck) {
      wx.showToast({ title: '题集不存在', icon: 'none' });
      setTimeout(function () {
        wx.navigateBack({ fail: function () {
          wx.redirectTo({ url: '/packageStudy/pages/home/index' });
        }});
      }, 400);
      return;
    }

    var examSettings = sessionUtil.getExamSettings();
    var questionCount = deck.questions.length;
    var effectiveExamCount = Math.min(
      examSettings.questionCount,
      Math.max(questionCount, 1)
    );
    var dailyPlanMax = Math.max(questionCount, 100);
    var dailyPlanCount = Math.min(this.data.dailyPlanCount || 50, dailyPlanMax);
    if (dailyPlanCount < 5) dailyPlanCount = Math.min(5, dailyPlanMax);

    var activeSession = sessionUtil.loadActiveSession();
    var activeDeckSession =
      activeSession && activeSession.deckId === deck.id ? activeSession : null;

    var incorrect = studyStorage.getIncorrect().filter(function (q) {
      return deck.questions.some(function (item) {
        return item.id === q.id;
      });
    });
    var favorites = studyStorage.getFavorites().filter(function (q) {
      return deck.questions.some(function (item) {
        return item.id === q.id;
      });
    });

    var kindStats = helpers.getQuestionKindStats(deck.questions);

    this.setData({
      deck: deck,
      questionCount: questionCount,
      kindStats: kindStats,
      dailyPlanCount: dailyPlanCount,
      dailyPlanMax: dailyPlanMax,
      examQuestionCount: effectiveExamCount,
      examDurationMinutes: examSettings.durationMinutes,
      activeDeckSession: activeDeckSession,
      resumeMeta: activeDeckSession
        ? '已停在第 ' +
          (activeDeckSession.currentQuestionIdx + 1) +
          ' / ' +
          activeDeckSession.questions.length +
          ' 题'
        : '',
      incorrectCount: incorrect.length,
      favoriteCount: favorites.length,
    });
    wx.setNavigationBarTitle({ title: deck.name || '题集详情' });
  },

  onSelectMode(e) {
    var mode = e.currentTarget.dataset.mode;
    if (mode) this.setData({ mode: mode });
  },

  onDailyPlanChanging(e) {
    var value = Number(e.detail.value);
    this.setData({ dailyPlanCount: value });
  },

  onExamCountInput(e) {
    var value = helpers.clampNumber(parseInt(e.detail.value, 10), 1, Math.max(this.data.questionCount, 1));
    sessionUtil.saveExamSettings({
      questionCount: value,
      durationMinutes: this.data.examDurationMinutes,
    });
    this.setData({ examQuestionCount: value });
  },

  onExamDurationInput(e) {
    var value = helpers.clampNumber(parseInt(e.detail.value, 10), 5, 240);
    sessionUtil.saveExamSettings({
      questionCount: this.data.examQuestionCount,
      durationMinutes: value,
    });
    this.setData({ examDurationMinutes: value });
  },

  startWithQuestions(questions, mode, examOverride) {
    if (!questions || !questions.length) {
      wx.showToast({ title: '暂无题目', icon: 'none' });
      return;
    }
    var deck = this.data.deck;
    var session = sessionUtil.createSession({
      deckId: deck.id,
      deckName: deck.name,
      mode: mode || this.data.mode,
      questions: questions,
      examSettings: examOverride || {
        questionCount: this.data.examQuestionCount,
        durationMinutes: this.data.examDurationMinutes,
      },
    });
    if (!session) {
      wx.showToast({ title: '无法开始练习', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/packageStudy/pages/practice/index?resume=1' });
  },

  onStartReview() {
    var count = this.data.dailyPlanCount || 50;
    var questions = this.data.deck.questions.slice(0, count);
    this.startWithQuestions(questions, this.data.mode);
  },

  onStartExam() {
    this.startWithQuestions(this.data.deck.questions, 'exam', {
      questionCount: this.data.examQuestionCount,
      durationMinutes: this.data.examDurationMinutes,
    });
  },

  onStartKind(e) {
    var kind = e.currentTarget.dataset.kind;
    var action = e.currentTarget.dataset.action;
    var stat = (this.data.kindStats || []).find(function (item) {
      return item.kind === kind;
    });
    if (!stat || !stat.count) {
      wx.showToast({ title: '该题型暂无题目', icon: 'none' });
      return;
    }
    this.startWithQuestions(stat.questions, action === 'practice' ? 'practice' : 'reccite');
  },

  onStartIncorrect() {
    var deck = this.data.deck;
    var items = studyStorage.getIncorrect().filter(function (q) {
      return deck.questions.some(function (item) {
        return item.id === q.id;
      });
    });
    this.startWithQuestions(items, 'practice');
  },

  onStartFavorites() {
    var deck = this.data.deck;
    var items = studyStorage.getFavorites().filter(function (q) {
      return deck.questions.some(function (item) {
        return item.id === q.id;
      });
    });
    this.startWithQuestions(items, 'practice');
  },

  onResumeSession() {
    if (!sessionUtil.loadActiveSession()) {
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

  onDeleteDeck() {
    var that = this;
    var deck = this.data.deck;
    if (!deck) return;
    wx.showModal({
      title: '删除题库确认',
      content: '确定要删除「' + deck.name + '」吗？该操作不可撤销。',
      confirmText: '确认删除',
      confirmColor: '#B23838',
      success: function (res) {
        if (!res.confirm) return;
        var session = sessionUtil.loadActiveSession();
        if (session && session.deckId === deck.id) {
          sessionUtil.clearActiveSession();
        }
        studyStorage.deleteDeck(deck.id);
        wx.showToast({ title: '已删除', icon: 'success' });
        setTimeout(function () {
          wx.redirectTo({ url: '/packageStudy/pages/home/index' });
        }, 400);
      },
    });
  },
});
