import type { BookkeepingEntry } from './bookkeeping';

export type BillFormat = 'wechat' | 'alipay' | 'generic' | 'unknown';

export const MAX_BILL_IMPORT_BYTES = 10 * 1024 * 1024;
export const MAX_BILL_IMPORT_ROWS = 20_000;

type BillImportKind = 'text' | 'xlsx';

const MIME_BY_EXTENSION: Record<string, ReadonlySet<string>> = {
  csv: new Set(['', 'text/csv', 'application/csv', 'text/plain']),
  txt: new Set(['', 'text/plain', 'text/csv']),
  xlsx: new Set([
    '',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
  ]),
};

export interface ImportedRow {
  date: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  account: string;
  note: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalize full-width chars to ASCII half-width for matching */
function normalizeWidth(text: string): string {
  return text
    .replace(/／/g, '/')
    .replace(/，/g, ',')
    .replace(/：/g, ':')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/﻿/g, ''); // BOM
}

/** Parse a single CSV line, respecting quoted fields */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[¥￥,\s元]/g, '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.abs(val);
}

// ─── Category Mapping ────────────────────────────────────────────────────────

const WECHAT_CATEGORY_MAP: Record<string, string> = {
  商户消费: '购物',
  扫二维码付款: '购物',
  微信红包: '礼金',
  转账: '其他',
  群收款: '其他',
  充值缴费: '居住',
  交通出行: '交通',
  餐饮: '餐饮',
  外卖: '餐饮',
  滴滴: '交通',
  美团: '餐饮',
  京东: '购物',
  淘宝: '购物',
  拼多多: '购物',
};

const ALIPAY_CATEGORY_MAP: Record<string, string> = {
  消费: '购物',
  转账: '其他',
  红包: '礼金',
  还款: '其他',
  充值: '其他',
  缴费: '居住',
  交通出行: '交通',
  餐饮美食: '餐饮',
  外卖: '餐饮',
  购物: '购物',
  娱乐: '娱乐',
  医疗健康: '健康',
  教育学习: '学习',
};

function guessCategory(note: string, format: BillFormat): string {
  const map = format === 'wechat' ? WECHAT_CATEGORY_MAP : ALIPAY_CATEGORY_MAP;
  for (const [keyword, cat] of Object.entries(map)) {
    if (note.includes(keyword)) return cat;
  }
  return '其他';
}

// ─── Encoding Detection & Decode ─────────────────────────────────────────────

export function validateBillImportFile(file: File): BillImportKind {
  if (file.size > MAX_BILL_IMPORT_BYTES) {
    throw new Error('导入文件不能超过 10 MB');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (extension === 'xls') {
    throw new Error('不再支持旧版 .xls，请另存为 .xlsx 后重试');
  }

  const acceptedMimes = MIME_BY_EXTENSION[extension];
  if (!acceptedMimes) {
    throw new Error('仅支持 .csv、.txt 和 .xlsx 文件');
  }

  const mime = file.type.toLowerCase();
  if (!acceptedMimes.has(mime)) {
    throw new Error(`文件扩展名与 MIME 类型不一致：.${extension} / ${mime || 'unknown'}`);
  }

  return extension === 'xlsx' ? 'xlsx' : 'text';
}

function hasZipHeader(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 4));
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) return false;
  return (
    (bytes[2] === 0x03 && bytes[3] === 0x04) ||
    (bytes[2] === 0x05 && bytes[3] === 0x06) ||
    (bytes[2] === 0x07 && bytes[3] === 0x08)
  );
}

function serializeSpreadsheetRows(rows: unknown[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value =
            cell instanceof Date
              ? cell.toISOString().replace('T', ' ').slice(0, 19)
              : cell == null
                ? ''
                : String(cell);
          return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(','),
    )
    .join('\n');
}

