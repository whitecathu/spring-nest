/**
 * Pure tool engines for miniapp tool-runtime.
 * Keep side-effect free where possible; UI calls these.
 */

const qr = require('./qrcode');

function safeEvalExpression(expr) {
  const cleaned = String(expr || '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/[^0-9+\-*/().%\s]/g, '');
  if (!cleaned.trim()) throw new Error('请输入算式');
  const fn = new Function('return (' + cleaned + ')');
  const result = fn();
  if (typeof result !== 'number' || !isFinite(result)) throw new Error('无效算式');
  return result;
}

function calculatorPress(state, key) {
  state = state || { display: '0', expression: '' };
  const display = state.display || '0';
  const expression = state.expression || '';

  if (key === 'C') return { display: '0', expression: '' };
  if (key === '⌫') {
    const next = display.length <= 1 ? '0' : display.slice(0, -1);
    return { display: next, expression: expression.slice(0, -1) };
  }
  if (key === '=') {
    try {
      const value = safeEvalExpression(expression || display);
      const text = String(Number(value.toPrecision(12)));
      return { display: text, expression: text };
    } catch (e) {
      return { display: '错误', expression: '' };
    }
  }
  const map = { '×': '*', '÷': '/' };
  const token = map[key] || key;
  const nextExpr = (expression === '' && display !== '0' ? display : expression) + token;
  const nextDisplay =
    key === '.' || /[0-9]/.test(key)
      ? display === '0' && key !== '.'
        ? key
        : display === '错误'
          ? key
          : display + key
      : display + key;
  return { display: nextDisplay, expression: nextExpr };
}

function wordCount(text) {
  const raw = String(text || '');
  const chars = raw.length;
  const charsNoSpace = raw.replace(/\s/g, '').length;
  const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
  const lines = raw === '' ? 0 : raw.split(/\r?\n/).length;
  const paragraphs = raw.trim()
    ? raw
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean).length
    : 0;
  const cjk = (raw.match(/[\u4e00-\u9fff]/g) || []).length;
  return { chars, charsNoSpace, words, lines, paragraphs, cjk };
}

function caseConvert(text, mode) {
  const t = String(text || '');
  switch (mode) {
    case 'upper':
      return t.toUpperCase();
    case 'lower':
      return t.toLowerCase();
    case 'title':
      return t.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    case 'toggle':
      return t
        .split('')
        .map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()))
        .join('');
    default:
      return t;
  }
}

function formatJson(text, pretty) {
  const parsed = JSON.parse(String(text || ''));
  return JSON.stringify(parsed, null, pretty ? 2 : 0);
}

function base64Encode(text) {
  const str = String(text || '');
  if (typeof wx !== 'undefined' && wx.arrayBufferToBase64) {
    const encoded = unescape(encodeURIComponent(str));
    const buffer = new ArrayBuffer(encoded.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < encoded.length; i++) view[i] = encoded.charCodeAt(i) & 0xff;
    return wx.arrayBufferToBase64(buffer);
  }
  if (typeof btoa === 'function') return btoa(unescape(encodeURIComponent(str)));
  throw new Error('Base64 不可用');
}

function base64Decode(text) {
  const str = String(text || '');
  if (typeof wx !== 'undefined' && wx.base64ToArrayBuffer) {
    const buffer = wx.base64ToArrayBuffer(str);
    const view = new Uint8Array(buffer);
    let out = '';
    for (let i = 0; i < view.length; i++) out += String.fromCharCode(view[i]);
    try {
      return decodeURIComponent(escape(out));
    } catch (e) {
      return out;
    }
  }
  if (typeof atob === 'function') {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (e) {
      return atob(str);
    }
  }
  throw new Error('Base64 解码不可用');
}

function urlEncode(text) {
  return encodeURIComponent(String(text || ''));
}

function urlDecode(text) {
  return decodeURIComponent(String(text || ''));
}

function randomInt(min, max) {
  min = Number(min);
  max = Number(max);
  if (!isFinite(min) || !isFinite(max)) throw new Error('请输入有效范围');
  if (min > max) {
    const t = min;
    min = max;
    max = t;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(lines) {
  const items = String(lines || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!items.length) throw new Error('请输入至少一个选项');
  return items[Math.floor(Math.random() * items.length)];
}

function getSecureRandomBytes(length) {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || typeof wx.getRandomValues !== 'function') {
      reject(new Error('安全随机数 API 不可用'));
      return;
    }

    try {
      wx.getRandomValues({
        length: length,
        success: function (result) {
          const values = result && result.randomValues;
          if (!(values instanceof ArrayBuffer) || values.byteLength === 0) {
            reject(new Error('安全随机数 API 返回了无效数据'));
            return;
          }
          resolve(new Uint8Array(values));
        },
        fail: function (error) {
          const message = error && error.errMsg ? error.errMsg : '安全随机数生成失败';
          reject(error instanceof Error ? error : new Error(message));
        },
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error('安全随机数生成失败'));
    }
  });
}

