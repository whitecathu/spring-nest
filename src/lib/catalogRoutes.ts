export const toolCategoryRoutes = [
  { slug: 'daily', category: '日常实用', label: '日常实用', labelEn: 'Daily Tools' },
  { slug: 'time', category: '时间效率', label: '时间工具', labelEn: 'Time Tools' },
  { slug: 'dev', category: '开发辅助', label: '开发辅助', labelEn: 'Developer Tools' },
  { slug: 'study', category: '学习写作', label: '学习工具', labelEn: 'Study Tools' },
  { slug: 'text', category: '学习写作', label: '文本工具', labelEn: 'Text Tools' },
  { slug: 'document', category: '文档转换', label: '文档转换', labelEn: 'Document Tools' },
  { slug: 'security', category: '安全隐私', label: '安全隐私', labelEn: 'Security Tools' },
  { slug: 'random', category: '趣味工具', label: '随机工具', labelEn: 'Random Tools' },
];

export const gameCategoryRoutes = [
  { slug: 'puzzle', category: '益智解谜', label: '益智解谜', labelEn: 'Puzzle Games' },
  { slug: 'classic', category: '益智解谜', label: '经典游戏', labelEn: 'Classic Games' },
  { slug: 'casual', category: '反应挑战', label: '休闲小游戏', labelEn: 'Casual Games' },
  { slug: 'action', category: '反应挑战', label: '反应挑战', labelEn: 'Action Games' },
  { slug: 'educational', category: '学习练习', label: '学习练习', labelEn: 'Educational Games' },
];

export function getToolCategoryBySlug(slug?: string) {
  if (!slug) return undefined;
  return toolCategoryRoutes.find((route) => route.slug === slug);
}

export function getGameCategoryBySlug(slug?: string) {
  if (!slug) return undefined;
  return gameCategoryRoutes.find((route) => route.slug === slug);
}

export function getPrimaryToolCategorySlug(category: string): string | undefined {
  return toolCategoryRoutes.find((route) => route.category === category)?.slug;
}

export function getPrimaryGameCategorySlug(category: string): string | undefined {
  return gameCategoryRoutes.find((route) => route.category === category)?.slug;
}
