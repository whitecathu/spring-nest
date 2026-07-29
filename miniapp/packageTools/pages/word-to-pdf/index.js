const catalog = require('../../../utils/catalog');
const favorites = require('../../../utils/favorites');
const historyUtil = require('../../../utils/history');
const toast = require('../../../utils/toast');

Page({
  data: {
    tool: null,
    favorite: false,
    fileName: '',
    filePath: '',
    fileSize: '',
    result: '',
    resultStatus: 'idle',
    extracted: '',
  },

  onLoad() {
    const tool = catalog.findBySlug('word-to-pdf');
    try {
      historyUtil.addHistory('word-to-pdf');
    } catch (e) {}
    this.setData({
      tool: tool || {
        title: 'Word 转 PDF',
        description: '受微信能力限制，本工具提供诚实说明与文本提取辅助',
        icon: '📄',
        bg: '#c0edd1',
        color: '#274f3a',
      },
      favorite: favorites.isFavorite('word-to-pdf'),
    });
    wx.setNavigationBarTitle({ title: (tool && tool.title) || 'Word 转 PDF' });
  },

  onToggleFavorite() {
    try {
      favorites.toggleFavorite('word-to-pdf');
      const next = favorites.isFavorite('word-to-pdf');
      this.setData({ favorite: next });
      toast.showToast(next ? '已加入收藏。' : '已取消收藏。');
    } catch (e) {
      toast.showToast(e.message || '收藏失败');
    }
  },

  chooseFile() {
    if (!wx.chooseMessageFile) {
      this.setData({
        result: '当前基础库不支持 chooseMessageFile，请升级微信后重试。',
        resultStatus: 'error',
      });
      return;
    }
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['doc', 'docx', 'txt'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        const name = file.name || '未命名文件';
        const size = formatSize(file.size);
        this.setData({
          fileName: name,
          filePath: file.path,
          fileSize: size,
          extracted: '',
          result: '',
          resultStatus: 'idle',
        });
        this.tryExtract(file);
      },
      fail: () => toast.showToast('未选择文件'),
    });
  },

  tryExtract(file) {
    const name = String(file.name || '').toLowerCase();
    if (name.endsWith('.txt')) {
      const fs = wx.getFileSystemManager();
      fs.readFile({
        filePath: file.path,
        encoding: 'utf8',
        success: (res) => {
          const text = String(res.data || '');
          this.setData({
            extracted: text.slice(0, 4000),
            result: '已读取 TXT 文本（前 4000 字）。无法在小程序内生成 PDF。',
            resultStatus: 'ok',
          });
        },
        fail: () => {
          this.setData({
            result: '无法读取该 TXT 文件。',
            resultStatus: 'error',
          });
        },
      });
      return;
    }
    if (name.endsWith('.doc') || name.endsWith('.docx')) {
      this.setData({
        result:
          '已选择 Word 文件「' +
          file.name +
          '」。\n微信小程序无法在本地完成 Word→PDF 转换（缺少 Office 渲染引擎与可写 PDF 库）。\n请使用电脑 Office / WPS，或云端转换服务后下载。',
        resultStatus: 'ok',
      });
      return;
    }
    this.setData({
      result: '已选择文件，但不支持在此转换为 PDF。',
      resultStatus: 'ok',
    });
  },

  convert() {
    if (!this.data.filePath) {
      toast.showToast('请先选择文件');
      return;
    }
    this.setData({
      result:
        '无法在微信小程序内生成 PDF。\n原因：小程序运行环境不提供 Word 排版引擎，也不能直接写入标准 PDF 二进制文件。\n已选文件：' +
        this.data.fileName +
        (this.data.fileSize ? '（' + this.data.fileSize + '）' : '') +
        '\n建议：在电脑端另存为 PDF，或使用系统「打印为 PDF」。',
      resultStatus: 'error',
    });
  },

  copyExtracted() {
    if (!this.data.extracted) {
      toast.showToast('没有可复制的文本');
      return;
    }
    wx.setClipboardData({
      data: this.data.extracted,
      success: () => toast.showToast('已复制文本'),
    });
  },
});

function formatSize(n) {
  n = Number(n) || 0;
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}
