/**
 * Compact QR Code encoder (byte mode, ECC level M).
 * Returns { size, modules } where modules is a size×size boolean matrix (true = dark).
 * Based on public QR Code Model 2 structure (ISO/IEC 18004).
 */

const QR_MODE_BYTE = 4;
const QR_ECC_M = 0;

const ECC_TABLE = [
  // [totalDataCodewords, ecPerBlock, blocks] for versions 1-10, ECC M
  [16, 10, 1],
  [28, 16, 1],
  [44, 26, 1],
  [64, 18, 2],
  [86, 24, 2],
  [108, 16, 4],
  [124, 18, 4],
  [154, 22, 4],
  [182, 22, 5],
  [216, 26, 5],
];

const ALIGNMENT = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

function galoisExp() {
  const exp = new Array(512);
  const log = new Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  return { exp: exp, log: log };
}

const GF = galoisExp();

function rsGenerator(ecLen) {
  let poly = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= mul(poly[j], GF.exp[i]);
    }
    poly = next;
  }
  return poly;
}

function mul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF.exp[GF.log[a] + GF.log[b]];
}

function rsEncode(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const res = data.slice().concat(new Array(ecLen).fill(0));
  for (let i = 0; i < data.length; i++) {
    const coef = res[i];
    if (coef === 0) continue;
    for (let j = 0; j < gen.length; j++) {
      res[i + j] ^= mul(gen[j], coef);
    }
  }
  return res.slice(data.length);
}

function bitBuffer() {
  return { bytes: [], bitLength: 0 };
}

function putBits(buf, value, len) {
  for (let i = len - 1; i >= 0; i--) {
    const bit = (value >>> i) & 1;
    const pos = buf.bitLength >> 3;
    if (buf.bytes.length <= pos) buf.bytes.push(0);
    if (bit) buf.bytes[pos] |= 0x80 >> (buf.bitLength & 7);
    buf.bitLength++;
  }
}

function utf8Bytes(text) {
  const str = String(text || '');
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) {
      out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const c2 = str.charCodeAt(++i);
      const cp = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff);
      out.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f)
      );
    } else {
      out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    }
  }
  return out;
}

function chooseVersion(byteLen) {
  for (let v = 1; v <= 10; v++) {
    const capacity = ECC_TABLE[v - 1][0];
    // mode(4) + charCount(8 for v<=9, 16 for v>=10) + data + terminator overhead ~4
    const countBits = v <= 9 ? 8 : 16;
    const needed = Math.ceil((4 + countBits + byteLen * 8 + 4) / 8);
    if (needed <= capacity) return v;
  }
  throw new Error('内容过长，请缩短后再生成二维码');
}

function sizeOf(version) {
  return 17 + 4 * version;
}

function makeMatrix(size) {
  const m = new Array(size);
  for (let i = 0; i < size; i++) {
    m[i] = new Array(size).fill(null);
  }
  return m;
}

function placeFinder(m, x, y) {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (yy < 0 || xx < 0 || yy >= m.length || xx >= m.length) continue;
      const dark =
        (dx >= 0 && dx <= 6 && (dy === 0 || dy === 6)) ||
        (dy >= 0 && dy <= 6 && (dx === 0 || dx === 6)) ||
        (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      m[yy][xx] = dark;
    }
  }
}

function placeAlignment(m, x, y) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const dark = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
      m[y + dy][x + dx] = dark;
    }
  }
}

function placeTiming(m) {
  for (let i = 8; i < m.length - 8; i++) {
    if (m[6][i] === null) m[6][i] = i % 2 === 0;
    if (m[i][6] === null) m[i][6] = i % 2 === 0;
  }
}

function reserveFormat(m) {
  const n = m.length;
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) m[8][i] = false;
    if (m[i][8] === null) m[i][8] = false;
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][n - 1 - i] === null) m[8][n - 1 - i] = false;
    if (m[n - 1 - i][8] === null) m[n - 1 - i][8] = false;
  }
  m[n - 8][8] = true;
}

function placeData(m, data) {
  const n = m.length;
  let bitIdx = 0;
  let dirUp = true;
  for (let right = n - 1; right > 0; right -= 2) {
    if (right === 6) right = 5;
    for (let i = 0; i < n; i++) {
      const y = dirUp ? n - 1 - i : i;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (m[y][x] !== null) continue;
        let bit = false;
        if (bitIdx < data.length * 8) {
          const b = data[bitIdx >> 3];
          bit = ((b >> (7 - (bitIdx & 7))) & 1) === 1;
        }
        m[y][x] = bit;
        bitIdx++;
      }
    }
    dirUp = !dirUp;
  }
}

function maskFn(mask, x, y) {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    case 7:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return false;
  }
}

function applyMask(m, mask) {
  const n = m.length;
  const out = makeMatrix(n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      out[y][x] = m[y][x];
    }
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      // only flip data modules: those that were null before format — approximate via finder/timing reserved
      if (isFunctionModule(n, x, y)) continue;
      if (maskFn(mask, x, y)) out[y][x] = !out[y][x];
    }
  }
  return out;
}

