/**
 * Brand fonts via wx.loadFontFace.
 *
 * Production: HTTPS first from https://spring-nest.pages.dev/fonts/miniapp/*.woff
 * (requires downloadFile 合法域名). Package-local base64 is the offline / fail fallback.
 */

const FONT_BASE = 'https://spring-nest.pages.dev/fonts/miniapp';

/** Site /fonts/miniapp deployed; keep true for production HTTPS loading. */
const ENABLE_REMOTE_FONTS = true;

const FACES = [
  {
    family: 'Noto Serif SC',
    weight: '700',
    file: 'NotoSerifSC-Bold.woff',
  },
  {
    family: 'Nunito Sans',
    weight: '400',
    file: 'NunitoSans-Regular.woff',
  },
  {
    family: 'Nunito Sans',
    weight: '700',
    file: 'NunitoSans-Bold.woff',
  },
  {
    family: 'Plus Jakarta Sans',
    weight: '400',
    file: 'PlusJakartaSans-Regular.woff',
  },
  {
    family: 'Plus Jakarta Sans',
    weight: '600',
    file: 'PlusJakartaSans-SemiBold.woff',
  },
];

function loadFace(family, weight, source) {
  return new Promise(function (resolve) {
    if (typeof wx === 'undefined' || typeof wx.loadFontFace !== 'function') {
      resolve({ family: family, weight: weight, ok: false, reason: 'unsupported' });
      return;
    }
    wx.loadFontFace({
      global: true,
      family: family,
      source: source,
      desc: {
        style: 'normal',
        weight: weight,
      },
      success: function () {
        resolve({ family: family, weight: weight, ok: true });
      },
      fail: function (err) {
        resolve({
          family: family,
          weight: weight,
          ok: false,
          reason: (err && (err.errMsg || err.message)) || 'fail',
        });
      },
    });
  });
}

function loadFromHttps(face) {
  const url = FONT_BASE + '/' + face.file;
  return loadFace(face.family, face.weight, 'url("' + url + '")').then(function (result) {
    return Object.assign({}, result, {
      via: result.ok ? 'https' : 'none',
    });
  });
}

function loadFromPackage(face) {
  return new Promise(function (resolve) {
    if (typeof wx === 'undefined' || !wx.getFileSystemManager) {
      resolve({ family: face.family, weight: face.weight, ok: false, reason: 'no-fs', via: 'none' });
      return;
    }
    const fsm = wx.getFileSystemManager();
    const filePath = '/assets/fonts/' + face.file;
    try {
      fsm.readFile({
        filePath: filePath,
        encoding: 'base64',
        success: function (res) {
          // application/font-woff is more reliable than font/woff on WeChat OTS
          const source =
            'url("data:application/font-woff;charset=utf-8;base64,' + res.data + '")';
          loadFace(face.family, face.weight, source).then(function (result) {
            resolve(
              Object.assign({}, result, {
                via: result.ok ? 'package' : 'none',
              }),
            );
          });
        },
        fail: function (err) {
          resolve({
            family: face.family,
            weight: face.weight,
            ok: false,
            reason: (err && err.errMsg) || 'read-fail',
            via: 'none',
          });
        },
      });
    } catch (e) {
      resolve({
        family: face.family,
        weight: face.weight,
        ok: false,
        reason: (e && e.message) || 'read-throw',
        via: 'none',
      });
    }
  });
}

function loadOne(face) {
  if (!ENABLE_REMOTE_FONTS) {
    return loadFromPackage(face);
  }
  return loadFromHttps(face).then(function (remote) {
    if (remote.ok) return remote;
    return loadFromPackage(face).then(function (local) {
      return Object.assign({}, local, {
        httpsReason: remote.reason,
      });
    });
  });
}

/**
 * Load all brand faces. Safe to call once from App.onLaunch.
 * Resolves after all attempts finish; never throws.
 */
function loadBrandFonts() {
  return Promise.all(FACES.map(loadOne)).then(function (results) {
    const loaded = results.filter(function (r) {
      return r && r.ok;
    }).length;
    return { loaded: loaded, total: FACES.length, results: results };
  });
}

module.exports = {
  FONT_BASE,
  ENABLE_REMOTE_FONTS,
  FACES,
  loadBrandFonts,
};
