function normalizeDate(value) {
  const date = value == null ? new Date() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('日期无效');
  return date;
}

function pad(value, length) {
  return String(value).padStart(length, '0');
}

function formatLocalMonth(value) {
  const date = normalizeDate(value);
  return pad(date.getFullYear(), 4) + '-' + pad(date.getMonth() + 1, 2);
}

function formatLocalDate(value) {
  const date = normalizeDate(value);
  return formatLocalMonth(date) + '-' + pad(date.getDate(), 2);
}

module.exports = {
  formatLocalDate,
  formatLocalMonth,
};
