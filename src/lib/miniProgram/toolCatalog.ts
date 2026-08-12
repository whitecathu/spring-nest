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
  capabilitySource: 'miniapp' | 'web';
  /** 小程序端暂时下线 */
  offline?: boolean;
  /** 小程序端不发布、不展示且不可导航 */
  hidden?: boolean;
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

/** 小程序端不具备核心能力，因此不进入发布包 */
export const miniProgramHiddenSlugs = ['word-to-pdf', 'pdf-to-word'] as const;

/** Discover 常用入口（可与主 section 重叠，不计入 29 工具去重） */
export const miniProgramQuickSlugs = ['calculator', 'pomodoro', 'converter'] as const;

const miniProgramUnavailableSlugs = new Set<string>([
  ...miniProgramOfflineSlugs,
  ...miniProgramHiddenSlugs,
]);

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
  Record<string, Pick<MiniProgramTool, 'description' | 'descriptionEn' | 'features' | 'featuresEn'>>
> = {
  calculator: {
    description: '小程序内完成四则、百分比和小数运算，支持删除、清零与连续计算。',
    descriptionEn:
      'Run arithmetic, percentage, and decimal calculations in the mini program with delete, clear, and continued calculation.',
    features: ['四则与百分比', '小数输入', '删除与清零', '连续计算'],
    featuresEn: [
      'Arithmetic and percent',
      'Decimal input',
      'Delete and clear',
      'Continued calculation',
    ],
  },
  pomodoro: {
    description: '提供 25 分钟专注与 5 分钟休息计时，可开始、暂停、切换模式和重置。',
    descriptionEn:
      'Use 25-minute focus and 5-minute break timers with start, pause, mode switching, and reset controls.',
    features: ['25 分钟专注', '5 分钟休息', '开始与暂停', '模式切换与重置'],
    featuresEn: ['25-minute focus', '5-minute break', 'Start and pause', 'Mode switch and reset'],
  },
  converter: {
    description: '在小程序本地换算常用长度、重量与温度单位，手动选择来源和目标单位。',
    descriptionEn:
      'Convert common length, weight, and temperature units locally by choosing source and target units.',
    features: ['长度换算', '重量换算', '温度换算', '本地即时结果'],
    featuresEn: [
      'Length conversion',
      'Weight conversion',
      'Temperature conversion',
      'Local instant result',
    ],
  },
  password: {
    description: '使用微信安全随机源在本地生成 4–64 位密码，可组合大小写、数字和符号。',
    descriptionEn:
      'Generate 4–64 character passwords locally with WeChat secure randomness and selectable letter, digit, and symbol groups.',
    features: ['安全随机生成', '4–64 位长度', '字符集组合', '一键复制'],
    featuresEn: [
      'Secure random generation',
      '4–64 character length',
      'Character-set selection',
      'One-tap copy',
    ],
  },
  qrcode: {
    description: '将文本或链接在本地生成二维码，可复制原内容或保存 PNG 到相册。',
    descriptionEn:
      'Generate a QR code locally from text or a link, copy the source content, or save a PNG to the photo album.',
    features: ['文本与链接', '本地二维码矩阵', '复制原内容', '保存 PNG 到相册'],
    featuresEn: ['Text and links', 'Local QR matrix', 'Copy source content', 'Save PNG to album'],
  },
  compass: {
    description: '读取真机方向传感器并显示角度与方位，支持重新校准。',
    descriptionEn:
      'Read the device heading sensor to show degrees and direction, with manual recalibration.',
    features: ['真机方向读数', '角度显示', '方位提示', '重新校准'],
    featuresEn: ['Device heading', 'Degree display', 'Direction label', 'Recalibration'],
  },
  scanner: {
    description: '从相册选择或拍摄文档，应用原图、灰度或增强滤镜后保存到相册。',
    descriptionEn:
      'Choose or capture a document image, apply original, grayscale, or contrast enhancement, and save it to the album.',
    features: ['相册与相机选图', '灰度滤镜', '对比度增强', '保存到相册'],
    featuresEn: [
      'Album and camera input',
      'Grayscale filter',
      'Contrast enhancement',
      'Save to album',
    ],
  },
  'random-picker': {
    description: '输入每行一个候选项，在本地随机选出一个结果。',
    descriptionEn: 'Enter one candidate per line and pick one result locally at random.',
    features: ['多行候选输入', '忽略空行', '单次随机抽取', '本地处理'],
    featuresEn: [
      'Multiline candidates',
      'Ignore blank lines',
      'Single random pick',
      'Local processing',
    ],
  },
  'timer-stopwatch': {
    description: '在同一页面使用秒表和按秒设置的倒计时，均支持开始、暂停与重置。',
    descriptionEn:
      'Use a stopwatch and a seconds-based countdown on one page, each with start, pause, and reset.',
    features: ['秒表', '秒级倒计时', '开始与暂停', '独立重置'],
    featuresEn: ['Stopwatch', 'Seconds countdown', 'Start and pause', 'Independent reset'],
  },
  'word-counter': {
    description: '本地统计文本字符、非空格字符、词数、行数、段落和汉字数量。',
    descriptionEn:
      'Count characters, non-space characters, words, lines, paragraphs, and Chinese characters locally.',
    features: ['字符与非空格字符', '词数与行数', '段落统计', '汉字统计'],
    featuresEn: [
      'Character counts',
      'Words and lines',
      'Paragraph count',
      'Chinese character count',
    ],
  },
  'markdown-preview': {
    description: '在小程序内预览轻量 Markdown，支持标题、粗体、斜体、行内代码和链接。',
    descriptionEn:
      'Preview lightweight Markdown in the mini program with headings, bold, italic, inline code, and links.',
    features: ['标题', '粗体与斜体', '行内代码', '链接预览'],
    featuresEn: ['Headings', 'Bold and italic', 'Inline code', 'Link preview'],
  },
  'json-formatter': {
    description: '在本地解析并缩进 JSON，输入无效时直接显示错误信息。',
    descriptionEn: 'Parse and indent JSON locally, with a clear error when the input is invalid.',
    features: ['JSON 语法校验', '两空格格式化', '错误提示', '复制结果'],
    featuresEn: ['JSON validation', 'Two-space formatting', 'Error feedback', 'Copy result'],
  },
  'base64-codec': {
    description: '在本地对 UTF-8 文本进行 Base64 编码或解码。',
    descriptionEn: 'Encode or decode UTF-8 text as Base64 locally.',
    features: ['UTF-8 文本', 'Base64 编码', 'Base64 解码', '本地处理'],
    featuresEn: ['UTF-8 text', 'Base64 encode', 'Base64 decode', 'Local processing'],
  },
  'url-codec': {
    description: '在本地对 URL 组件或文本进行百分号编码与解码。',
    descriptionEn: 'Percent-encode or decode URL components and text locally.',
    features: ['URL 组件编码', 'URL 组件解码', '错误提示', '本地处理'],
    featuresEn: [
      'URL component encode',
      'URL component decode',
      'Error feedback',
      'Local processing',
    ],
  },
  'color-converter': {
    description: '在 HEX 与 RGB 之间双向转换，并同步显示颜色预览。',
    descriptionEn:
      'Convert between HEX and RGB in both directions with a synchronized color preview.',
    features: ['HEX 转 RGB', 'RGB 转 HEX', '颜色预览', '输入校验'],
    featuresEn: ['HEX to RGB', 'RGB to HEX', 'Color preview', 'Input validation'],
  },
  'date-calculator': {
    description: '选择两个本地日期，计算它们之间相差的天数与小时数。',
    descriptionEn: 'Choose two local dates and calculate the difference in days and hours.',
    features: ['日期选择', '天数差', '小时差', '本地计算'],
    featuresEn: ['Date pickers', 'Day difference', 'Hour difference', 'Local calculation'],
  },
  'text-diff': {
    description: '按行比较两段文本，并标记保留、删除与新增内容。',
    descriptionEn: 'Compare two texts line by line and mark unchanged, removed, and added content.',
    features: ['逐行比较', '新增标记', '删除标记', '结果行统计'],
    featuresEn: ['Line comparison', 'Added markers', 'Removed markers', 'Result line count'],
  },
  'lorem-generator': {
    description: '在本地生成 1–8 段中英文示例占位文本，并支持复制结果。',
    descriptionEn:
      'Generate 1–8 paragraphs of bundled Chinese and English placeholder text locally and copy the result.',
    features: ['1–8 段', '中英文示例文本', '本地生成', '复制结果'],
    featuresEn: [
      '1–8 paragraphs',
      'Chinese and English samples',
      'Local generation',
      'Copy result',
    ],
  },
  'tip-calculator': {
    description: '输入账单、小费比例和人数，计算小费、总计与人均金额。',
    descriptionEn:
      'Enter a bill, tip percentage, and party size to calculate tip, total, and per-person amounts.',
    features: ['自定义小费比例', '多人均摊', '总额计算', '人均结果'],
    featuresEn: ['Custom tip rate', 'Party split', 'Total calculation', 'Per-person result'],
  },
  'case-converter': {
    description: '将输入文本转换为大写、小写、标题格式或大小写互换。',
    descriptionEn: 'Convert text to uppercase, lowercase, title case, or toggled letter case.',
    features: ['大写', '小写', '标题格式', '大小写互换'],
    featuresEn: ['Uppercase', 'Lowercase', 'Title case', 'Toggle case'],
  },
  'random-number': {
    description: '输入整数上下限，在包含端点的范围内随机生成一个整数。',
    descriptionEn: 'Enter integer bounds and generate one random integer from the inclusive range.',
    features: ['自定义上下限', '端点包含', '单个整数结果', '范围校验'],
    featuresEn: ['Custom bounds', 'Inclusive range', 'Single integer result', 'Range validation'],
  },
  'bmi-calculator': {
    description: '输入身高与体重，在本地计算 BMI 数值及参考分类。',
    descriptionEn: 'Enter height and weight to calculate BMI and its reference category locally.',
    features: ['厘米身高', '千克体重', 'BMI 数值', '参考分类'],
    featuresEn: ['Height in centimeters', 'Weight in kilograms', 'BMI value', 'Reference category'],
  },
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
  bookkeeping: {
    description: '在本地记录收入与支出，按月份搜索、汇总和查看分类，并可导出 CSV 备份。',
    descriptionEn:
      'Record income and expenses locally, search and summarize by month and category, and export a CSV backup.',
    features: ['收支记录', '月份与关键词筛选', '分类汇总', 'CSV 备份'],
    featuresEn: [
      'Income and expense entries',
      'Month and keyword filters',
      'Category summary',
      'CSV backup',
    ],
  },
};

