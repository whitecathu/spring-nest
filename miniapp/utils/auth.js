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

function getSavedAvatarPath(user) {
  return String((user && user.savedAvatarPath) || '').trim();
}

function saveAvatar(tempFilePath) {
  return new Promise(function (resolve, reject) {
    if (!tempFilePath) {
      resolve('');
      return;
    }
    if (typeof wx.saveFile !== 'function') {
      reject(new Error('当前环境不支持保存头像'));
      return;
    }
    try {
      wx.saveFile({
        tempFilePath: tempFilePath,
        success: function (res) {
          if (!res || !res.savedFilePath) {
            reject(new Error('头像保存失败，请重试'));
            return;
          }
          resolve(res.savedFilePath);
        },
        fail: function (err) {
          reject(new Error((err && err.errMsg) || '头像保存失败，请重试'));
        },
      });
    } catch (err) {
      reject(new Error((err && err.message) || '头像保存失败，请重试'));
    }
  });
}

function removeSavedAvatar(filePath) {
  return new Promise(function (resolve, reject) {
    if (!filePath) {
      resolve();
      return;
    }
    if (typeof wx.removeSavedFile !== 'function') {
      reject(new Error('当前环境不支持清理本机头像'));
      return;
    }
    try {
      wx.removeSavedFile({
        filePath: filePath,
        success: function () {
          resolve();
        },
        fail: function (err) {
          reject(new Error((err && err.errMsg) || '本机头像清理失败'));
        },
      });
    } catch (err) {
      reject(new Error((err && err.message) || '本机头像清理失败'));
    }
  });
}

function loginWithProfile(profile) {
  const nickName = String((profile && profile.nickName) || '').trim();
  const avatarUrl = String((profile && profile.avatarUrl) || '').trim();

  if (!nickName) return Promise.reject(new Error('请填写昵称'));

  const currentUser = getUser();
  const previousSavedPath = getSavedAvatarPath(currentUser);
  const reusingSavedAvatar =
    previousSavedPath && avatarUrl && avatarUrl === (currentUser && currentUser.avatarUrl);
  const avatarPromise = !avatarUrl
    ? Promise.resolve({
        avatarUrl: (currentUser && currentUser.avatarUrl) || '',
        savedAvatarPath: previousSavedPath,
        newlySaved: false,
      })
    : reusingSavedAvatar
      ? Promise.resolve({
          avatarUrl: avatarUrl,
          savedAvatarPath: previousSavedPath,
          newlySaved: false,
        })
      : saveAvatar(avatarUrl).then(function (savedFilePath) {
          return {
            avatarUrl: savedFilePath,
            savedAvatarPath: savedFilePath,
            newlySaved: true,
          };
        });

  return avatarPromise.then(function (avatar) {
    const now = Date.now();
    const user = {
      loggedIn: true,
      nickName: nickName,
      avatarUrl: avatar.avatarUrl,
      savedAvatarPath: avatar.savedAvatarPath,
      localOnly: true,
      loginAt: (currentUser && currentUser.loginAt) || now,
      updatedAt: now,
    };

    try {
      setUser(user);
    } catch (err) {
      if (!avatar.newlySaved) throw err;
      return removeSavedAvatar(avatar.savedAvatarPath)
        .catch(function () {})
        .then(function () {
          throw err;
        });
    }

    if (previousSavedPath && previousSavedPath !== avatar.savedAvatarPath) {
      return removeSavedAvatar(previousSavedPath).then(function () {
        return user;
      });
    }
    return user;
  });
}

function logout() {
  const user = getUser();
  return removeSavedAvatar(getSavedAvatarPath(user)).then(function () {
    clearUser();
  });
}

module.exports = {
  USER_KEY,
  getUser,
  setUser,
  clearUser,
  isLoggedIn,
  saveAvatar,
  removeSavedAvatar,
  loginWithProfile,
  logout,
};
