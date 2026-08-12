function neutralizeFormula(text) {
  const firstSignificant = text.replace(/^[ \f\v\u00a0]+/, '').charAt(0);
  if (firstSignificant && '=+-@\t\r'.indexOf(firstSignificant) >= 0) {
    return "'" + text;
  }
  return text;
}

function csvEscape(value) {
  const text = neutralizeFormula(String(value == null ? '' : value));
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function toCsv(list) {
  const header = 'date,type,category,amount,note';
  const rows = (Array.isArray(list) ? list : []).map((item) =>
    [
      csvEscape(item.date || ''),
      csvEscape(item.type === 'income' ? 'income' : 'expense'),
      csvEscape(item.category || ''),
      csvEscape(item.amount),
      csvEscape(item.note || ''),
    ].join(','),
  );
  return header + '\n' + rows.join('\n');
}

module.exports = {
  csvEscape,
  toCsv,
};
