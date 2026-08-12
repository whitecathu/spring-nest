const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_IMPORT_QUESTIONS = 2000;

function createImportError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function utf8ByteLength(value) {
  const text = String(value == null ? '' : value);
  let bytes = 0;
  for (let index = 0; index < text.length; index += 1) {
    const codePoint = text.charCodeAt(index);
    if (codePoint < 0x80) {
      bytes += 1;
    } else if (codePoint < 0x800) {
      bytes += 2;
    } else if (codePoint >= 0xd800 && codePoint <= 0xdbff && index + 1 < text.length) {
      const next = text.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        index += 1;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

function assertImportSize(valueOrBytes) {
  const bytes =
    typeof valueOrBytes === 'number' ? valueOrBytes : utf8ByteLength(valueOrBytes || '');
  if (Number.isFinite(bytes) && bytes > MAX_IMPORT_BYTES) {
    throw createImportError('IMPORT_FILE_TOO_LARGE', '文件超过 2 MiB，请拆分后再导入。');
  }
  return bytes;
}

function assertQuestionCount(questions) {
  const count = Array.isArray(questions) ? questions.length : Number(questions) || 0;
  if (count > MAX_IMPORT_QUESTIONS) {
    throw createImportError(
      'IMPORT_TOO_MANY_QUESTIONS',
      '题目超过 2000 道，请拆分成多个题集后导入。',
    );
  }
  return count;
}

function assertStorageCapacity(value) {
  if (typeof wx === 'undefined' || typeof wx.getStorageInfoSync !== 'function') return;

  let info;
  try {
    info = wx.getStorageInfoSync();
  } catch (err) {
    return;
  }

  const limitKiB = Number(info && info.limitSize);
  const currentKiB = Number(info && info.currentSize);
  if (!Number.isFinite(limitKiB) || !Number.isFinite(currentKiB)) return;

  const requiredBytes = utf8ByteLength(JSON.stringify(value));
  const availableBytes = Math.max(0, limitKiB - currentKiB) * 1024;
  if (requiredBytes > availableBytes) {
    const shortfallKiB = Math.max(1, Math.ceil((requiredBytes - availableBytes) / 1024));
    throw createImportError(
      'IMPORT_STORAGE_FULL',
      '本机存储空间不足，预计还需 ' + shortfallKiB + ' KiB，请先删除不再使用的题集。',
    );
  }
}

module.exports = {
  MAX_IMPORT_BYTES,
  MAX_IMPORT_QUESTIONS,
  utf8ByteLength,
  assertImportSize,
  assertQuestionCount,
  assertStorageCapacity,
};
