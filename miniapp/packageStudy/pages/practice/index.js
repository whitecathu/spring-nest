const studyStorage = require('../../utils/storage');
const sessionUtil = require('../../utils/session');
const helpers = require('../../utils/helpers');
const deadlineTimer = require('../../../utils/deadline-timer');

Page({
  data: {
    ready: false,
    mode: 'practice',
    modeLabel: '刷题',
    statusBarHeight: 20,
    questions: [],
    currentIdx: 0,
    currentQuestion: null,
    optionsView: [],
    selectedOption: null,
    hasCheckedAnswer: false,
    isCorrect: null,
    showExplanation: false,
    practiceComplete: false,
    correctCount: 0,
    progressPercent: 0,
    totalCount: 0,
    isFavorite: false,
    isMulti: false,
    examTimeRemaining: 0,
    examTimerText: '',
    showJump: false,
    jumpValue: '',
    reportCorrectRate: 0,
    deckName: '',
  },

  _session: null,
  _timer: null,
  _completeLocked: false,
  _persistTimer: null,

  onLoad(query) {
    this._completeLocked = false;
    var statusBarHeight = 20;
    try {
      var win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      statusBarHeight = (win && win.statusBarHeight) || 20;
    } catch (e) {}
    this.setData({ statusBarHeight: statusBarHeight });

    var session = sessionUtil.loadActiveSession();
    if (!session) {
      wx.showToast({ title: '没有进行中的练习', icon: 'none' });
      setTimeout(function () {
        wx.navigateBack({
          fail: function () {
            wx.redirectTo({ url: '/packageStudy/pages/home/index' });
          },
        });
      }, 400);
      return;
    }
    this._session = session;
    this.applySessionToView(session);
    if (session.mode === 'exam') {
      this.startExamTimer();
    }
  },

  onUnload() {
    this.clearTimers();
    this.persistSession(true);
  },

  onHide() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this.persistSession(true);
  },

  onShow() {
    if (this._session && this._session.mode === 'exam' && !this.data.practiceComplete) {
      this.startExamTimer();
    }
  },

  clearTimers() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    if (this._persistTimer) {
      clearTimeout(this._persistTimer);
      this._persistTimer = null;
    }
  },

  formatTimer(seconds) {
    var s = Math.max(0, seconds || 0);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return helpers.pad2(m) + ':' + helpers.pad2(r);
  },

  startExamTimer() {
    var that = this;
    if (this._timer) clearInterval(this._timer);
    var update = function () {
      if (!that._session || that.data.practiceComplete) return;
      var deadline = that._session.examDeadline;
      if (typeof deadline !== 'number' || !Number.isFinite(deadline)) {
        deadline = deadlineTimer.createDeadline(Math.max(1, that._session.examTimeRemaining || 0));
        that._session.examDeadline = deadline;
      }
      var remain = deadlineTimer.getRemainingSeconds(deadline);
      that._session.examTimeRemaining = remain;
      that.setData({
        examTimeRemaining: remain,
        examTimerText: that.formatTimer(remain),
      });
      if (remain <= 0) {
        that.finishExam();
      }
    };
    update();
    if (!this._session || this.data.practiceComplete) return;
    this._timer = setInterval(function () {
      update();
      if (!that._session || that.data.practiceComplete) return;
      that.persistSession(false);
    }, 1000);
  },

  applySessionToView(session) {
    var idx = session.currentQuestionIdx || 0;
    var question = session.questions[idx];
    var selectedOption = session.selectedOption;
    if (session.mode === 'exam' && question && session.examAnswers) {
      selectedOption = session.examAnswers[question.id] || null;
    }
    this.setData({
      ready: true,
      mode: session.mode,
      modeLabel: helpers.modeLabel(session.mode),
      questions: session.questions,
      currentIdx: idx,
      currentQuestion: question,
      selectedOption: selectedOption,
      hasCheckedAnswer: session.hasCheckedAnswer,
      isCorrect: session.isCorrect,
      showExplanation: session.showExplanation,
      practiceComplete: false,
      correctCount: session.correctCountInSession || 0,
      progressPercent: Math.round(((idx + 1) / session.questions.length) * 100),
      totalCount: session.questions.length,
      isFavorite: studyStorage.isFavorite(question && question.id),
      isMulti: helpers.isMultiChoiceQuestion(question),
      examTimeRemaining: session.examTimeRemaining || 0,
      examTimerText: this.formatTimer(session.examTimeRemaining || 0),
      deckName: session.deckName || '',
      optionsView: this.buildOptionsView(question, selectedOption, session),
    });
  },

  buildOptionsView(question, selectedOption, session) {
    if (!question) return [];
    var mode = session.mode;
    var hasChecked = session.hasCheckedAnswer;
    var answerNorm = helpers.normalizeChoiceAnswer(question.answer);
    var selectedNorm = helpers.normalizeChoiceAnswer(selectedOption);

    return (question.options || []).map(function (opt) {
      var letter = helpers.optionLetter(opt);
      var isSelected = selectedNorm.indexOf(letter) >= 0;
      var isCorrectOption = answerNorm.indexOf(letter) >= 0;
      var state = 'idle';

      if (mode === 'exam') {
        state = isSelected ? 'selected' : 'idle';
      } else if (mode === 'reccite') {
        state = isCorrectOption ? 'correct' : 'dim';
      } else if (hasChecked) {
        if (isCorrectOption) state = 'correct';
        else if (isSelected) state = 'wrong';
        else state = 'dim';
      } else if (isSelected) {
        state = 'selected';
      }

      return {
        text: opt,
        letter: letter,
        state: state,
      };
    });
  },

  syncSessionFields() {
    if (!this._session) return;
    this._session.currentQuestionIdx = this.data.currentIdx;
    this._session.selectedOption = this.data.selectedOption;
    this._session.hasCheckedAnswer = this.data.hasCheckedAnswer;
    this._session.isCorrect = this.data.isCorrect;
    this._session.showExplanation = this.data.showExplanation;
    this._session.correctCountInSession = this.data.correctCount;
  },

  persistSession(immediate) {
    if (!this._session || this.data.practiceComplete) return;
    this.syncSessionFields();
    var that = this;
    var flush = function () {
      that._persistTimer = null;
      sessionUtil.saveActiveSession(that._session);
    };
    if (immediate) {
      if (this._persistTimer) {
        clearTimeout(this._persistTimer);
        this._persistTimer = null;
      }
      flush();
      return;
    }
    if (this._persistTimer) return;
    var delay = this._session.mode === 'exam' ? 1000 : 600;
    this._persistTimer = setTimeout(flush, delay);
  },

  goToIndex(nextIdx) {
    if (!this._session) return;
    var questions = this._session.questions;
    var idx = helpers.clampNumber(nextIdx, 0, questions.length - 1);
    var question = questions[idx];
    var selectedOption = null;
    var hasChecked = false;
    var isCorrect = null;
    var showExplanation = false;

    if (this._session.mode === 'reccite') {
      hasChecked = true;
      isCorrect = true;
      showExplanation = true;
    } else if (this._session.mode === 'exam') {
      selectedOption =
        (this._session.examAnswers && this._session.examAnswers[question.id]) || null;
    }

    this._session.currentQuestionIdx = idx;
    this._session.selectedOption = selectedOption;
    this._session.hasCheckedAnswer = hasChecked;
    this._session.isCorrect = isCorrect;
    this._session.showExplanation = showExplanation;

    this.setData({
      currentIdx: idx,
      currentQuestion: question,
      selectedOption: selectedOption,
      hasCheckedAnswer: hasChecked,
      isCorrect: isCorrect,
      showExplanation: showExplanation,
      progressPercent: Math.round(((idx + 1) / questions.length) * 100),
      isFavorite: studyStorage.isFavorite(question && question.id),
      isMulti: helpers.isMultiChoiceQuestion(question),
      optionsView: this.buildOptionsView(question, selectedOption, this._session),
      showJump: false,
      jumpValue: '',
    });
    this.persistSession(false);
  },

  onSelectOption(e) {
    if (!this._session || this.data.practiceComplete) return;
    if (this.data.mode === 'reccite') return;
    if (this.data.mode === 'practice' && this.data.hasCheckedAnswer) return;

    var letter = e.currentTarget.dataset.letter;
    var question = this.data.currentQuestion;
    if (!letter || !question) return;

    var nextSelected;
    if (this.data.mode === 'exam') {
      if (helpers.isMultiChoiceQuestion(question)) {
        nextSelected = helpers.toggleChoiceAnswer(this.data.selectedOption || '', letter);
      } else {
        nextSelected = letter;
      }
      if (!this._session.examAnswers) this._session.examAnswers = {};
      this._session.examAnswers[question.id] = nextSelected;
      this.setData({
        selectedOption: nextSelected,
        optionsView: this.buildOptionsView(question, nextSelected, this._session),
      });
      this.persistSession(false);
      return;
    }

    // practice mode
    if (helpers.isMultiChoiceQuestion(question)) {
      nextSelected = helpers.toggleChoiceAnswer(this.data.selectedOption || '', letter);
      this.setData({
        selectedOption: nextSelected,
        optionsView: this.buildOptionsView(question, nextSelected, this._session),
      });
      this.persistSession(false);
      return;
    }

    nextSelected = letter;
    this.checkAnswer(nextSelected);
  },

  onConfirmMulti() {
    if (!this.data.selectedOption) {
      wx.showToast({ title: '请先选择选项', icon: 'none' });
      return;
    }
    this.checkAnswer(this.data.selectedOption);
  },

  checkAnswer(selected) {
    var question = this.data.currentQuestion;
    if (!question) return;
    var correct = helpers.isChoiceAnswerCorrect(question, selected);
    var correctCount = this.data.correctCount + (correct ? 1 : 0);

    if (correct) {
      studyStorage.removeIncorrectByIds([question.id]);
      studyStorage.markQuestionsMastered([question.id], true);
    } else {
      studyStorage.addIncorrect([question]);
      studyStorage.markQuestionsMastered([question.id], false);
    }

    this._session.hasCheckedAnswer = true;
    this._session.isCorrect = correct;
    this._session.showExplanation = true;
    this._session.selectedOption = selected;
    this._session.correctCountInSession = correctCount;

    this.setData({
      selectedOption: selected,
      hasCheckedAnswer: true,
      isCorrect: correct,
      showExplanation: true,
      correctCount: correctCount,
      optionsView: this.buildOptionsView(question, selected, this._session),
    });
    this.persistSession(false);
  },

  onPrev() {
    if (this.data.currentIdx <= 0) return;
    this.goToIndex(this.data.currentIdx - 1);
  },

  onNext() {
    if (this.data.mode === 'practice' && !this.data.hasCheckedAnswer && !this.data.isMulti) {
      // single choice must check first via tap
    }
    if (this.data.currentIdx >= this.data.totalCount - 1) {
      if (this.data.mode === 'exam') {
        this.finishExam();
      } else if (this.data.mode === 'reccite') {
        this.completeRegularSession(this.data.totalCount, this.data.totalCount);
      } else if (this.data.hasCheckedAnswer) {
        this.completeRegularSession(this.data.totalCount, this.data.correctCount);
      }
      return;
    }

    if (this.data.mode === 'practice' && !this.data.hasCheckedAnswer) {
      if (this.data.isMulti) {
        wx.showToast({ title: '请先确认答案', icon: 'none' });
        return;
      }
    }
    this.goToIndex(this.data.currentIdx + 1);
  },

  onOpenJump() {
    this.setData({
      showJump: true,
      jumpValue: String(this.data.currentIdx + 1),
    });
  },

  onJumpInput(e) {
    this.setData({ jumpValue: (e.detail && e.detail.value) || '' });
  },

  onConfirmJump() {
    var n = parseInt(this.data.jumpValue, 10);
    if (!Number.isFinite(n)) {
      wx.showToast({ title: '请输入题号', icon: 'none' });
      return;
    }
    this.goToIndex(n - 1);
  },

  onCloseJump() {
    this.setData({ showJump: false });
  },

  onToggleFavorite() {
    var question = this.data.currentQuestion;
    if (!question) return;
    var result = studyStorage.toggleFavorite(question);
    this.setData({ isFavorite: result.favorited });
    wx.showToast({
      title: result.favorited ? '已收藏' : '已取消收藏',
      icon: 'none',
    });
  },

  onSubmitExam() {
    var that = this;
    wx.showModal({
      title: '交卷确认',
      content: '确定提交本次考试吗？',
      confirmText: '交卷',
      success: function (res) {
        if (res.confirm) that.finishExam();
      },
    });
  },

  finishExam() {
    if (this._completeLocked || this.data.practiceComplete) return;
    this._completeLocked = true;
    this.clearTimers();

    var session = this._session;
    var correctCount = 0;
    var incorrectQuestions = [];
    var correctIds = [];

    (session.questions || []).forEach(function (q) {
      var ans = (session.examAnswers && session.examAnswers[q.id]) || '';
      if (helpers.isChoiceAnswerCorrect(q, ans)) {
        correctCount += 1;
        correctIds.push(q.id);
      } else {
        incorrectQuestions.push(q);
      }
    });

    studyStorage.removeIncorrectByIds(correctIds);
    studyStorage.addIncorrect(incorrectQuestions);
    studyStorage.markQuestionsMastered(correctIds, true);
    studyStorage.markQuestionsMastered(
      incorrectQuestions.map(function (q) {
        return q.id;
      }),
      false,
    );
    studyStorage.recordPracticeStats(
      session.questions.length,
      correctCount,
      session.practiceStartedAt,
    );
    sessionUtil.clearActiveSession();
    this._session = null;

    this.setData({
      practiceComplete: true,
      correctCount: correctCount,
      reportCorrectRate: session.questions.length
        ? Math.round((correctCount / session.questions.length) * 100)
        : 0,
    });
  },

  completeRegularSession(answered, correct) {
    if (this._completeLocked || this.data.practiceComplete) return;
    this._completeLocked = true;
    this.clearTimers();

    var session = this._session;
    if (session.mode === 'reccite') {
      studyStorage.markQuestionsMastered(
        session.questions.map(function (q) {
          return q.id;
        }),
        true,
      );
    }
    studyStorage.recordPracticeStats(answered, correct, session.practiceStartedAt);
    sessionUtil.clearActiveSession();
    this._session = null;

    this.setData({
      practiceComplete: true,
      correctCount: correct,
      reportCorrectRate: answered ? Math.round((correct / answered) * 100) : 0,
    });
  },

  onExit() {
    var that = this;
    if (this.data.practiceComplete) {
      wx.navigateBack({
        fail: function () {
          wx.redirectTo({ url: '/packageStudy/pages/home/index' });
        },
      });
      return;
    }
    wx.showModal({
      title: '退出练习',
      content: '进度会自动保存，可稍后继续。',
      confirmText: '退出',
      success: function (res) {
        if (!res.confirm) return;
        that.persistSession(true);
        wx.navigateBack({
          fail: function () {
            wx.redirectTo({ url: '/packageStudy/pages/home/index' });
          },
        });
      },
    });
  },

  onBackHome() {
    wx.redirectTo({ url: '/packageStudy/pages/home/index' });
  },
});
