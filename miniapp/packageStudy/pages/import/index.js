const parsers = require('../../utils/parsers');
const studyStorage = require('../../utils/storage');
const helpers = require('../../utils/helpers');
const importLimits = require('../../utils/import-limits');

var EMOJI_PRESETS = ['📚', '🌿', '🧠', '✏️', '🧪', '📖', '💡', '🎯'];

Page({
  data: {
    step: 'pick', // pick | preview
    pasteText: '',
    importTitle: '',
    importEmoji: '📚',
    emojiPresets: EMOJI_PRESETS,
    previewCount: 0,
    previewQuestions: [],
    importError: '',
    fileName: '',
    saving: false,
  },

  onBackToPick() {
    this.setData({
      step: 'pick',
      previewQuestions: [],
      previewCount: 0,
      importError: '',
    });
    wx.setNavigationBarTitle({ title: '导入题库' });
  },

  onPasteInput(e) {
    this.setData({ pasteText: (e.detail && e.detail.value) || '' });
  },

  onTitleInput(e) {
    this.setData({ importTitle: (e.detail && e.detail.value) || '' });
  },

  onPickEmoji(e) {
    var emoji = e.currentTarget.dataset.emoji;
    if (emoji) this.setData({ importEmoji: emoji });
  },

  applyParsed(result, fileName) {
    var questions = result.questions || [];
    importLimits.assertQuestionCount(questions);
    this.setData({
      step: 'preview',
      previewQuestions: questions.slice(0, 8),
      previewCount: questions.length,
      importTitle: result.name || parsers.getBaseFileName(fileName) || '新题集',
      importEmoji: result.emoji || '📚',
      fileName: fileName || '',
      importError: '',
      _parsedQuestions: questions,
    });
    this._parsedQuestions = questions;
    wx.setNavigationBarTitle({ title: '确认题集' });
  },

  onParsePaste() {
    try {
      importLimits.assertImportSize(this.data.pasteText);
      var result = parsers.detectAndParse(this.data.pasteText, 'paste.txt');
      this.applyParsed(result, '粘贴文本');
    } catch (err) {
      this.setData({ importError: (err && err.message) || '解析失败' });
    }
  },

  onChooseFile() {
    var that = this;
    if (!wx.chooseMessageFile) {
      that.setData({ importError: '当前基础库不支持选文件，请改用下方粘贴导入。' });
      return;
    }
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['txt', 'json', 'csv', 'md'],
      success: function (res) {
        var file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        that.readAndParseFile(file);
      },
      fail: function () {
        that.setData({ importError: '未选择文件。也可使用下方粘贴导入。' });
      },
    });
  },

  readAndParseFile(file) {
    var that = this;
    var fs = wx.getFileSystemManager();
    var path = file.path || file.tempFilePath;
    var name = file.name || 'import.txt';
    try {
      importLimits.assertImportSize(Number(file.size));
    } catch (err) {
      that.setData({ importError: err.message });
      return;
    }
    wx.showLoading({ title: '解析中', mask: true });
    fs.readFile({
      filePath: path,
      encoding: 'utf8',
      success: function (res) {
        try {
          importLimits.assertImportSize(res.data);
          var result = parsers.detectAndParse(res.data, name);
          that.applyParsed(result, name);
        } catch (err) {
          that.setData({ importError: (err && err.message) || '解析失败' });
        }
      },
      fail: function () {
        that.setData({ importError: '读取文件失败，请确认文件为 UTF-8 文本。' });
      },
      complete: function () {
        wx.hideLoading();
      },
    });
  },

  onSaveDeck() {
    if (this.data.saving) return;
    var questions = this._parsedQuestions || [];
    if (!questions.length) {
      wx.showToast({ title: '没有可保存的题目', icon: 'none' });
      return;
    }
    var title = String(this.data.importTitle || '').trim() || '新题集';
    var deck = {
      id: helpers.uid('deck'),
      name: title,
      desc: '导入于 ' + helpers.getDisplayReviewDate() + '，共 ' + questions.length + ' 道题。',
      emoji: this.data.importEmoji || '📚',
      color: '#2D6A4F',
      questions: questions,
      createdAt: Date.now(),
    };
    try {
      importLimits.assertQuestionCount(questions);
      importLimits.assertStorageCapacity(deck);
      this.setData({ saving: true, importError: '' });
      studyStorage.addDeck(deck);
    } catch (err) {
      this.setData({
        saving: false,
        importError: (err && err.message) || '题集保存失败，请重试。',
      });
      wx.showToast({ title: '题集保存失败', icon: 'none' });
      return;
    }
    this.setData({ saving: false, importError: '' });
    wx.showToast({ title: '题集已保存', icon: 'success' });
    setTimeout(function () {
      wx.redirectTo({ url: '/packageStudy/pages/home/index' });
    }, 500);
  },
});
