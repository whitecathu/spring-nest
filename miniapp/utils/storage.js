const PREFIX = 'spring_nest:';

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
  try {
    wx.setStorageSync(withPrefix(key), value);
  } catch (e) {
    // ignore storage failures
  }
}

function remove(key) {
  try {
    wx.removeStorageSync(withPrefix(key));
  } catch (e) {
    // ignore
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
  set(key, value);
}

module.exports = {
  PREFIX,
  get,
  set,
  remove,
  getJSON,
  setJSON,
};
