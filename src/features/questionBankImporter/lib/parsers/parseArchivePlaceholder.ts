import type { ParserContext, ParserOutput } from './types';

export function parseArchivePlaceholder(_text: string, context: ParserContext): ParserOutput {
  const path = context.sourcePath ?? context.sourceFile;
  return {
    questions: [],
    warnings: [`${path} 当前需要后端解析服务支持，浏览器端不会伪装成完整支持。`],
  };
}