export const miniProgramToolCatalog: MiniProgramTool[] = tools.map((tool) => {
  const slug = getMiniSlug(tool);
  const placement = getPlacement(slug);
  const offline = (miniProgramOfflineSlugs as readonly string[]).includes(slug);
  const hidden = (miniProgramHiddenSlugs as readonly string[]).includes(slug);
  const unavailable = offline || hidden;
  const copy = miniProgramCopyOverrides[slug];
  if (!unavailable && !copy) {
    throw new Error(`Missing mini program capability copy for ${slug}`);
  }
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
    homePriority: unavailable ? 0 : (homePriorityByToolId[tool.id] ?? 0),
    sensitive: sensitiveToolIds.has(tool.id),
    capabilitySource: copy ? 'miniapp' : 'web',
    offline,
    hidden,
  };
});

export function findMiniProgramToolBySlug(slug: string) {
  return miniProgramToolCatalog.find((tool) => tool.slug === slug);
}

export function getMiniProgramHomeTools(limit = 8) {
  return [...miniProgramToolCatalog]
    .filter((tool) => !miniProgramUnavailableSlugs.has(tool.slug) && tool.homePriority > 0)
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
    miniProgramToolCatalog.filter(
      (tool) => tool.tabId === tabId && !miniProgramUnavailableSlugs.has(tool.slug),
    ),
  );
}

export function getToolsBySection(section: MiniProgramSectionId | string) {
  if (section === 'quick') {
    return miniProgramQuickSlugs
      .map((slug) => findMiniProgramToolBySlug(slug))
      .filter(
        (tool): tool is MiniProgramTool =>
          Boolean(tool) && !miniProgramUnavailableSlugs.has(tool.slug),
      );
  }
  return sortByHomePriority(
    miniProgramToolCatalog.filter(
      (tool) => tool.section === section && !miniProgramUnavailableSlugs.has(tool.slug),
    ),
  );
}
