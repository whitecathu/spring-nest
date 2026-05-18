import { tools } from '../../data/tools';
import type { AppItem } from '../../types/app';

export type MiniProgramTabId = 'home' | 'tools' | 'profile';

export type MiniProgramWorkbenchType =
  | 'quick-calc'
  | 'text-process'
  | 'device-file'
  | 'focus-timer'
  | 'local-data'
  | 'privacy';

export interface MiniProgramTab {
  id: MiniProgramTabId;
  text: string;
  textEn: string;
  pagePath: string;
}

export interface MiniProgramToolCategory {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
}

export interface MiniProgramTool
  extends Pick<
    AppItem,
    | 'id'
    | 'type'
    | 'title'
    | 'titleEn'
    | 'description'
    | 'descriptionEn'
    | 'category'
    | 'categoryEn'
    | 'tags'
    | 'icon'
    | 'route'
    | 'features'
    | 'featuresEn'
    | 'popularScore'
  > {
  slug: string;
  miniCategorySlug: string;
  miniCategoryTitle: string;
  workbenchType: MiniProgramWorkbenchType;
  homePriority: number;
  sensitive: boolean;
}

export const miniProgramTabs: MiniProgramTab[] = [
  { id: 'home', text: '首页', textEn: 'Home', pagePath: 'pages/home/index' },
  { id: 'tools', text: '工具', textEn: 'Tools', pagePath: 'pages/tools/index' },
  { id: 'profile', text: '我的', textEn: 'Me', pagePath: 'pages/profile/index' },
];

export const miniProgramToolCategories: MiniProgramToolCategory[] = [
  { slug: 'daily', title: '日常实用', titleEn: 'Daily', description: '计算、扫描、天气、记账等随手工具' },
  { slug: 'time', title: '时间效率', titleEn: 'Time', description: '专注、倒计时、日期推算' },
  { slug: 'text', title: '文本学习', titleEn: 'Text', description: '写作、格式化、朗读和复习' },
  { slug: 'dev', title: '开发辅助', titleEn: 'Dev', description: 'JSON、编码、颜色和网络查询' },
  { slug: 'document', title: '文档转换', titleEn: 'Docs', description: 'Word 与 PDF 本地转换' },
  { slug: 'random', title: '随机趣味', titleEn: 'Random', description: '抽签、随机数和占位文本' },
  { slug: 'security', title: '安全隐私', titleEn: 'Security', description: '密码与敏感内容处理' },
];

const categorySlugByToolCategory: Record<string, string> = {
  日常实用: 'daily',
  时间效率: 'time',
  学习写作: 'text',
  开发辅助: 'dev',
  文档转换: 'document',
  趣味工具: 'random',
  安全隐私: 'security',
};

const slugByToolId: Record<string, string> = {
  'tool-1': 'calculator',
  'tool-2': 'pomodoro',
  'tool-3': 'converter',
  'tool-4': 'password',
  'tool-5': 'qrcode',
  'tool-6': 'compass',
  'tool-7': 'scanner',
  'tool-8': 'weather',
  'tool-9': 'random-picker',
  'tool-10': 'timer-stopwatch',
  'tool-11': 'word-counter',
  'tool-12': 'markdown-preview',
  'tool-13': 'json-formatter',
  'tool-14': 'base64-codec',
  'tool-15': 'url-codec',
  'tool-16': 'color-converter',
  'tool-17': 'date-calculator',
  'tool-18': 'text-diff',
  'tool-19': 'lorem-generator',
  'tool-20': 'ip-lookup',
  'tool-21': 'tip-calculator',
  'tool-22': 'case-converter',
  'tool-23': 'random-number',
  'tool-24': 'bmi-calculator',
  'tool-25': 'text-to-speech',
  'tool-26': 'word-to-pdf',
  'tool-27': 'pdf-to-word',
  'tool-28': 'question-bank-importer',
  'tool-29': 'bookkeeping',
};

