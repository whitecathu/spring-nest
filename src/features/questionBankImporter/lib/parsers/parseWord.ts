import type { ParserContext, ParserOutput } from './types';
import { parseText } from './parseText';

type WordExtension = 'doc' | 'docx';
type MammothApi = typeof import('mammoth');

let mammothPromise: Promise<MammothApi> | undefined;

function loadMammoth(): Promise<MammothApi> {
  mammothPromise =
    mammothPromise ??
    import('mammoth').then((module) => {
      const candidate = module as MammothApi & { default?: MammothApi };
      return candidate.default ?? candidate;
    });
  return mammothPromise;
}

function toArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy.buffer;
}

function firstUsefulTextIndex(text: string): number {
  const patterns = [
    /(?:^|\n)\s*第[一二三四五六七八九十\d]+[章节]/,
    /(?:^|\n)\s*(?:一[、.．]\s*)?(?:单项选择题|单项选择|单选题|多项选择题|多选题|判断题|选择题|练习题)/,
    /(?:^|\n)\s*1\s*[.、．)]/,
  ];
  const indexes = patterns
    .map((pattern) => {
      const match = pattern.exec(text);
      if (!match) return -1;
      const nonWhitespaceOffset = match[0].search(/\S/);
      return match.index + Math.max(0, nonWhitespaceOffset);
    })
    .filter((index) => index >= 0);

  return indexes.length ? Math.min(...indexes) : 0;
}

function shouldDropLine(line: string): boolean {
  if (/^HYPERLINK\s+/i.test(line)) return true;
  if (/^(?:PAGEREF|PAGE(?:\s*\d)?|MERGEFORMAT|INCLUDEPICTURE)\b/i.test(line)) return true;
  return !/[A-Za-z0-9\u4e00-\u9fff（）()《》【】]/.test(line);
}

function compactDocumentLines(text: string): string {
  const output: string[] = [];
  let pendingOptionMarker: string | undefined;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (shouldDropLine(line)) continue;

    if (/^[A-F]\s*[.、．)]$/.test(line)) {
      if (pendingOptionMarker) output.push(pendingOptionMarker);
      pendingOptionMarker = line;
      continue;
    }

    if (pendingOptionMarker) {
      output.push(`${pendingOptionMarker} ${line}`);
      pendingOptionMarker = undefined;
      continue;
    }

    output.push(line);
  }

  if (pendingOptionMarker) output.push(pendingOptionMarker);
  return output
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function normalizeExtractedDocumentText(text: string): string {
  const cleaned = replaceControlCharacters(
    text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' '),
  ).replace(/[\ufffd\ue000-\uf8ff]/g, ' ');

  const usefulText = cleaned.slice(firstUsefulTextIndex(cleaned));
  const compacted = compactDocumentLines(usefulText);
  const lastAnswer = compacted.lastIndexOf(String.raw`【正确答案是】`);
  if (lastAnswer > 0) {
    const cutoff = compacted.indexOf(
      String.raw`
`,
      lastAnswer + 20,
    );
    if (cutoff > 0) return compacted.slice(0, cutoff);
  }
  return compacted;
}

function replaceControlCharacters(text: string): string {
  let result = '';
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code === 0) continue;
    if ((code >= 1 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31)) {
      result += '\n';
      continue;
    }
    result += char;
  }
  return result;
}

function extractLegacyDocText(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return normalizeExtractedDocumentText(new TextDecoder('utf-16le').decode(bytes));
}

async function extractDocxText(
  data: ArrayBuffer | Uint8Array,
): Promise<{ text: string; warnings: string[] }> {
  const mammoth = await loadMammoth();
  const arrayBuffer = toArrayBuffer(data);
  const input =
    typeof Buffer !== 'undefined'
      ? ({ buffer: Buffer.from(arrayBuffer) } as Parameters<MammothApi['extractRawText']>[0])
      : { arrayBuffer };
  const result = await mammoth.extractRawText(input);
  return {
    text: normalizeExtractedDocumentText(result.value),
    warnings: result.messages.map((message) => message.message).filter(Boolean),
  };
}

export async function parseWordDocument(
  data: ArrayBuffer | Uint8Array,
  context: ParserContext,
  extension: WordExtension,
): Promise<ParserOutput> {
  const extracted =
    extension === 'docx'
      ? await extractDocxText(data)
      : {
          text: extractLegacyDocText(data),
          warnings: ['旧版 DOC 使用兼容式文本抽取，复杂排版建议先另存为 DOCX。'],
        };

  if (!extracted.text) {
    return {
      questions: [],
      warnings: [`${context.sourcePath ?? context.sourceFile} 未抽取到可解析文本。`],
    };
  }

  const parsed = parseText(extracted.text, context);
  return {
    questions: parsed.questions,
    warnings: [...extracted.warnings, ...parsed.warnings],
  };
}
