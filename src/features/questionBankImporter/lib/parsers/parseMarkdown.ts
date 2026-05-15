import type { ParserContext, ParserOutput } from './types';
import { parseText, stripMarkdownCodeBlocks } from './parseText';

export function parseMarkdown(text: string, context: ParserContext): ParserOutput {
  let currentTags = [...(context.defaultTags ?? [])];
  const warnings: string[] = [];
  const questions = [];

  const withoutCode = stripMarkdownCodeBlocks(text).replace(/\r\n/g, '\n');
  const sections = withoutCode.split(/^---+\s*$/m);

  for (const section of sections) {
    const lines: string[] = [];
    for (const line of section.split('\n')) {
      const heading = line.match(/^\s{0,3}#{1,6}\s+(.+)$/);
      if (heading) {
        currentTags = [...(context.defaultTags ?? []), heading[1].trim()];
        continue;
      }
      lines.push(line.replace(/^\s*[-*]\s+(?=(?:\d+[.、)]|题目|Q[:：]))/i, ''));
    }
    const result = parseText(lines.join('\n'), { ...context, defaultTags: currentTags });
    warnings.push(...result.warnings);
    questions.push(...result.questions);
  }

  return {
    questions,
    warnings: [...new Set(warnings)],
  };
}
