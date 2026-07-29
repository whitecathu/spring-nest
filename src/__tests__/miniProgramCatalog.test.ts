import {
  findMiniProgramToolBySlug,
  getMiniProgramHomeTools,
  getToolsBySection,
  getToolsByTab,
  miniProgramOfflineSlugs,
  miniProgramTabs,
  miniProgramToolCatalog,
  miniProgramToolCategories,
} from '../lib/miniProgram/toolCatalog';
import { tools } from '../data/tools';

describe('mini program tool catalog', () => {
  it('uses the approved four-tab information architecture', () => {
    expect(miniProgramTabs.map((tab) => tab.id)).toEqual([
      'discover',
      'development',
      'efficiency',
      'profile',
    ]);
    expect(miniProgramTabs.map((tab) => tab.text)).toEqual(['发现', '开发', '效率', '我的']);
    expect(miniProgramTabs.map((tab) => tab.pagePath)).toEqual([
      'pages/discover/index',
      'pages/development/index',
      'pages/efficiency/index',
      'pages/profile/index',
    ]);
    expect(miniProgramTabs.some((tab) => (tab.id as string) === 'review')).toBe(false);
  });

  it('contains all 29 tools and no games', () => {
    expect(miniProgramToolCatalog).toHaveLength(29);
    expect(miniProgramToolCatalog.every((tool) => tool.type === 'tool')).toBe(true);
    expect(miniProgramToolCatalog.every((tool) => !tool.route.startsWith('/games'))).toBe(true);
    expect(miniProgramToolCatalog.some((tool) => /游戏|game/i.test(tool.title))).toBe(false);
  });

  it('keeps review nest as a high-priority efficiency tool rather than a tab', () => {
    const reviewNest = findMiniProgramToolBySlug('question-bank-importer');
    expect(reviewNest?.id).toBe('tool-28');
    expect(reviewNest?.tabId).toBe('efficiency');
    expect(reviewNest?.section).toBe('learning');
    expect(reviewNest?.workbenchType).toBe('local-data');
    expect(reviewNest?.homePriority).toBe(98);
    expect(getMiniProgramHomeTools(6).map((tool) => tool.id)).toContain('tool-28');
  });

  it('maps every tool into a tab, section, bg, category and workbench type', () => {
    const categorySlugs = new Set(miniProgramToolCategories.map((category) => category.slug));
    const allowedWorkbenchTypes = new Set([
      'quick-calc',
      'text-process',
      'device-file',
      'focus-timer',
      'local-data',
      'privacy',
    ]);
    const allowedTabs = new Set(['discover', 'development', 'efficiency']);
    const allowedSections = new Set([
      'daily',
      'fun',
      'dev',
      'security',
      'time',
      'learning',
      'doc',
    ]);

    for (const tool of miniProgramToolCatalog) {
      expect(allowedTabs.has(tool.tabId)).toBe(true);
      expect(allowedSections.has(tool.section)).toBe(true);
      expect(tool.bg.length).toBeGreaterThan(0);
      expect(categorySlugs.has(tool.miniCategorySlug)).toBe(true);
      expect(allowedWorkbenchTypes.has(tool.workbenchType)).toBe(true);
      expect(tool.slug.length).toBeGreaterThan(0);
    }
  });

  it('has an explicit mini program entry for every source tool', () => {
    expect(miniProgramToolCatalog.map((tool) => tool.id)).toEqual(tools.map((tool) => tool.id));
    expect(new Set(miniProgramToolCatalog.map((tool) => tool.slug)).size).toBe(
      miniProgramToolCatalog.length,
    );
    expect(miniProgramToolCatalog.every((tool) => tool.workbenchType)).toBe(true);
    expect(miniProgramToolCatalog.every((tool) => tool.miniCategorySlug)).toBe(true);
    expect(miniProgramToolCatalog.every((tool) => tool.tabId && tool.section && tool.bg)).toBe(
      true,
    );
  });

  it('groups tools by tab and section helpers', () => {
    expect(getToolsByTab('discover').map((tool) => tool.slug).sort()).toEqual(
      [
        'bmi-calculator',
        'bookkeeping',
        'calculator',
        'color-converter',
        'compass',
        'converter',
        'qrcode',
        'random-number',
        'random-picker',
        'scanner',
        'tip-calculator',
      ].sort(),
    );
    expect(getToolsByTab('development').map((tool) => tool.slug).sort()).toEqual(
      ['base64-codec', 'json-formatter', 'password', 'url-codec'].sort(),
    );
    expect(getToolsByTab('profile')).toEqual([]);
    expect(getToolsBySection('quick').map((tool) => tool.slug)).toEqual([
      'calculator',
      'pomodoro',
      'converter',
    ]);
    expect(getToolsBySection('security').map((tool) => tool.slug)).toEqual(['password']);
    expect(getToolsBySection('learning')[0]?.slug).toBe('question-bank-importer');
  });

  it('prioritizes the tools expected on the mini program home screen', () => {
    expect(getMiniProgramHomeTools(5).map((tool) => tool.id)).toEqual([
      'tool-28',
      'tool-29',
      'tool-2',
      'tool-1',
      'tool-3',
    ]);
  });
});
