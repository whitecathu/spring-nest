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
    const tool = catalog.findBySlug('pdf-to-word');
    try {
      historyUtil.addHistory('pdf-to-word');
    } catch (e) {}
    this.setData({
      tool: tool || {
        title: 'PDF 转 Word',
        description: '受微信能力限制，本工具提供诚实说明与文本辅助',
        icon: '📑',
        bg: '#c0edd1',
        color: '#274f3a',
      },
      favorite: favorites.isFavorite('pdf-to-word'),
    });
    wx.setNavigationBarTitle({ title: (tool && tool.title) || 'PDF 转 Word' });
  },

  onToggleFavorite() {
    try {
      favorites.toggleFavorite('pdf-to-word');
      const next = favorites.isFavorite('pdf-to-word');
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
      extension: ['pdf', 'txt'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        this.setData({
          fileName: file.name || '未命名文件',
          filePath: file.path,
          fileSize: formatSize(file.size),
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
            result: '已读取 TXT 文本。这不是从 PDF 解析出的内容，也不会生成 Word 文档。',
            resultStatus: 'ok',
          });
        },
        fail: () => {
          this.setData({ result: '无法读取该 TXT 文件。', resultStatus: 'error' });
        },
      });
      return;
    }
    if (name.endsWith('.pdf')) {
      this.setData({
        result:
          '已选择 PDF「' +
          file.name +
          '」。\n微信小程序无法在本地完成 PDF→Word 转换（缺少 PDF 解析与 docx 写入能力）。\n可选：用电脑 Adobe / WPS，或云端 OCR 服务处理扫描件。',
        resultStatus: 'ok',
      });
      return;
    }
    this.setData({
      result: '已选择文件，但不支持在此转换为 Word。',
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
        '无法在微信小程序内生成 Word 文档。\n原因：小程序环境不能可靠解析 PDF 版面，也无法写出可用的 .docx 文件。\n已选文件：' +
        this.data.fileName +
        (this.data.fileSize ? '（' + this.data.fileSize + '）' : '') +
        '\n建议：使用电脑端办公软件或专业云转换，再把结果发回微信。',
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