function isFunctionModule(n, x, y) {
  if (y < 9 && x < 9) return true;
  if (y < 9 && x >= n - 8) return true;
  if (y >= n - 8 && x < 9) return true;
  if (y === 6 || x === 6) return true;
  return false;
}

function formatBits(mask) {
  // ECC M = 00, mask 3 bits
  const data = (QR_ECC_M << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  }
  const bits = ((data << 10) | rem) ^ 0x5412;
  return bits;
}

function drawFormat(m, mask) {
  const bits = formatBits(mask);
  const n = m.length;
  const positions1 = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  const positions2 = [
    [n - 1, 8], [n - 2, 8], [n - 3, 8], [n - 4, 8], [n - 5, 8], [n - 6, 8], [n - 7, 8],
    [8, n - 8], [8, n - 7], [8, n - 6], [8, n - 5], [8, n - 4], [8, n - 3], [8, n - 2], [8, n - 1],
  ];
  for (let i = 0; i < 15; i++) {
    const bit = ((bits >> (14 - i)) & 1) === 1;
    m[positions1[i][1]][positions1[i][0]] = bit;
    m[positions2[i][1]][positions2[i][0]] = bit;
  }
}

function penalty(m) {
  const n = m.length;
  let score = 0;
  // adjacent same color
  for (let y = 0; y < n; y++) {
    let run = 1;
    for (let x = 1; x < n; x++) {
      if (m[y][x] === m[y][x - 1]) {
        run++;
        if (run === 5) score += 3;
        else if (run > 5) score += 1;
      } else run = 1;
    }
  }
  for (let x = 0; x < n; x++) {
    let run = 1;
    for (let y = 1; y < n; y++) {
      if (m[y][x] === m[y - 1][x]) {
        run++;
        if (run === 5) score += 3;
        else if (run > 5) score += 1;
      } else run = 1;
    }
  }
  let dark = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) if (m[y][x]) dark++;
  }
  const ratio = Math.abs((100 * dark) / (n * n) - 50) / 5;
  score += ratio * 10;
  return score;
}

function interleave(version, dataCodewords) {
  const meta = ECC_TABLE[version - 1];
  const totalData = meta[0];
  const ecPerBlock = meta[1];
  const blocks = meta[2];
  const shortBlocks = blocks - (totalData % blocks);
  const shortLen = Math.floor(totalData / blocks);
  const longLen = shortLen + 1;

  const padded = dataCodewords.slice();
  while (padded.length < totalData) {
    padded.push(padded.length % 2 === 0 ? 0xec : 0x11);
  }

  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let i = 0; i < blocks; i++) {
    const len = i < shortBlocks ? shortLen : longLen;
    const block = padded.slice(offset, offset + len);
    offset += len;
    dataBlocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
  }

  const result = [];
  const maxData = longLen;
  for (let i = 0; i < maxData; i++) {
    for (let b = 0; b < blocks; b++) {
      if (i < dataBlocks[b].length) result.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < blocks; b++) result.push(ecBlocks[b][i]);
  }
  return result;
}

function buildRaw(version, bytes) {
  const buf = bitBuffer();
  putBits(buf, QR_MODE_BYTE, 4);
  putBits(buf, bytes.length, version <= 9 ? 8 : 16);
  for (let i = 0; i < bytes.length; i++) putBits(buf, bytes[i], 8);
  const capacityBits = ECC_TABLE[version - 1][0] * 8;
  const remain = capacityBits - buf.bitLength;
  putBits(buf, 0, Math.min(4, remain));
  while (buf.bitLength % 8 !== 0) putBits(buf, 0, 1);
  return buf.bytes;
}

function createQrCode(text) {
  const payload = String(text || '').trim();
  if (!payload) throw new Error('请输入内容');
  const bytes = utf8Bytes(payload);
  const version = chooseVersion(bytes.length);
  const raw = buildRaw(version, bytes);
  const data = interleave(version, raw);
  const size = sizeOf(version);
  const m = makeMatrix(size);

  placeFinder(m, 0, 0);
  placeFinder(m, size - 7, 0);
  placeFinder(m, 0, size - 7);
  placeTiming(m);
  reserveFormat(m);

  const aligns = ALIGNMENT[version - 1] || [];
  for (let i = 0; i < aligns.length; i++) {
    for (let j = 0; j < aligns.length; j++) {
      const ax = aligns[j];
      const ay = aligns[i];
      if ((ax < 10 && ay < 10) || (ax > size - 11 && ay < 10) || (ax < 10 && ay > size - 11)) continue;
      placeAlignment(m, ax, ay);
    }
  }

  // dark module
  m[size - 8][8] = true;

  placeData(m, data);

  let bestMask = 0;
  let bestScore = Infinity;
  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const masked = applyMask(m, mask);
    drawFormat(masked, mask);
    const score = penalty(masked);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
      best = masked;
    }
  }

  const modules = best.map((row) => row.map((cell) => !!cell));
  return {
    size: size,
    modules: modules,
    version: version,
    mask: bestMask,
    text: payload,
  };
}

module.exports = {
  createQrCode,
};
