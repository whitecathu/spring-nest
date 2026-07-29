function showToast(title, options) {
  options = options || {};
  wx.showToast({
    title: String(title || ''),
    icon: options.icon || 'none',
    duration: options.duration || 1800,
    mask: !!options.mask,
  });
}

function showSuccess(title) {
  showToast(title, { icon: 'success' });
}

function showLoading(title) {
  wx.showLoading({ title: title || '加载中', mask: true });
}

function hideLoading() {
  wx.hideLoading();
}

module.exports = {
  showToast,
  showSuccess,
  showLoading,
  hideLoading,
};
