import { tools } from '../../data/tools';
import type { AppItem } from '../../types/app';

export type MiniProgramTabId = 'discover' | 'development' | 'efficiency' | 'profile';

export type MiniProgramSectionId =
  | 'daily'
  | 'fun'
  | 'quick'
  | 'dev'
  | 'security'
  | 'time'
  | 'learning'
  | 'doc';

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

export interface MiniProgramTool extends Pick<
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
  tabId: Exclude<MiniProgramTabId, 'profile'>;
  section: MiniProgramSectionId;
  bg: string;
  workbenchType: MiniProgramWorkbenchType;
  homePriority: number;
  sensitive: boolean;
  /** 小程序端暂时下线 */
  offline?: boolean;
}

export const miniProgramTabs: MiniProgramTab[] = [
  { id: 'discover', text: '发现', textEn: 'Discover', pagePath: 'pages/discover/index' },
  { id: 'development', text: '开发', textEn: 'Development', pagePath: 'pages/development/index' },
  { id: 'efficiency', text: '效率', textEn: 'Efficiency', pagePath: 'pages/efficiency/index' },
  { id: 'profile', text: '我的', textEn: 'Me', pagePath: 'pages/profile/index' },
];

export const miniProgramToolCategories: MiniProgramToolCategory[] = [
  {
    slug: 'daily',
    title: '日常实用',
    titleEn: 'Daily',
    description: '计算、扫描、记账等随手工具',
  },
  { slug: 'fun', title: '趣味工具', titleEn: 'Fun', description: '抽签、颜色与随机数' },
  { slug: 'quick', title: '常用', titleEn: 'Quick', description: '发现页快捷入口' },
  { slug: 'dev', title: '开发辅助', titleEn: 'Dev', description: 'JSON、编码与文本处理' },
  { slug: 'security', title: '安全隐私', titleEn: 'Security', description: '密码与敏感内容处理' },
  { slug: 'time', title: '时间效率', titleEn: 'Time', description: '专注、倒计时、日期推算' },
  { slug: 'learning', title: '学习写作', titleEn: 'Learning', description: '题库、写作与文本处理' },
  { slug: 'doc', title: '文档转换', titleEn: 'Docs', description: '文档格式说明与辅助' },
];

/** 小程序端暂时下线（不展示、不可打开） */
export const miniProgramOfflineSlugs = ['weather', 'ip-lookup', 'text-to-speech'] as const;

/** Discover 常用入口（可与主 section 重叠，不计入 29 工具去重） */
export const miniProgramQuickSlugs = ['calculator', 'pomodoro', 'converter'] as const;

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

/** Primary IA placement: tab + section + card icon bg (from untitled App) */
const placementBySlug: Record<
  string,
  { tabId: Exclude<MiniProgramTabId, 'profile'>; section: MiniProgramSectionId; bg: string }
> = {
  calculator: {
    tabId: 'discover',
    section: 'daily',
    bg: 'bg-primary-fixed/40 text-primary',
  },
  scanner: {
    tabId: 'discover',
    section: 'daily',
    bg: 'bg-secondary-fixed/40 text-secondary',
  },
  weather: {
    tabId: 'discover',
    section: 'daily',
    bg: 'bg-tertiary-fixed/40 text-tertiary',
  },
  compass: {
    tabId: 'discover',
    section: 'daily',
    bg: 'bg-surface-variant/80 text-on-surface-variant',
  },
  converter: {
    tabId: 'discover',
    section: 'daily',
    bg: 'bg-primary text-on-primary',
  },
  qrcode: {
    tabId: 'discover',
    section: 'daily',
    bg: 'bg-secondary-container/40 text-secondary',
  },
  'tip-calculator': {
    tabId: 'discover',
    section: 'daily',
    bg: 'bg-tertiary-container/30 text-tertiary',
  },
  'bmi-calculator': {
    tabId: 'discover',
    section: 'daily',
    bg: 'bg-primary-container text-on-primary-container',
  },
  bookkeeping: {
    tabId: 'discover',
    section: 'daily',
    bg: 'bg-surface-variant text-on-surface-variant',
  },
  'random-picker': {
    tabId: 'discover',
    section: 'fun',
    bg: 'bg-secondary/20 text-secondary',
  },
  'color-converter': {
    tabId: 'discover',
    section: 'fun',
    bg: 'bg-primary/20 text-primary',
  },
  'random-number': {
    tabId: 'discover',
    section: 'fun',
    bg: 'bg-tertiary-fixed/30 text-tertiary',
  },
  'text-to-speech': {
    tabId: 'discover',
    section: 'fun',
    bg: 'bg-surface text-primary',
  },
  'json-formatter': {
    tabId: 'development',
    section: 'dev',
    bg: 'bg-[#566572] text-white',
  },
  'base64-codec': {
    tabId: 'development',
    section: 'dev',
    bg: 'bg-[#716a5c] text-white',
  },
  'url-codec': {
    tabId: 'development',
    section: 'dev',
    bg: 'bg-[#b8baa8] text-white',
  },
  'ip-lookup': {
    tabId: 'development',
    section: 'dev',
    bg: 'bg-[#7ba98f] text-white',
  },
  password: {
    tabId: 'development',
    section: 'security',
    bg: 'bg-[#c3cbb8] text-white',
  },
  pomodoro: {
    tabId: 'efficiency',
    section: 'time',
    bg: 'bg-tertiary-fixed/30 text-tertiary',
  },
  'timer-stopwatch': {
    tabId: 'efficiency',
    section: 'time',
    bg: 'bg-primary/20 text-primary',
  },
  'date-calculator': {
    tabId: 'efficiency',
    section: 'time',
    bg: 'bg-secondary-container text-secondary',
  },
  'question-bank-importer': {
    tabId: 'efficiency',
    section: 'learning',
    bg: 'bg-primary/20 text-primary',
  },
  'word-counter': {
    tabId: 'efficiency',
    section: 'learning',
    bg: 'bg-secondary-container/40 text-secondary',
  },
  'markdown-preview': {
    tabId: 'efficiency',
    section: 'learning',
    bg: 'bg-tertiary-container/30 text-tertiary',
  },
  'text-diff': {
    tabId: 'efficiency',
    section: 'learning',
    bg: 'bg-primary-container text-on-primary-container',
  },
  'lorem-generator': {
    tabId: 'efficiency',
    section: 'learning',
    bg: 'bg-surface-variant text-on-surface-variant',
  },
  'case-converter': {
    tabId: 'efficiency',
    section: 'learning',
    bg: 'bg-secondary/20 text-secondary',
  },
  'word-to-pdf': {
    tabId: 'efficiency',
    section: 'doc',
    bg: 'bg-surface text-primary',
  },
  'pdf-to-word': {
    tabId: 'efficiency',
    section: 'doc',
    bg: 'bg-surface text-primary',
  },
};

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