async function decodeFile(file: File): Promise<string> {
  const kind = validateBillImportFile(file);

  if (kind === 'xlsx') {
    const buffer = await file.arrayBuffer();
    if (!hasZipHeader(buffer)) {
      throw new Error('无效的 .xlsx：文件头不是 ZIP/OOXML 容器');
    }

    const { default: readXlsxFile } = await import('read-excel-file/browser');
    const sheets = await readXlsxFile(buffer);
    const rows = sheets[0]?.data ?? [];
    if (rows.length > MAX_BILL_IMPORT_ROWS) {
      throw new Error(`工作表不能超过 ${MAX_BILL_IMPORT_ROWS.toLocaleString()} 行`);
    }
    return serializeSpreadsheetRows(rows);
  }

  let text = await file.text();
  if (text.split(/\r?\n/).length > MAX_BILL_IMPORT_ROWS) {
    throw new Error(`账单不能超过 ${MAX_BILL_IMPORT_ROWS.toLocaleString()} 行`);
  }

  // Remove BOM
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  // If we see replacement characters, try GBK
  if (text.includes('�')) {
    try {
      const buffer = await file.arrayBuffer();
      text = new TextDecoder('gbk').decode(buffer);
    } catch {
      // keep UTF-8 result
    }
  }

  // Also try GBK if file looks like garbled Chinese
  if (
    !text.includes('交易') &&
    !text.includes('微信') &&
    !text.includes('支付宝') &&
    !text.includes('记录时间')
  ) {
    try {
      const buffer = await file.arrayBuffer();
      const gbkText = new TextDecoder('gbk').decode(buffer);
      if (
        gbkText.includes('交易') ||
        gbkText.includes('微信') ||
        gbkText.includes('支付宝') ||
        gbkText.includes('记录时间')
      ) {
        text = gbkText;
      }
    } catch {
      // keep original
    }
  }

  return text;
}

// ─── Format Detection (scan multiple lines, normalize full-width) ────────────

export function detectBillFormat(text: string): BillFormat {
  const lines = text.split('\n');

  // Scan ALL lines for header (Alipay has long disclaimer before header)
  for (let i = 0; i < lines.length; i++) {
    const line = normalizeWidth(lines[i]);

    // WeChat header: 交易时间 + 交易类型
    if (line.includes('交易时间') && line.includes('交易类型')) {
      return 'wechat';
    }
    // WeChat metadata
    if (line.includes('微信支付账单')) {
      return 'wechat';
    }
    // Alipay header: 交易创建时间 or 商家订单号
    if (line.includes('交易创建时间') || line.includes('商家订单号')) {
      return 'alipay';
    }
    // Alipay alternate: 交易号 + 交易对方
    if (line.includes('交易号') && line.includes('交易对方')) {
      return 'alipay';
    }
    // Generic accounting app: 记录时间 + 分类 + 收支
    if (line.includes('记录时间') && line.includes('分类') && line.includes('收支')) {
      return 'generic';
    }
  }

  // Fallback
  if (text.includes('支付宝')) return 'alipay';
  if (text.includes('微信')) return 'wechat';

  return 'unknown';
}

// ─── Find Header Row Index ───────────────────────────────────────────────────

function findHeaderRow(lines: string[], keywords: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const line = normalizeWidth(lines[i]);
    if (keywords.every((k) => line.includes(k))) {
      return i;
    }
  }
  return -1;
}

// ─── Find Column Index (fuzzy match on normalized header) ────────────────────