function createSecureRandomIndex() {
  let bytes = null;
  let offset = 0;

  async function nextByte() {
    if (!bytes || offset >= bytes.length) {
      bytes = await getSecureRandomBytes(64);
      offset = 0;
    }
    return bytes[offset++];
  }

  return async function secureRandomIndex(maxExclusive) {
    const limit = 256 - (256 % maxExclusive);
    for (let attempts = 0; attempts < 1024; attempts++) {
      const value = await nextByte();
      if (value < limit) return value % maxExclusive;
    }
    throw new Error('安全随机数生成失败');
  };
}

async function generatePassword(length, opts) {
  opts = opts || {};
  length = Math.max(4, Math.min(64, Number(length) || 16));

  const groups = [];
  if (opts.lower !== false) groups.push('abcdefghijklmnopqrstuvwxyz');
  if (opts.upper !== false) groups.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  if (opts.digits !== false) groups.push('0123456789');
  if (opts.symbols) groups.push('!@#$%^&*()-_=+[]{};:,.?');
  if (!groups.length) throw new Error('请至少选择一种字符集');

  const chars = groups.join('');
  const randomIndex = createSecureRandomIndex();
  const password = [];

  for (const group of groups) {
    password.push(group.charAt(await randomIndex(group.length)));
  }
  while (password.length < length) {
    password.push(chars.charAt(await randomIndex(chars.length)));
  }
  for (let index = password.length - 1; index > 0; index--) {
    const swapIndex = await randomIndex(index + 1);
    const current = password[index];
    password[index] = password[swapIndex];
    password[swapIndex] = current;
  }

  return password.join('');
}

function tipSplit(bill, tipPercent, people) {
  bill = Number(bill) || 0;
  tipPercent = Number(tipPercent) || 0;
  people = Math.max(1, Number(people) || 1);
  const tip = (bill * tipPercent) / 100;
  const total = bill + tip;
  return {
    tip: round2(tip),
    total: round2(total),
    perPerson: round2(total / people),
  };
}

function bmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!h || !w) throw new Error('请输入身高与体重');
  const value = w / (h * h);
  let label = '正常';
  if (value < 18.5) label = '偏瘦';
  else if (value < 24) label = '正常';
  else if (value < 28) label = '超重';
  else label = '肥胖';
  return { value: round2(value), label };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function convertUnit(value, from, to, table) {
  const v = Number(value);
  if (!isFinite(v)) throw new Error('请输入数字');
  if (table[from] == null || table[to] == null) throw new Error('未知单位');
  const inBase = v * table[from];
  return inBase / table[to];
}

const LENGTH = { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, ft: 0.3048, in: 0.0254 };
const WEIGHT = { kg: 1, g: 0.001, lb: 0.45359237, oz: 0.0283495231 };
const TEMP = { C: 1, F: 1, K: 1 };

function convertTemperature(value, from, to) {
  const v = Number(value);
  if (!isFinite(v)) throw new Error('请输入数字');
  let c = v;
  if (from === 'F') c = ((v - 32) * 5) / 9;
  if (from === 'K') c = v - 273.15;
  if (to === 'C') return round2(c);
  if (to === 'F') return round2((c * 9) / 5 + 32);
  if (to === 'K') return round2(c + 273.15);
  return round2(c);
}

function hexToRgb(hex) {
  let h = String(hex || '')
    .replace('#', '')
    .trim();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error('无效 HEX');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    hex: '#' + h.toUpperCase(),
  };
}

function rgbToHex(r, g, b) {
  function clamp(n) {
    n = Math.round(Number(n) || 0);
    return Math.max(0, Math.min(255, n));
  }
  function to(n) {
    return clamp(n).toString(16).padStart(2, '0').toUpperCase();
  }
  return '#' + to(r) + to(g) + to(b);
}

function dateDiff(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) throw new Error('日期无效');
  const ms = Math.abs(d2.getTime() - d1.getTime());
  const days = Math.floor(ms / (24 * 3600 * 1000));
  return { days: days, hours: Math.floor(ms / 3600000), ms: ms };
}

function lorem(paragraphs) {
  paragraphs = Math.max(1, Math.min(10, Number(paragraphs) || 1));
  const seeds = [
    '春日小筑提供清爽工具体验，让日常计算与文本处理保持轻盈节奏。',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duís aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  ];
  const out = [];
  for (let i = 0; i < paragraphs; i++) out.push(seeds[i % seeds.length]);
  return out.join('\n\n');
}

