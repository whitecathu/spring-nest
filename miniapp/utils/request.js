function getErrorText(err) {
  if (!err) return '';
  if (typeof err === 'string') return err;
  return String(err.errMsg || err.message || '');
}

/**
 * Map wx.request failures to actionable Chinese copy.
 * Domain-whitelist blocks are common in DevTools before request 合法域名 is configured.
 */
function formatRequestError(err, domainHint) {
  const msg = getErrorText(err);
  const lower = msg.toLowerCase();
  const domainBlocked =
    lower.indexOf('url not in domain') >= 0 ||
    lower.indexOf('domain list') >= 0 ||
    msg.indexOf('合法域名') >= 0 ||
    msg.indexOf('不在以下') >= 0 ||
    lower.indexOf('not in domain') >= 0;

  if (domainBlocked) {
    const host = domainHint ? domainHint : '对应 API 域名';
    return (
      '请求域名未加入白名单（需配置 ' +
      host +
      '）。开发者工具可临时关闭「不校验合法域名」；正式版请在小程序后台 → 开发 → 开发管理 → 服务器域名中添加。'
    );
  }

  if (lower.indexOf('timeout') >= 0 || msg.indexOf('超时') >= 0) {
    return '请求超时，请稍后重试';
  }

  if (lower.indexOf('fail') >= 0 || msg.indexOf('网络') >= 0) {
    return (
      '网络请求失败' +
      (domainHint ? '（依赖 ' + domainHint + '）' : '') +
      '。请检查网络；若持续失败，确认已配置 request 合法域名或在开发者工具关闭域名校验。'
    );
  }

  return msg || '网络错误，请检查网络后重试';
}

function request(options) {
  return new Promise(function (resolve, reject) {
    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: options.header || { 'content-type': 'application/json' },
      timeout: options.timeout || 15000,
      success: function (res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error('请求失败 (' + res.statusCode + ')'));
        }
      },
      fail: function (err) {
        reject(err || new Error('网络错误'));
      },
    });
  });
}

module.exports = {
  request,
  formatRequestError,
  getErrorText,
};
