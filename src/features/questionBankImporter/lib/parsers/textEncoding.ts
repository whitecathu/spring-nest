function toBytes(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

function replacementCount(text: string): number {
  return text.split('\ufffd').length - 1;
}

function decode(bytes: Uint8Array, label: string, fatal = false): string | undefined {
  try {
    return new TextDecoder(label, { fatal }).decode(bytes).replace(/^\ufeff/, '');
  } catch {
    return undefined;
  }
}

export function decodeQuestionText(data: ArrayBuffer | Uint8Array): {
  text: string;
  warning?: string;
} {
  const bytes = toBytes(data);
  const strictUtf8 = decode(bytes, 'utf-8', true);
  if (strictUtf8 !== undefined) return { text: strictUtf8 };

  const lenientUtf8 = decode(bytes, 'utf-8') ?? '';
  const chineseFallback = decode(bytes, 'gb18030') ?? decode(bytes, 'gbk');

  if (!chineseFallback) {
    return {
      text: lenientUtf8,
      warning: '文本编码无法可靠识别，已按 UTF-8 尝试解析。',
    };
  }

  if (replacementCount(chineseFallback) <= replacementCount(lenientUtf8)) {
    return {
      text: chineseFallback,
      warning: '检测到非 UTF-8 文本，已按 GBK/GB18030 兼容解析。',
    };
  }

  return {
    text: lenientUtf8,
    warning: '文本编码不是标准 UTF-8，解析结果可能存在乱码。',
  };
}
