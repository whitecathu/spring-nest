import {
  findMiniProgramToolBySlug,
  getMiniProgramHomeTools,
  miniProgramTabs,
  miniProgramToolCatalog,
  miniProgramToolCategories,
} from '../lib/miniProgram/toolCatalog';
import { tools } from '../data/tools';

describe('mini program tool catalog', () => {
  it('uses the approved three-tab information architecture', () => {
    expect(miniProgramTabs.map((tab) => tab.id)).toEqual(['home', 'tools', 'profile']);
    expect(miniProgramTabs.map((tab) => tab.text)).toEqual(['首页', '工具', '我的']);
    expect(miniProgramTabs.some((tab) => (tab.id as string) === 'review')).toBe(false);
  });

  it('contains all 29 tools and no games', () => {
    expect(miniProgramToolCatalog).toHaveLength(29);
    expect(miniProgramToolCatalog.every((tool) => tool.type === 'tool')).toBe(true);
    expect(miniProgramToolCatalog.every((tool) => !tool.route.startsWith('/games'))).toBe(true);
    expect(miniProgramToolCatalog.some((tool) => /游戏|game/i.test(tool.title))).toBe(false);
  });

  it('keeps review nest as a high-priority tool rather than a tab', () => {
    const reviewNest = findMiniProgramToolBySlug('question-bank-importer');
    expect(reviewNest?.id).toBe('tool-28');
    expect(reviewNest?.workbenchType).toBe('local-data');
    expect(reviewNest?.homePriority).toBe(98);
    expect(getMiniProgramHomeTools(6).map((tool) => tool.id)).toContain('tool-28');
  });

  it('maps every tool into a mini program category and workbench type', () => {
    const categorySlugs = new Set(miniProgramToolCategories.map((category) => category.slug));
    const allowedWorkbenchTypes = new Set([
      'quick-calc',
      'text-process',
      'device-file',
      'focus-timer',
      'local-data',
      'privacy',
    ]);

    for (const tool of miniProgramToolCatalog) {
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
