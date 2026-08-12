const studyStorage = require('../../utils/storage');

Page({
  data: {
    streakDays: 0,
    todayCount: 0,
    correctRate: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    totalSessions: 0,
    studyMinutes: 0,
    studyTimeLabel: '分钟',
    masteredCount: 0,
    totalQuestions: 0,
    dailyCounts: [],
    dailyMax: 1,
    deckStats: [],
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    var stats = studyStorage.getStats();
    var decks = studyStorage.getDecks();
    var totalQuestions = 0;
    var masteredCount = 0;
    var deckStats = decks
      .map(function (deck) {
        var total = deck.questions.length;
        var mastered = deck.questions.filter(function (q) {
          return q.mastered;
        }).length;
        totalQuestions += total;
        masteredCount += mastered;
        return {
          id: deck.id,
          name: deck.name,
          emoji: deck.emoji,
          total: total,
          mastered: mastered,
          rate: total > 0 ? Math.round((mastered / total) * 100) : 0,
        };
      })
      .filter(function (item) {
        return item.total > 0;
      })
      .slice(0, 5);

    var dailyCounts = (stats.dailyCounts || [0, 0, 0, 0, 0, 0, 0]).map(function (value) {
      return Number(value) || 0;
    });
    var dailyMax = 1;
    dailyCounts.forEach(function (value) {
      if (value > dailyMax) dailyMax = value;
    });
    var studyMinutes = Math.round((stats.studySeconds || 0) / 60);
    var studyTimeValue = studyMinutes >= 60 ? Math.round(studyMinutes / 60) : studyMinutes;
    var studyTimeLabel = studyMinutes >= 60 ? '小时' : '分钟';

    this.setData({
      streakDays: stats.streakDays || 0,
      todayCount: stats.todayCount || 0,
      correctRate: stats.correctRate || 0,
      totalAnswered: stats.totalAnswered || 0,
      totalCorrect: stats.totalCorrect || 0,
      totalSessions: stats.totalSessions || 0,
      studyMinutes: studyTimeValue,
      studyTimeLabel: studyTimeLabel,
      masteredCount: masteredCount,
      totalQuestions: totalQuestions,
      dailyCounts: dailyCounts.map(function (value) {
        return {
          value: value,
          height: Math.max(8, Math.round((value / dailyMax) * 100)),
        };
      }),
      dailyMax: dailyMax,
      deckStats: deckStats,
    });
  },
});
