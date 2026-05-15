import { describe, expect, it } from 'vitest';
import { formatFileSize, getFileExtension, getFileStem, validateFile } from '../lib/documentFiles';

describe('document file helpers', () => {
  it('formats file sizes with readable units', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2 MB');
  });

  it('extracts safe file names', () => {
    expect(getFileExtension('Report.DOCX')).toBe('docx');
    expect(getFileStem('invoice:may?.pdf')).toBe('invoice-may-');
  });

  it('rejects empty, oversized, and wrong file types', () => {
    expect(validateFile(new File([], 'empty.docx'), { extensions: ['docx'] }).valid).toBe(false);
    expect(validateFile(new File(['x'], 'notes.txt'), { extensions: ['docx', 'pdf'] }).valid).toBe(
      false,
    );
    expect(
      validateFile(new File(['123456'], 'large.pdf'), { extensions: ['pdf'], maxSize: 3 }).valid,
    ).toBe(false);
  });

  it('accepts matching extensions case-insensitively', () => {
    const result = validateFile(new File(['hello'], 'Draft.PDF'), { extensions: ['pdf'] });
    expect(result).toEqual({ valid: true, extension: 'pdf' });
  });
});
