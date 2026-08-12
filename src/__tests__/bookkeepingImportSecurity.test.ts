import { describe, expect, it } from 'vitest';
import {
  MAX_BILL_IMPORT_BYTES,
  MAX_BILL_IMPORT_ROWS,
  parseBillFile,
  validateBillImportFile,
} from '../lib/bookkeepingImport';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function makeFile(name: string, bytes: number[], type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe('bookkeeping import file security', () => {
  it('rejects the legacy binary .xls format', async () => {
    const file = makeFile('legacy.xls', [0xd0, 0xcf, 0x11, 0xe0], 'application/vnd.ms-excel');

    await expect(parseBillFile(file)).rejects.toThrow(/\.xls|xlsx/i);
  });

  it('rejects an oversized import before reading it', () => {
    const file = makeFile('large.xlsx', [0x50, 0x4b, 0x03, 0x04], XLSX_MIME);
    Object.defineProperty(file, 'size', { value: MAX_BILL_IMPORT_BYTES + 1 });

    expect(() => validateBillImportFile(file)).toThrow(/10\s*MB/i);
  });

  it('rejects a forged xlsx that is not an OOXML ZIP container', async () => {
    const file = makeFile('forged.xlsx', [0x3c, 0x68, 0x74, 0x6d, 0x6c], XLSX_MIME);

    await expect(parseBillFile(file)).rejects.toThrow(/OOXML|ZIP|文件头/i);
  });

  it('rejects a spreadsheet MIME on a text extension', () => {
    const file = makeFile('bill.csv', [0x50, 0x4b, 0x03, 0x04], XLSX_MIME);

    expect(() => validateBillImportFile(file)).toThrow(/MIME|类型/i);
  });

  it('rejects text bills above the 20,000 row limit', async () => {
    const text = Array.from(
      { length: MAX_BILL_IMPORT_ROWS + 1 },
      () => '2026-07-29,餐饮,支出,1',
    ).join('\n');
    const file = new File([text], 'too-many.csv', { type: 'text/csv' });

    await expect(parseBillFile(file)).rejects.toThrow(/20[,\s]?000|20000/);
  });
});