const workbenchByToolId: Record<string, MiniProgramWorkbenchType> = {
  'tool-1': 'quick-calc',
  'tool-2': 'focus-timer',
  'tool-3': 'quick-calc',
  'tool-4': 'privacy',
  'tool-5': 'device-file',
  'tool-6': 'device-file',
  'tool-7': 'device-file',
  'tool-8': 'device-file',
  'tool-9': 'quick-calc',
  'tool-10': 'focus-timer',
  'tool-11': 'text-process',
  'tool-12': 'text-process',
  'tool-13': 'text-process',
  'tool-14': 'text-process',
  'tool-15': 'text-process',
  'tool-16': 'text-process',
  'tool-17': 'quick-calc',
  'tool-18': 'text-process',
  'tool-19': 'text-process',
  'tool-20': 'device-file',
  'tool-21': 'quick-calc',
  'tool-22': 'text-process',
  'tool-23': 'quick-calc',
  'tool-24': 'quick-calc',
  'tool-25': 'text-process',
  'tool-26': 'device-file',
  'tool-27': 'device-file',
  'tool-28': 'local-data',
  'tool-29': 'local-data',
};

const homePriorityByToolId: Record<string, number> = {
  'tool-28': 98,
  'tool-29': 96,
  'tool-2': 94,
  'tool-1': 92,
  'tool-3': 90,
  'tool-13': 86,
  'tool-5': 84,
  'tool-7': 82,
  'tool-26': 80,
  'tool-27': 78,
};

const sensitiveToolIds = new Set([
  'tool-4',
  'tool-13',
  'tool-14',
  'tool-15',
  'tool-26',
  'tool-27',
  'tool-28',
  'tool-29',
]);

function getMiniCategorySlug(tool: AppItem) {
  const slug = categorySlugByToolCategory[tool.category];
  if (!slug) {
    throw new Error(`Missing mini program category mapping for ${tool.id}: ${tool.category}`);
  }
  return slug;
}

function getMiniSlug(tool: AppItem) {
  const slug = slugByToolId[tool.id];
  if (!slug) {
    throw new Error(`Missing mini program slug mapping for ${tool.id}`);
  }
  return slug;
}

function getWorkbenchType(tool: AppItem) {
  const workbenchType = workbenchByToolId[tool.id];
  if (!workbenchType) {
    throw new Error(`Missing mini program workbench mapping for ${tool.id}`);
  }
  return workbenchType;
}

function getCategoryTitle(slug: string) {
  return miniProgramToolCategories.find((category) => category.slug === slug)?.title ?? '工具';
}

export const miniProgramToolCatalog: MiniProgramTool[] = tools.map((tool) => {
  const miniCategorySlug = getMiniCategorySlug(tool);
  return {
    id: tool.id,
    type: tool.type,
    title: tool.title,
    titleEn: tool.titleEn,
    description: tool.description,
    descriptionEn: tool.descriptionEn,
    category: tool.category,
    categoryEn: tool.categoryEn,
    tags: tool.tags,
    icon: tool.icon,
    route: tool.route,
    features: tool.features,
    featuresEn: tool.featuresEn,
    popularScore: tool.popularScore,
    slug: getMiniSlug(tool),
    miniCategorySlug,
    miniCategoryTitle: getCategoryTitle(miniCategorySlug),
    workbenchType: getWorkbenchType(tool),
    homePriority: homePriorityByToolId[tool.id] ?? 0,
    sensitive: sensitiveToolIds.has(tool.id),
  };
});

export function findMiniProgramToolBySlug(slug: string) {
  return miniProgramToolCatalog.find((tool) => tool.slug === slug);
}

export function getMiniProgramHomeTools(limit = 8) {
  return [...miniProgramToolCatalog]
    .filter((tool) => tool.homePriority > 0)
    .sort((a, b) => {
      if (b.homePriority !== a.homePriority) return b.homePriority - a.homePriority;
      return (b.popularScore ?? 0) - (a.popularScore ?? 0);
    })
    .slice(0, limit);
}