function simpleDiff(a, b) {
  const left = String(a || '').split(/\r?\n/);
  const right = String(b || '').split(/\r?\n/);
  const max = Math.max(left.length, right.length);
  const rows = [];
  for (let i = 0; i < max; i++) {
    const L = left[i];
    const R = right[i];
    if (L === R) rows.push({ type: 'same', text: L == null ? '' : L });
    else {
      if (L != null) rows.push({ type: 'del', text: L });
      if (R != null) rows.push({ type: 'add', text: R });
    }
  }
  return rows;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function markdownLite(md) {
  let html = escapeHtml(md);
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

/** Convert simple markdown into rich-text nodes array. */
function markdownToNodes(md) {
  const lines = String(md || '').split(/\r?\n/);
  const nodes = [];
  lines.forEach((line, idx) => {
    let name = 'p';
    let text = line;
    let style = 'margin:0 0 8px;line-height:1.6;font-size:14px;color:#1d1b18;';
    if (/^###\s+/.test(line)) {
      name = 'h3';
      text = line.replace(/^###\s+/, '');
      style = 'margin:12px 0 6px;font-size:16px;font-weight:700;color:#274f3a;';
    } else if (/^##\s+/.test(line)) {
      name = 'h2';
      text = line.replace(/^##\s+/, '');
      style = 'margin:14px 0 6px;font-size:18px;font-weight:800;color:#274f3a;';
    } else if (/^#\s+/.test(line)) {
      name = 'h1';
      text = line.replace(/^#\s+/, '');
      style = 'margin:16px 0 8px;font-size:22px;font-weight:800;color:#274f3a;';
    } else if (!line.trim()) {
      nodes.push({ name: 'div', attrs: { style: 'height:8px;' }, children: [] });
      return;
    }

    const children = inlineMarkdownNodes(text);
    nodes.push({ name: name, attrs: { style: style }, children: children });
    if (idx === lines.length - 1) return;
  });
  return nodes;
}

function inlineMarkdownNodes(text) {
  const raw = String(text || '');
  const children = [];
  const re = /(\*\*.+?\*\*|\*.+?\*|`.+?`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(raw))) {
    if (m.index > last) {
      children.push({ type: 'text', text: raw.slice(last, m.index) });
    }
    const token = m[0];
    if (token.startsWith('**')) {
      children.push({
        name: 'strong',
        children: [{ type: 'text', text: token.slice(2, -2) }],
      });
    } else if (token.startsWith('`')) {
      children.push({
        name: 'code',
        attrs: {
          style: 'background:#ede7e1;padding:1px 4px;border-radius:4px;font-size:12px;',
        },
        children: [{ type: 'text', text: token.slice(1, -1) }],
      });
    } else {
      children.push({
        name: 'i',
        children: [{ type: 'text', text: token.slice(1, -1) }],
      });
    }
    last = m.index + token.length;
  }
  if (last < raw.length) children.push({ type: 'text', text: raw.slice(last) });
  if (!children.length) children.push({ type: 'text', text: '' });
  return children;
}

function fakeTranslate(text, to) {
  const t = String(text || '').trim();
  if (!t) throw new Error('请输入文本');
  if (to === 'en') return '[EN] ' + t;
  if (to === 'ja') return '[JA] ' + t;
  return '[ZH] ' + t;
}

function qrPayload(text) {
  const t = String(text || '').trim();
  if (!t) throw new Error('请输入内容');
  return t;
}

function createQrCode(text) {
  return qr.createQrCode(text);
}

/** Flatten QR modules into wxml-friendly rows of cells. */
function qrToRows(qrResult) {
  const modules = qrResult.modules || [];
  return modules.map((row, r) => ({
    key: 'r' + r,
    cells: row.map((on, c) => ({ key: 'c' + r + '-' + c, on: !!on })),
  }));
}

function compassDirection(deg) {
  const d = ((Number(deg) % 360) + 360) % 360;
  const labels = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const idx = Math.round(d / 45) % 8;
  return { degree: Math.round(d), label: labels[idx] };
}

function formatStopwatch(ms) {
  ms = Math.max(0, Number(ms) || 0);
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  function pad(n) {
    return (n < 10 ? '0' : '') + n;
  }
  return pad(m) + ':' + pad(s) + '.' + pad(cs);
}

function parseWeatherText(raw, city) {
  const text = String(raw || '');
  // wttr.in format e.g. "Shanghai: ☁️ +22°C"
  const tempMatch = text.match(/([+-]?\d+)\s*°C/);
  const conditionMatch = text.match(/:\s*[^\S\r\n]*([^\n+]+?)\s*[+-]?\d/);
  return {
    city: city || '未知',
    temp: tempMatch ? Number(tempMatch[1]) : null,
    condition: conditionMatch ? conditionMatch[1].trim() : text.trim().slice(0, 40),
    raw: text.trim(),
    humidity: null,
    wind: null,
  };
}

module.exports = {
  calculatorPress,
  safeEvalExpression,
  wordCount,
  caseConvert,
  formatJson,
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  randomInt,
  pickRandom,
  generatePassword,
  tipSplit,
  bmi,
  convertUnit,
  convertTemperature,
  LENGTH,
  WEIGHT,
  TEMP,
  hexToRgb,
  rgbToHex,
  dateDiff,
  lorem,
  simpleDiff,
  markdownLite,
  markdownToNodes,
  fakeTranslate,
  qrPayload,
  createQrCode,
  qrToRows,
  compassDirection,
  formatStopwatch,
  parseWeatherText,
  round2,
};
