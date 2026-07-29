const storage = require('./storage');

const USER_KEY = 'auth:user:v1';

function getUser() {
  const user = storage.getJSON(USER_KEY, null);
  if (!user || typeof user !== 'object') return null;
  if (!user.loggedIn) return null;
  return user;
}

function setUser(user) {
  storage.setJSON(USER_KEY, user);
  return user;
}

function clearUser() {
  storage.remove(USER_KEY);
}

function isLoggedIn() {
  return !!getUser();
}

/**
 * 本机资料：调用 wx.login 校验微信能力可用，但仅把头像昵称写入本地存储。
 * 无云端会话换票；code 不持久化、不同步。
 */
function loginWithProfile(profile) {
  const nickName = String((profile && profile.nickName) || '').trim();
  const avatarUrl = String((profile && profile.avatarUrl) || '').trim();

  return new Promise(function (resolve, reject) {
    if (!nickName) {
      reject(new Error('请填写昵称'));
      return;
    }
    if (!wx.login) {
      reject(new Error('当前环境不支持保存资料'));
      return;
    }

    wx.login({
      success: function (res) {
        if (!res || !res.code) {
          reject(new Error('保存失败，请重试'));
          return;
        }
        const user = {
          loggedIn: true,
          nickName: nickName,
          avatarUrl: avatarUrl,
          localOnly: true,
          sessionId: 'sn_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          loginAt: Date.now(),
        };
        setUser(user);
        resolve(user);
      },
      fail: function (err) {
        reject(new Error((err && err.errMsg) || '保存失败'));
      },
    });
  });
}

function logout() {
  clearUser();
}

module.exports = {
  USER_KEY,
  getUser,
  setUser,
  clearUser,
  isLoggedIn,
  loginWithProfile,
  logout,
};
