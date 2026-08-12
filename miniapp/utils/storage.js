const PREFIX = 'spring_nest:';

class StorageWriteError extends Error {
  constructor(action, key, cause) {
    const detail = cause && cause.message ? ': ' + cause.message : '';
    super('本机存储' + action + '失败' + detail);
    this.name = 'StorageWriteError';
    this.code = 'STORAGE_WRITE_FAILED';
    this.action = action;
    this.key = key;
    this.cause = cause;
  }
}

function withPrefix(key) {
  return key.indexOf(PREFIX) === 0 ? key : PREFIX + key;
}

function get(key, fallback) {
  try {
    const value = wx.getStorageSync(withPrefix(key));
    if (value === '' || value === undefined || value === null) return fallback;
    return value;
  } catch (e) {
    return fallback;
  }
}

function set(key, value) {
  const storageKey = withPrefix(key);
  try {
    wx.setStorageSync(storageKey, value);
    return value;
  } catch (e) {
    throw new StorageWriteError('写入', storageKey, e);
  }
}

function remove(key) {
  const storageKey = withPrefix(key);
  try {
    wx.removeStorageSync(storageKey);
    return true;
  } catch (e) {
    throw new StorageWriteError('删除', storageKey, e);
  }
}

function getJSON(key, fallback) {
  const raw = get(key, null);
  if (raw === null || raw === undefined || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function setJSON(key, value) {
  return set(key, value);
}

module.exports = {
  PREFIX,
  StorageWriteError,
  get,
  set,
  remove,
  getJSON,
  setJSON,
};