function getPlacement(slug: string) {
  const placement = placementBySlug[slug];
  if (!placement) {
    throw new Error(`Missing mini program tab/section/bg mapping for ${slug}`);
  }
  return placement;
}

function getCategoryTitle(slug: string) {
  return miniProgramToolCategories.find((category) => category.slug === slug)?.title ?? '工具';
}

/** Mini-program capability copy (honest vs full web feature set). */
const miniProgramCopyOverrides: Partial<
  Record<
    string,
    Pick<MiniProgramTool, 'description' | 'descriptionEn' | 'features' | 'featuresEn'>
  >
> = {
  'question-bank-importer': {
    description:
      '导入 txt、md、csv、json 题库，整理成可搜索、可复习的本地学习卡片（刷题 / 错题 / 收藏 / 统计）。',
    descriptionEn:
      'Import txt, md, csv, and json question banks into searchable local study cards with quiz, wrong-book, favorites, and stats.',
    features: ['TXT/MD/CSV/JSON 导入', '刷题与背答案', '错题本与收藏', '学习统计'],
    featuresEn: [
      'TXT/MD/CSV/JSON import',
      'Quiz and memorization',
      'Wrong-book and favorites',
      'Study stats',
    ],
  },
};

export const miniProgramToolCatalog: MiniProgramTool[] = tools.map((tool) => {
  const slug = getMiniSlug(tool);
  const placement = getPlacement(slug);
  const offline = (miniProgramOfflineSlugs as readonly string[]).includes(slug);
  const copy = miniProgramCopyOverrides[slug];
  return {
    id: tool.id,
    type: tool.type,
    title: tool.title,
    titleEn: tool.titleEn,
    description: copy?.description ?? tool.description,
    descriptionEn: copy?.descriptionEn ?? tool.descriptionEn,
    category: tool.category,
    categoryEn: tool.categoryEn,
    tags: tool.tags,
    icon: tool.icon,
    route: tool.route,
    features: copy?.features ?? tool.features,
    featuresEn: copy?.featuresEn ?? tool.featuresEn,
    popularScore: tool.popularScore,
    slug,
    miniCategorySlug: placement.section,
    miniCategoryTitle: getCategoryTitle(placement.section),
    tabId: placement.tabId,
    section: placement.section,
    bg: placement.bg,
    workbenchType: getWorkbenchType(tool),
    homePriority: offline ? 0 : (homePriorityByToolId[tool.id] ?? 0),
    sensitive: sensitiveToolIds.has(tool.id),
    offline,
  };
});

export function findMiniProgramToolBySlug(slug: string) {
  return miniProgramToolCatalog.find((tool) => tool.slug === slug);
}

export function getMiniProgramHomeTools(limit = 8) {
  return [...miniProgramToolCatalog]
    .filter((tool) => !tool.offline && tool.homePriority > 0)
    .sort((a, b) => {
      if (b.homePriority !== a.homePriority) return b.homePriority - a.homePriority;
      return (b.popularScore ?? 0) - (a.popularScore ?? 0);
    })
    .slice(0, limit);
}

function sortByHomePriority(toolsList: MiniProgramTool[]) {
  return [...toolsList].sort((a, b) => {
    if (b.homePriority !== a.homePriority) return b.homePriority - a.homePriority;
    return (b.popularScore ?? 0) - (a.popularScore ?? 0);
  });
}

export function getToolsByTab(tabId: MiniProgramTabId) {
  return sortByHomePriority(
    miniProgramToolCatalog.filter((tool) => tool.tabId === tabId && !tool.offline),
  );
}

export function getToolsBySection(section: MiniProgramSectionId | string) {
  if (section === 'quick') {
    return miniProgramQuickSlugs
      .map((slug) => findMiniProgramToolBySlug(slug))
      .filter((tool): tool is MiniProgramTool => Boolean(tool) && !tool.offline);
  }
  return sortByHomePriority(
    miniProgramToolCatalog.filter((tool) => tool.section === section && !tool.offline),
  );
}
