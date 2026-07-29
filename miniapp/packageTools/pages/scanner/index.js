const catalog = require('../../../utils/catalog');
const favorites = require('../../../utils/favorites');
const historyUtil = require('../../../utils/history');
const toast = require('../../../utils/toast');

const FILTERS = [
  { id: 'none', label: '原图' },
  { id: 'gray', label: '灰度' },
  { id: 'contrast', label: '增强' },
];

Page({
  data: {
    tool: null,
    favorite: false,
    imagePath: '',
    filterId: 'none',
    filters: FILTERS,
    canvasW: 300,
    canvasH: 400,
    busy: false,
  },

  onLoad() {
    const tool = catalog.findBySlug('scanner');
    try {
      historyUtil.addHistory('scanner');
    } catch (e) {}
    this.setData({
      tool: tool || { title: '文档扫描', description: '拍照或选图，处理后保存到相册', icon: '📄', bg: '#c0edd1', color: '#274f3a' },
      favorite: favorites.isFavorite('scanner'),
    });
    wx.setNavigationBarTitle({ title: (tool && tool.title) || '文档扫描' });
  },

  onToggleFavorite() {
    try {
      favorites.toggleFavorite('scanner');
      const next = favorites.isFavorite('scanner');
      this.setData({ favorite: next });
      toast.showToast(next ? '已加入收藏。' : '已取消收藏。');
    } catch (e) {
      toast.showToast(e.message || '收藏失败');
    }
  },

  chooseImage() {
    const choose = wx.chooseMedia || wx.chooseImage;
    if (!choose) {
      toast.showToast('当前环境不支持选图');
      return;
    }
    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0];
          if (!file) return;
          this.setData({ imagePath: file.tempFilePath, filterId: 'none' });
          this.drawImage(file.tempFilePath, 'none');
        },
      });
    } else {
      wx.chooseImage({
        count: 1,
        success: (res) => {
          const path = res.tempFilePaths[0];
          this.setData({ imagePath: path, filterId: 'none' });
          this.drawImage(path, 'none');
        },
      });
    }
  },

  onFilter(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ filterId: id });
    if (this.data.imagePath) this.drawImage(this.data.imagePath, id);
  },

  drawImage(path, filterId) {
    const query = wx.createSelectorQuery();
    query
      .select('#scanCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        // Fallback to legacy canvas if 2d node unavailable
        if (!res || !res[0] || !res[0].node) {
          this.drawLegacy(path, filterId);
          return;
        }
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        let dpr = 2;
        try {
          if (typeof wx.getWindowInfo === 'function') {
            dpr = wx.getWindowInfo().pixelRatio || 2;
          } else {
            dpr = wx.getSystemInfoSync().pixelRatio || 2;
          }
        } catch (e) {
          dpr = 2;
        }
        const width = res[0].width;
        const height = res[0].height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        this.setData({ canvasW: width, canvasH: height });

        const img = canvas.createImage();
        img.onload = () => {
          const scale = Math.min(width / img.width, height / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (width - w) / 2;
          const y = (height - h) / 2;
          ctx.clearRect(0, 0, width, height);
          ctx.fillStyle = '#f3ede6';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, x, y, w, h);
          if (filterId && filterId !== 'none') {
            try {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              applyFilter(imageData.data, filterId);
              ctx.putImageData(imageData, 0, 0);
            } catch (e) {
              // getImageData may fail on some devices; keep original
            }
          }
          this._canvas = canvas;
        };
        img.onerror = () => toast.showToast('图片加载失败');
        img.src = path;
      });
  },

  drawLegacy(path, filterId) {
    const ctx = wx.createCanvasContext('scanCanvasLegacy', this);
    wx.getImageInfo({
      src: path,
      success: (info) => {
        const width = this.data.canvasW;
        const height = this.data.canvasH;
        const scale = Math.min(width / info.width, height / info.height);
        const w = info.width * scale;
        const h = info.height * scale;
        const x = (width - w) / 2;
        const y = (height - h) / 2;
        ctx.setFillStyle('#f3ede6');
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(path, x, y, w, h);
        ctx.draw(false);
        this._legacy = true;
        this._filterId = filterId;
      },
    });
  },

  saveToAlbum() {
    if (!this.data.imagePath) {
      toast.showToast('请先选择图片');
      return;
    }
    this.setData({ busy: true });
    const finish = (filePath) => {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: () => {
          toast.showSuccess('已保存到相册');
          this.setData({ busy: false });
        },
        fail: (err) => {
          this.setData({ busy: false });
          if (err && err.errMsg && err.errMsg.indexOf('auth') >= 0) {
            wx.showModal({
              title: '需要相册权限',
              content: '请在设置中允许保存到相册',
              confirmText: '去设置',
              success: (r) => {
                if (r.confirm) wx.openSetting({});
              },
            });
          } else {
            toast.showToast('保存失败');
          }
        },
      });
    };

    if (this._canvas && this._canvas.toTempFilePath) {
      wx.canvasToTempFilePath({
        canvas: this._canvas,
        success: (res) => finish(res.tempFilePath),
        fail: () => finish(this.data.imagePath),
      });
      return;
    }

    wx.canvasToTempFilePath({
      canvasId: 'scanCanvasLegacy',
      success: (res) => finish(res.tempFilePath),
      fail: () => finish(this.data.imagePath),
    }, this);
  },
});

function applyFilter(data, filterId) {
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (filterId === 'gray') {
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = data[i + 1] = data[i + 2] = y;
    } else if (filterId === 'contrast') {
      const factor = 1.35;
      data[i] = clamp((r - 128) * factor + 128);
      data[i + 1] = clamp((g - 128) * factor + 128);
      data[i + 2] = clamp((b - 128) * factor + 128);
    }
  }
}

function clamp(n) {
  return Math.max(0, Math.min(255, n));
}
