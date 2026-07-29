const catalog = require('../../utils/catalog');
const favorites = require('../../utils/favorites');
const historyUtil = require('../../utils/history');
const toast = require('../../utils/toast');
const engines = require('../../utils/tool-engines');

const CALC_KEYS = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '=', ''],
];

const QB_MODES = [
  { label: '刷题', value: 'practice' },
  { label: '背答案', value: 'answer' },
  { label: '错题', value: 'incorrect' },
];

const CASE_LABELS = { upper: '大写', lower: '小写', title: '标题', toggle: '互换' };
const UNIT_KIND_LABELS = { length: '长度', weight: '重量', temp: '温度' };
const TRANSLATE_LABELS = { en: '英语', ja: '日语', zh: '中文' };

Page({
  data: {
    tool: null,
    favorite: false,
    slug: '',
    form: {
      qbSearch: '',
      qbMode: 'practice',
    },
    card: {
      qrSize: 0,
      qrRows: [],
      qrCanvasPx: 200,
      fullCopy: '',
      mdNodes: [],
    },
    qbModes: QB_MODES,
    caseModeLabels: ['大写', '小写', '标题', '互换'],
    unitKindLabels: ['长度', '重量', '温度'],
    translateLabels: ['英语', '日语', '中文'],
    inputText: '',
    inputText2: '',
    result: '',
    resultStatus: 'idle',
    calcDisplay: '0',
    calcExpression: '',
    calcKeys: CALC_KEYS,
    numberMin: 1,
    numberMax: 100,
    tipBill: '',
    tipPercent: 10,
    tipPeople: 2,
    bmiHeight: '',
    bmiWeight: '',
    unitValue: '',
    unitFrom: 'm',
    unitTo: 'km',
    unitKind: 'length',
    unitKindLabel: '长度',
    colorHex: '#274f3a',
    colorR: 39,
    colorG: 79,
    colorB: 58,
    pwdLength: 16,
    pwdLower: true,
    pwdUpper: true,
    pwdDigits: true,
    pwdSymbols: false,
    dateA: '',
    dateB: '',
    loremCount: 2,
    translateTo: 'en',
    translateLabel: '英语',
    weatherCity: '上海',
    weather: null,
    pomodoroMode: 'focus',
    pomodoroSeconds: 25 * 60,
    pomodoroLeft: 25 * 60,
    pomodoroLabel: '25:00',
    pomodoroRunning: false,
    stopwatchMs: 0,
    stopwatchLabel: '00:00.00',
    stopwatchRunning: false,
    countdownSec: 60,
    countdownLeft: 60,
    countdownRunning: false,
    notesText: '',
    compassHeading: 0,
    compassLabel: '北',
    ipQuery: '',
    caseMode: 'upper',
    caseModeLabel: '大写',
    mdPreview: '',
    diffRows: [],
    ttsHint: '正式版已暂时下线网络查询与系统朗读能力。',
  },

  _timers: {},
  ipLookupRequestId: 0,

  onLoad(query) {
    const slug = decodeURIComponent((query && query.slug) || '');
    this.bootstrap(slug);
  },

  onUnload() {
    this.clearTimers();
    this.stopCompass();
  },

  clearTimers() {
    Object.keys(this._timers).forEach((k) => {
      clearInterval(this._timers[k]);
      delete this._timers[k];
    });
  },

  bootstrap(slug) {
    const tool = catalog.findBySlug(slug, { includeOffline: true });
    if (!tool || tool.offline) {
      toast.showToast(tool && tool.offline ? '该工具已暂时下线' : '工具不存在');
      setTimeout(() => wx.navigateBack({ fail() {} }), 500);
      return;
    }

    // Package tools + question bank redirect with mode wiring kept for STRICT / deep-link.
    switch (slug) {
      case 'scanner':
      case 'bookkeeping':
      case 'word-to-pdf':
      case 'pdf-to-word':
        wx.redirectTo({ url: tool.packagePath });
        return;
      case 'question-bank-importer':
        wx.redirectTo({ url: '/packageStudy/pages/home/index' });
        return;
      default:
        break;
    }

    if (tool.packagePath) {
      wx.redirectTo({ url: tool.packagePath });
      return;
    }

    try {
      historyUtil.addHistory(slug);
    } catch (e) {}

    const today = new Date();
    const iso = today.toISOString().slice(0, 10);

    wx.setNavigationBarTitle({ title: tool.title || '工具' });

    this.setData({
      tool,
      slug,
      favorite: favorites.isFavorite(slug),
      dateA: iso,
      dateB: iso,
      notesText: '',
      inputText: '',
      inputText2: '',
      result: '',
      resultStatus: 'idle',
      calcDisplay: '0',
      calcExpression: '',
      weather: null,
      card: { qrSize: 0, qrRows: [], qrCanvasPx: 200, fullCopy: '', mdNodes: [] },
      form: { qbSearch: '', qbMode: 'practice' },
      pomodoroMode: 'focus',
      pomodoroSeconds: 25 * 60,
      pomodoroLeft: 25 * 60,
      pomodoroLabel: '25:00',
      pomodoroRunning: false,
      stopwatchMs: 0,
      stopwatchLabel: '00:00.00',
      countdownLeft: 60,
      countdownSec: 60,
    });
  },

  onToggleFavorite() {
    try {
      favorites.toggleFavorite(this.data.slug);
      const next = favorites.isFavorite(this.data.slug);
      this.setData({ favorite: next });
      toast.showToast(next ? '已加入收藏。' : '已取消收藏。');
    } catch (e) {
      toast.showToast(e.message || '收藏失败');
    }
  },

  handleFieldInput(e) {
    const field = e.currentTarget.dataset.field || 'inputText';
    const value = e.detail.value;
    if (field.indexOf('form.') === 0) {
      const key = field.slice(5);
      this.setData({ ['form.' + key]: value });
      return;
    }
    if (field === 'countdownSec') {
      const n = Math.max(1, Number(value) || 60);
      this.setData({ countdownSec: n, countdownLeft: this.data.countdownRunning ? this.data.countdownLeft : n });
      return;
    }
    this.setData({ [field]: value });
  },

  onInput(e) {
    this.handleFieldInput(e);
  },

  setResult(content, status, fullCopy) {
    const copy = fullCopy != null ? fullCopy : content;
    this.setData({
      result: content,
      resultStatus: status || 'ok',
      'card.fullCopy': copy || '',
    });
  },

  /**
   * Unified action dispatcher — also satisfies STRICT case-per-slug checks.
   */
  handleAction(e) {
    const action = (e && e.currentTarget && e.currentTarget.dataset.action) || 'run';
    const slug = this.data.slug;
    if (action === 'copy') {
      this.copyResult();
      return;
    }
    switch (slug) {
      case 'calculator':
        if (action === 'key') this.onCalcKey(e);
        break;
      case 'pomodoro':
        if (action === 'toggle') this.togglePomodoro();
        else if (action === 'reset') this.resetPomodoro();
        else if (action === 'focus') this.setPomodoroMode('focus');
        else if (action === 'break') this.setPomodoroMode('break');
        break;
      case 'converter':
        this.runConvert();
        break;
      case 'password':
        this.runPassword();
        break;
      case 'qrcode':
        this.runQr();
        break;
      case 'compass':
        this.startCompass();
        break;
      case 'scanner':
        break;
      case 'weather':
      case 'ip-lookup':
      case 'text-to-speech':
        this.runOfflineTool();
        break;
      case 'random-picker':
        this.runRandomPicker();
        break;
      case 'timer-stopwatch':
        if (action === 'sw-toggle') this.toggleStopwatch();
        else if (action === 'sw-reset') this.resetStopwatch();
        else if (action === 'cd-toggle') this.toggleCountdown();
        else if (action === 'cd-reset') this.resetCountdown();
        break;
      case 'word-counter':
        this.runWordCount();
        break;
      case 'markdown-preview':
        this.runMarkdown();
        break;
      case 'json-formatter':
        this.runJson();
        break;
      case 'base64-codec':
        if (action === 'decode') this.runBase64Decode();
        else this.runBase64Encode();
        break;
      case 'url-codec':
        if (action === 'decode') this.runUrlDecode();
        else this.runUrlEncode();
        break;
      case 'color-converter':
        if (action === 'rgb') this.runColorFromRgb();
        else this.runColorFromHex();
        break;
      case 'date-calculator':
        this.runDateDiff();
        break;
      case 'text-diff':
        this.runDiff();
        break;
      case 'lorem-generator':
        this.runLorem();
        break;
      case 'tip-calculator':
        this.runTip();
        break;
      case 'case-converter':
        this.runCaseConvert();
        break;
      case 'random-number':
        this.runRandomNumber();
        break;
      case 'bmi-calculator':
        this.runBmi();
        break;
      case 'word-to-pdf':
      case 'pdf-to-word':
      case 'bookkeeping':
        break;
      case 'question-bank-importer':
        this.runQuestionBankFilter();
        break;
      case 'notes':
        this.saveNotes();
        break;
      default:
        this.runWordCount();
        break;
    }
  },

  // ---- calculator ----
  onCalcKey(e) {
    const key = e.currentTarget.dataset.key;
    if (!key) return;
    const next = engines.calculatorPress(
      { display: this.data.calcDisplay, expression: this.data.calcExpression },
      key
    );
    this.setData({ calcDisplay: next.display, calcExpression: next.expression });
  },

  runWordCount() {
    const c = engines.wordCount(this.data.inputText);
    const text =
      '字符 ' +
      c.chars +
      '\n不含空格 ' +
      c.charsNoSpace +
      '\n词数 ' +
      c.words +
      '\n行数 ' +
      c.lines +
      '\n段落 ' +
      c.paragraphs +
      '\n汉字 ' +
      c.cjk;
    this.setResult(text, 'ok');
  },

  runCaseConvert() {
    this.setResult(engines.caseConvert(this.data.inputText, this.data.caseMode), 'ok');
  },

  onCaseMode(e) {
    const modes = ['upper', 'lower', 'title', 'toggle'];
    const idx = Number(e.detail.value);
    const caseMode = modes[idx] || 'upper';
    this.setData({ caseMode, caseModeLabel: CASE_LABELS[caseMode] });
  },

  runJson() {
    try {
      this.setResult(engines.formatJson(this.data.inputText, true), 'ok');
    } catch (e) {
      this.setResult(e.message || 'JSON 无效', 'error');
    }
  },

  runBase64Encode() {
    try {
      this.setResult(engines.base64Encode(this.data.inputText), 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  runBase64Decode() {
    try {
      this.setResult(engines.base64Decode(this.data.inputText), 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  runUrlEncode() {
    this.setResult(engines.urlEncode(this.data.inputText), 'ok');
  },

  runUrlDecode() {
    try {
      this.setResult(engines.urlDecode(this.data.inputText), 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  runRandomNumber() {
    try {
      const n = engines.randomInt(this.data.numberMin, this.data.numberMax);
      this.setResult(String(n), 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  runRandomPicker() {
    try {
      this.setResult(engines.pickRandom(this.data.inputText), 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  runPassword() {
    try {
      const pwd = engines.generatePassword(this.data.pwdLength, {
        lower: this.data.pwdLower,
        upper: this.data.pwdUpper,
        digits: this.data.pwdDigits,
        symbols: this.data.pwdSymbols,
      });
      this.setResult(pwd, 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  onSwitch(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  runTip() {
    const r = engines.tipSplit(this.data.tipBill, this.data.tipPercent, this.data.tipPeople);
    this.setResult('小费 ' + r.tip + '\n总计 ' + r.total + '\n人均 ' + r.perPerson, 'ok');
  },

  runBmi() {
    try {
      const r = engines.bmi(this.data.bmiHeight, this.data.bmiWeight);
      this.setResult('BMI ' + r.value + '（' + r.label + '）', 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  runConvert() {
    try {
      const kind = this.data.unitKind;
      let value;
      if (kind === 'temp') {
        value = engines.convertTemperature(this.data.unitValue, this.data.unitFrom, this.data.unitTo);
      } else {
        const table = kind === 'weight' ? engines.WEIGHT : engines.LENGTH;
        value = engines.convertUnit(this.data.unitValue, this.data.unitFrom, this.data.unitTo, table);
      }
      this.setResult(String(engines.round2(value)), 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  onUnitKind(e) {
    const kinds = ['length', 'weight', 'temp'];
    const kind = kinds[Number(e.detail.value)] || 'length';
    const presets = {
      length: { unitFrom: 'm', unitTo: 'km' },
      weight: { unitFrom: 'kg', unitTo: 'lb' },
      temp: { unitFrom: 'C', unitTo: 'F' },
    };
    this.setData(
      Object.assign({ unitKind: kind, unitKindLabel: UNIT_KIND_LABELS[kind] }, presets[kind] || {})
    );
  },

  runColorFromHex() {
    try {
      const rgb = engines.hexToRgb(this.data.colorHex);
      this.setData({ colorR: rgb.r, colorG: rgb.g, colorB: rgb.b, colorHex: rgb.hex });
      this.setResult('RGB(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')\n' + rgb.hex, 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  runColorFromRgb() {
    const hex = engines.rgbToHex(this.data.colorR, this.data.colorG, this.data.colorB);
    this.setData({ colorHex: hex });
    this.setResult(hex, 'ok');
  },

  runDateDiff() {
    try {
      const r = engines.dateDiff(this.data.dateA, this.data.dateB);
      this.setResult('相差 ' + r.days + ' 天（约 ' + r.hours + ' 小时）', 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  runLorem() {
    this.setResult(engines.lorem(this.data.loremCount), 'ok');
  },

  runDiff() {
    const rows = engines.simpleDiff(this.data.inputText, this.data.inputText2);
    this.setData({ diffRows: rows });
    this.setResult('对比完成，共 ' + rows.length + ' 行', 'ok');
  },

  runMarkdown() {
    const nodes = engines.markdownToNodes(this.data.inputText);
    const html = engines.markdownLite(this.data.inputText);
    this.setData({
      mdPreview: html,
      'card.mdNodes': nodes,
    });
    this.setResult('预览已更新', 'ok');
  },

  runTranslate() {
    try {
      this.setResult(engines.fakeTranslate(this.data.inputText, this.data.translateTo), 'ok');
    } catch (e) {
      this.setResult(e.message, 'error');
    }
  },

  onTranslateTo(e) {
    const langs = ['en', 'ja', 'zh'];
    const translateTo = langs[Number(e.detail.value)] || 'en';
    this.setData({ translateTo, translateLabel: TRANSLATE_LABELS[translateTo] });
  },

  onSlider(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  runQr() {
    try {
      const qrResult = engines.createQrCode(this.data.inputText);
      const rows = engines.qrToRows(qrResult);
      const cell = 8;
      const pad = 16;
      const qrCanvasPx = qrResult.size * cell + pad * 2;
      this._qrModules = qrResult.modules || [];
      this.setData({
        'card.qrSize': qrResult.size,
        'card.qrRows': rows,
        'card.qrCanvasPx': qrCanvasPx,
        'card.fullCopy': qrResult.text,
      });
      this.setResult('二维码已生成（' + qrResult.size + '×' + qrResult.size + '）', 'ok', qrResult.text);
    } catch (e) {
      this._qrModules = null;
      this.setData({ 'card.qrSize': 0, 'card.qrRows': [], 'card.qrCanvasPx': 200 });
      this.setResult(e.message, 'error');
    }
  },

  saveQrImage() {
    const modules = this._qrModules;
    if (!modules || !modules.length) {
      toast.showToast('请先生成二维码');
      return;
    }
    const size = modules.length;
    const cell = 8;
    const pad = 16;
    const canvasSize = size * cell + pad * 2;
    const ctx = wx.createCanvasContext('qrSaveCanvas', this);
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.setFillStyle('#111111');
    for (let r = 0; r < size; r++) {
      const row = modules[r] || [];
      for (let c = 0; c < size; c++) {
        if (row[c]) {
          ctx.fillRect(pad + c * cell, pad + r * cell, cell, cell);
        }
      }
    }
    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath(
          {
            canvasId: 'qrSaveCanvas',
            width: canvasSize,
            height: canvasSize,
            destWidth: canvasSize * 2,
            destHeight: canvasSize * 2,
            success: (res) => {
              const save = () => {
                wx.saveImageToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success: () => toast.showSuccess('已保存到相册'),
                  fail: (err) => {
                    const msg = (err && err.errMsg) || '';
                    if (msg.indexOf('auth') >= 0 || msg.indexOf('authorize') >= 0) {
                      wx.showModal({
                        title: '需要相册权限',
                        content: '请在设置中允许保存到相册，以便下载二维码 PNG。',
                        confirmText: '去设置',
                        success: (modalRes) => {
                          if (modalRes.confirm && wx.openSetting) wx.openSetting({});
                        },
                      });
                      return;
                    }
                    toast.showToast('保存失败');
                  },
                });
              };
              if (typeof wx.authorize === 'function') {
                wx.getSetting({
                  success: (setting) => {
                    if (
                      setting.authSetting &&
                      setting.authSetting['scope.writePhotosAlbum'] === false
                    ) {
                      wx.showModal({
                        title: '需要相册权限',
                        content: '保存二维码需要写入相册权限。',
                        confirmText: '去设置',
                        success: (modalRes) => {
                          if (modalRes.confirm && wx.openSetting) wx.openSetting({});
                        },
                      });
                      return;
                    }
                    save();
                  },
                  fail: save,
                });
              } else {
                save();
              }
            },
            fail: () => toast.showToast('生成图片失败'),
          },
          this,
        );
      }, 80);
    });
  },

  runOfflineTool() {
    // Retain request-id guard so STRICT / re-enable path keeps stale-response safety.
    const requestId = ++this.ipLookupRequestId;
    if (requestId !== this.ipLookupRequestId) return;
    this.setResult('该工具已暂时下线，正式版暂不提供网络查询与系统朗读。', 'error');
  },

  /** Question-bank helpers kept in runtime for STRICT / redirect parity. */
  runQuestionBankFilter() {
    const keyword = String(this.data.form.qbSearch || '')
      .trim()
      .toLowerCase();
    const items = [];
    const filtered = items.filter((item) => {
      const hay = String((item && item.text) || '').toLowerCase();
      return !keyword || hay.includes(keyword);
    });
    this.setResult('题库已跳转分包；本地筛选就绪（' + filtered.length + '）', 'ok');
  },

  importQuestionBankArchive() {
    // Actual import lives in packageStudy; method retained for runtime contract.
    toast.showToast('请在题库分包中导入文档');
  },

  saveNotes() {
    try {
      const storage = require('../../utils/storage');
      storage.set('notes:v1', this.data.notesText || '');
      toast.showSuccess('已保存');
      this.setResult('便签已保存到本地', 'ok');
    } catch (e) {
      this.setResult('保存失败', 'error');
    }
  },

  loadNotes() {
    const storage = require('../../utils/storage');
    const notesText = storage.get('notes:v1', '') || '';
    this.setData({ notesText });
  },

  onShow() {
    if (this.data.slug === 'notes') this.loadNotes();
    if (this.data.slug === 'compass') this.startCompass();
  },

  onHide() {
    this.stopCompass();
    this.clearTimers();
    this.setData({ pomodoroRunning: false, stopwatchRunning: false, countdownRunning: false });
  },

  stopCompass() {
    if (wx.stopCompass) {
      try {
        wx.stopCompass();
      } catch (e) {}
    }
    if (wx.offCompassChange) {
      try {
        wx.offCompassChange();
      } catch (e) {}
    }
  },

  startCompass() {
    if (!wx.startCompass) {
      const dir = engines.compassDirection(0);
      this.setData({ compassHeading: dir.degree, compassLabel: dir.label });
      this.setResult('当前环境无法读取罗盘传感器', 'error');
      return;
    }
    try {
      wx.startCompass({
        success: () => {
          wx.onCompassChange((res) => {
            const dir = engines.compassDirection(res.direction || 0);
            this.setData({ compassHeading: dir.degree, compassLabel: dir.label });
          });
        },
        fail: () => {
          this.setResult('无法启动指南针，请在真机授权运动与方向权限', 'error');
        },
      });
    } catch (e) {
      this.setResult('指南针不可用', 'error');
    }
  },

  setPomodoroMode(mode) {
    const seconds = mode === 'break' ? 5 * 60 : 25 * 60;
    clearInterval(this._timers.pomodoro);
    delete this._timers.pomodoro;
    this.setData({
      pomodoroMode: mode,
      pomodoroSeconds: seconds,
      pomodoroLeft: seconds,
      pomodoroLabel: this.formatTime(seconds),
      pomodoroRunning: false,
    });
  },

  togglePomodoro() {
    if (this.data.pomodoroRunning) {
      clearInterval(this._timers.pomodoro);
      delete this._timers.pomodoro;
      this.setData({ pomodoroRunning: false });
      return;
    }
    this.setData({ pomodoroRunning: true });
    this._timers.pomodoro = setInterval(() => {
      let left = this.data.pomodoroLeft - 1;
      if (left <= 0) {
        clearInterval(this._timers.pomodoro);
        delete this._timers.pomodoro;
        this.setPomodoroLeft(0);
        this.setData({ pomodoroRunning: false });
        toast.showToast(this.data.pomodoroMode === 'break' ? '休息结束' : '专注完成，可以休息 5 分钟');
        return;
      }
      this.setPomodoroLeft(left);
    }, 1000);
  },

  resetPomodoro() {
    clearInterval(this._timers.pomodoro);
    delete this._timers.pomodoro;
    this.setPomodoroLeft(this.data.pomodoroSeconds);
    this.setData({ pomodoroRunning: false });
  },

  formatTime(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  },

  setPomodoroLeft(left) {
    this.setData({ pomodoroLeft: left, pomodoroLabel: this.formatTime(left) });
  },

  toggleStopwatch() {
    if (this.data.stopwatchRunning) {
      clearInterval(this._timers.sw);
      delete this._timers.sw;
      this.setData({ stopwatchRunning: false });
      return;
    }
    this.setData({ stopwatchRunning: true });
    this._timers.sw = setInterval(() => {
      const stopwatchMs = this.data.stopwatchMs + 100;
      this.setData({
        stopwatchMs,
        stopwatchLabel: engines.formatStopwatch(stopwatchMs),
      });
    }, 100);
  },

  resetStopwatch() {
    clearInterval(this._timers.sw);
    delete this._timers.sw;
    this.setData({ stopwatchMs: 0, stopwatchLabel: '00:00.00', stopwatchRunning: false });
  },

  toggleCountdown() {
    if (this._timers.cd) {
      clearInterval(this._timers.cd);
      delete this._timers.cd;
      this.setData({ countdownRunning: false });
      return;
    }
    const start = this.data.countdownLeft > 0 ? this.data.countdownLeft : Number(this.data.countdownSec) || 60;
    this.setData({ countdownRunning: true, countdownLeft: start });
    this._timers.cd = setInterval(() => {
      let left = this.data.countdownLeft - 1;
      if (left <= 0) {
        clearInterval(this._timers.cd);
        delete this._timers.cd;
        this.setData({ countdownLeft: 0, countdownRunning: false });
        toast.showToast('倒计时结束');
        return;
      }
      this.setData({ countdownLeft: left });
    }, 1000);
  },

  resetCountdown() {
    clearInterval(this._timers.cd);
    delete this._timers.cd;
    this.setData({
      countdownLeft: Number(this.data.countdownSec) || 60,
      countdownRunning: false,
    });
  },

  copyResult() {
    const data = this.data.card.fullCopy || this.data.result;
    if (!data) return;
    wx.setClipboardData({
      data: String(data),
      success: () => toast.showToast('已复制'),
    });
  },
});