function findCol(headerCols: string[], ...keywords: string[]): number {
  const normalized = headerCols.map(normalizeWidth);
  for (const kw of keywords) {
    const idx = normalized.findIndex((c) => c.includes(kw));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ─── WeChat Bill Parser ──────────────────────────────────────────────────────

export function parseWechatBill(text: string): ImportedRow[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: ImportedRow[] = [];

  // Find header row containing 交易时间 and 交易类型
  const headerIdx = findHeaderRow(lines, ['交易时间', '交易类型']);
  if (headerIdx === -1) return rows;

  const headerCols = parseCsvLine(normalizeWidth(lines[headerIdx]));

  const timeIdx = findCol(headerCols, '交易时间');
  const typeIdx = findCol(headerCols, '交易类型');
  const counterpartIdx = findCol(headerCols, '交易对方');
  const productIdx = findCol(headerCols, '商品');
  const directionIdx = findCol(headerCols, '收/支', '收支');
  const amountIdx = findCol(headerCols, '金额');
  const payMethodIdx = findCol(headerCols, '支付方式', '支付');
  const statusIdx = findCol(headerCols, '当前状态', '状态');

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('共') || line.startsWith('-')) continue;

    const cols = parseCsvLine(line);
    if (cols.length < 5) continue;

    // Skip refunded
    if (statusIdx >= 0 && cols[statusIdx]) {
      const status = normalizeWidth(cols[statusIdx]);
      if (status.includes('已退款') || status.includes('已退还')) continue;
    }

    // Parse date
    const timeStr = timeIdx >= 0 ? cols[timeIdx] : '';
    const dateMatch = timeStr.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
    if (!dateMatch) continue;
    const date = dateMatch[1].replace(/\//g, '-');

    // Parse direction
    const direction = directionIdx >= 0 ? normalizeWidth(cols[directionIdx] || '') : '';
    const isIncome = direction.includes('收入');
    const type: 'expense' | 'income' = isIncome ? 'income' : 'expense';

    // Parse amount
    const amountStr = amountIdx >= 0 ? cols[amountIdx] : '';
    const amount = parseAmount(amountStr);
    if (amount <= 0) continue;

    // Build note
    const counterpart = counterpartIdx >= 0 ? cols[counterpartIdx] : '';
    const product = productIdx >= 0 ? cols[productIdx] : '';
    const txType = typeIdx >= 0 ? cols[typeIdx] : '';
    const note = [counterpart, product, txType].filter(Boolean).join(' ');

    const category = guessCategory(note, 'wechat');
    const account = payMethodIdx >= 0 ? cols[payMethodIdx] || '微信' : '微信';

    rows.push({ date, type, amount, category, account, note });
  }

  return rows;
}

// ─── Alipay Bill Parser ──────────────────────────────────────────────────────

export function parseAlipayBill(text: string): ImportedRow[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: ImportedRow[] = [];

  // Find header row
  const headerIdx =
    findHeaderRow(lines, ['交易创建时间']) >= 0
      ? findHeaderRow(lines, ['交易创建时间'])
      : findHeaderRow(lines, ['交易号', '交易对方']);
  if (headerIdx === -1) return rows;

  const headerCols = parseCsvLine(normalizeWidth(lines[headerIdx]));

  const createTimeIdx = findCol(headerCols, '交易创建时间', '创建时间');
  const payTimeIdx = findCol(headerCols, '付款时间');
  const counterpartIdx = findCol(headerCols, '交易对方', '对方');
  const productIdx = findCol(headerCols, '商品名称', '商品说明', '商品');
  const amountIdx = findCol(headerCols, '金额');
  const directionIdx = findCol(headerCols, '收/支', '收支');
  const statusIdx = findCol(headerCols, '交易状态', '状态');
  const typeIdx = findCol(headerCols, '类型');
  const noteIdx = findCol(headerCols, '备注');

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('共') || line.startsWith('-') || line.startsWith('交易记录'))
      continue;

    const cols = parseCsvLine(line);
    if (cols.length < 5) continue;

    // Skip non-successful
    if (statusIdx >= 0 && cols[statusIdx]) {
      const status = normalizeWidth(cols[statusIdx]);
      if (status.includes('关闭') || status.includes('退款')) continue;
    }

    // Parse date
    let date = '';
    for (const idx of [payTimeIdx, createTimeIdx]) {
      if (idx >= 0 && cols[idx]) {
        const dm = cols[idx].match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
        if (dm) {
          date = dm[1].replace(/\//g, '-');
          break;
        }
      }
    }
    if (!date) {
      for (const col of cols) {
        const dm = col.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
        if (dm) {
          date = dm[1].replace(/\//g, '-');
          break;
        }
      }
    }
    if (!date) continue;

    // Parse amount
    const amountStr = amountIdx >= 0 ? cols[amountIdx] : '';
    const amount = parseAmount(amountStr);
    if (amount <= 0) continue;

    // Parse direction
    let type: 'expense' | 'income' = 'expense';
    if (directionIdx >= 0 && cols[directionIdx]) {
      const dir = normalizeWidth(cols[directionIdx]);
      if (dir.includes('收入')) {
        type = 'income';
      }
    }

    // Build note
    const counterpart = counterpartIdx >= 0 ? cols[counterpartIdx] : '';
    const product = productIdx >= 0 ? cols[productIdx] : '';
    const txType = typeIdx >= 0 ? cols[typeIdx] : '';
    const remark = noteIdx >= 0 ? cols[noteIdx] : '';
    const note = [counterpart, product, txType, remark].filter(Boolean).join(' ');

    const category = guessCategory(note, 'alipay');
    rows.push({ date, type, amount, category, account: '支付宝', note });
  }

  return rows;
}

// ─── Generic Accounting App Parser ───────────────────────────────────────────
// Format: 记录时间,分类,收支类型,金额,备注,账户,来源,标签

export function parseGenericBill(text: string): ImportedRow[] {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: ImportedRow[] = [];

  const headerIdx = findHeaderRow(lines, ['记录时间', '分类', '收支']);
  if (headerIdx === -1) return rows;

  const headerCols = parseCsvLine(normalizeWidth(lines[headerIdx]));

  const timeIdx = findCol(headerCols, '记录时间', '时间', '日期');
  const categoryIdx = findCol(headerCols, '分类', '类别');
  const directionIdx = findCol(headerCols, '收支类型', '收支', '类型');
  const amountIdx = findCol(headerCols, '金额');
  const noteIdx = findCol(headerCols, '备注', '说明');
  const accountIdx = findCol(headerCols, '账户', '账号');
  const tagIdx = findCol(headerCols, '标签');

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('共') || line.startsWith('-')) continue;

    const cols = parseCsvLine(line);
    if (cols.length < 4) continue;

    // Parse date
    const timeStr = timeIdx >= 0 ? cols[timeIdx] : '';
    const dateMatch = timeStr.match(/(\d{4}[-/]\d{2}[-/]\d{2})/);
    if (!dateMatch) continue;
    const date = dateMatch[1].replace(/\//g, '-');

    // Parse direction
    const direction = directionIdx >= 0 ? normalizeWidth(cols[directionIdx] || '') : '';
    let type: 'expense' | 'income' = 'expense';
    if (direction.includes('收入')) {
      type = 'income';
    } else if (direction.includes('不计收支') || direction.includes('转账')) {
      // Skip non-counted entries (transfers, investments)
      continue;
    }

    // Parse amount
    const amountStr = amountIdx >= 0 ? cols[amountIdx] : '';
    const amount = parseAmount(amountStr);
    if (amount <= 0) continue;

    // Category & note
    const category = categoryIdx >= 0 ? cols[categoryIdx] || '其他' : '其他';
    const note = noteIdx >= 0 ? cols[noteIdx] || '' : '';
    const account = accountIdx >= 0 ? cols[accountIdx] || '' : '';

    // Skip transfers and investments (money moving between own accounts)
    if (
      category.includes('转账') ||
      category.includes('投资理财') ||
      note.includes('转出到') ||
      note.includes('转入') ||
      note.includes('余额宝')
    ) {
      continue;
    }

    rows.push({ date, type, amount, category, account, note });
  }

  return rows;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function parseBillFile(
  file: File,
): Promise<{ format: BillFormat; rows: ImportedRow[] }> {
  const text = await decodeFile(file);
  return parseBillText(text);
}

export function parseBillText(text: string): { format: BillFormat; rows: ImportedRow[] } {
  // Remove BOM and normalize before detection
  const clean = normalizeWidth(text);
  const format = detectBillFormat(clean);

  if (format === 'wechat') return { format, rows: parseWechatBill(clean) };
  if (format === 'alipay') return { format, rows: parseAlipayBill(clean) };
  if (format === 'generic') return { format, rows: parseGenericBill(clean) };
  return { format: 'unknown', rows: [] };
}

export function importedRowToEntry(row: ImportedRow, timestamp: number): BookkeepingEntry {
  return {
    id: `import_${timestamp}_${Math.random().toString(36).slice(2, 8)}`,
    type: row.type,
    amount: row.amount,
    category: row.category,
    date: row.date,
    account: row.account,
    note: row.note,
    tags: [],
    createdAt: timestamp,
  };
}
