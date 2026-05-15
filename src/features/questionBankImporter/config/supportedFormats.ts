export type SupportLevel = 'full' | 'basic' | 'backend-required';

export interface SupportedFormat {
  extension: string;
  label: string;
  level: SupportLevel;
  description: string;
}

export const supportedFormats: SupportedFormat[] = [
  {
    extension: '.txt',
    label: 'TXT',
    level: 'full',
    description: '浏览器端解析题号、选项、答案、解析、Q/A。',
  },
  {
    extension: '.md',
    label: 'Markdown',
    level: 'full',
    description: '在 TXT 规则基础上支持标题标签、分隔线和代码块跳过。',
  },
  {
    extension: '.csv',
    label: 'CSV',
    level: 'full',
    description: '支持中英文字段、引号转义、选项列、标签、难度。',
  },
  {
    extension: '.json',
    label: 'JSON',
    level: 'full',
    description: '支持 questions 包裹数组、直接数组和中文字段。',
  },
  {
    extension: '.zip',
    label: 'ZIP',
    level: 'full',
    description: '浏览器端读取文件树，并解析内部 txt/md/csv/json/doc/docx。',
  },
  {
    extension: '.rar',
    label: 'RAR',
    level: 'full',
    description: '浏览器端解压 RAR，并解析内部 txt/md/csv/json/doc/docx。',
  },
  {
    extension: '.docx',
    label: 'DOCX',
    level: 'full',
    description: '浏览器端抽取 Word 文本，并按题号、选项、答案解析为题目。',
  },
  {
    extension: '.doc',
    label: 'DOC',
    level: 'basic',
    description: '浏览器端做兼容式文本抽取，复杂旧版 Word 建议先另存为 DOCX。',
  },
  {
    extension: '.xlsx',
    label: 'Excel',
    level: 'basic',
    description: '当前为 adapter 占位，建议后端解析后返回统一题目结构。',
  },
  {
    extension: '.xls',
    label: 'XLS',
    level: 'basic',
    description: '当前为 adapter 占位，建议后端解析后返回统一题目结构。',
  },
  {
    extension: '.pdf',
    label: 'PDF',
    level: 'basic',
    description: '当前不做完整文本抽取，建议接入后端 OCR/解析服务。',
  },
  {
    extension: '.7z',
    label: '7Z',
    level: 'backend-required',
    description: '浏览器端不假装支持，需要后端解压服务。',
  },
];

export const textLocalExtensions = new Set(['txt', 'md', 'csv', 'json']);
export const wordLocalExtensions = new Set(['doc', 'docx']);
export const archiveReadableExtensions = new Set(['txt', 'md', 'csv', 'json', 'doc', 'docx']);
export const fullLocalExtensions = new Set([
  ...textLocalExtensions,
  ...wordLocalExtensions,
  'zip',
  'rar',
]);
export const placeholderExtensions = new Set(['xlsx', 'xls', 'pdf']);
export const backendRequiredExtensions = new Set(['7z']);
