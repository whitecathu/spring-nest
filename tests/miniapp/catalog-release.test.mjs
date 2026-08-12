// @vitest-environment jsdom

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const miniappRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../miniapp');
const appConfig = require('../../miniapp/app.json');
const generatedCatalog = require('../../miniapp/data/tools.js');
const catalog = require('../../miniapp/utils/catalog.js');

const REQUIRED_HIDDEN_SLUGS = ['word-to-pdf', 'pdf-to-word'];

function getUnavailableSlugs() {
  return [
    ...new Set([
      ...(generatedCatalog.offlineSlugs || []),
      ...(generatedCatalog.hiddenSlugs || []),
      ...REQUIRED_HIDDEN_SLUGS,
    ]),
  ];
}

describe('mini program catalog release contract', () => {
  it('keeps generated catalog output deterministic', () => {
    expect(generatedCatalog).not.toHaveProperty('generatedAt');
  });

  it('publishes an explicit hidden-tool list for unsupported document conversions', () => {
    expect(generatedCatalog.hiddenSlugs).toEqual(expect.any(Array));
    expect(generatedCatalog.hiddenSlugs).toEqual(expect.arrayContaining(REQUIRED_HIDDEN_SLUGS));
  });

  it('filters unavailable tools from getAllTools unless explicitly requested', () => {
    const unavailableSlugs = getUnavailableSlugs();
    const defaultSlugs = catalog.getAllTools().map((tool) => tool.slug);
    const allSlugs = catalog.getAllTools({ includeUnavailable: true }).map((tool) => tool.slug);

    expect(defaultSlugs).not.toEqual(expect.arrayContaining(unavailableSlugs));
    expect(allSlugs).toEqual(expect.arrayContaining(unavailableSlugs));
  });

  it('filters unavailable tools from findBySlug unless explicitly requested', () => {
    const unavailableSlugs = getUnavailableSlugs();

    expect(unavailableSlugs.map((slug) => catalog.findBySlug(slug))).toEqual(
      unavailableSlugs.map(() => null),
    );
    expect(
      unavailableSlugs.map(
        (slug) => catalog.findBySlug(slug, { includeUnavailable: true })?.slug ?? null,
      ),
    ).toEqual(unavailableSlugs);
  });

  it('filters unavailable tools from searchTools unless explicitly requested', () => {
    const unavailableSlugs = getUnavailableSlugs();
    const searchContainsSlug = (slug, options) =>
      catalog.searchTools(slug, options).some((tool) => tool.slug === slug);

    expect(unavailableSlugs.map((slug) => searchContainsSlug(slug))).toEqual(
      unavailableSlugs.map(() => false),
    );
    expect(
      unavailableSlugs.map((slug) => searchContainsSlug(slug, { includeUnavailable: true })),
    ).toEqual(unavailableSlugs.map(() => true));
  });

  it('does not package hidden document-conversion pages', () => {
    const packageTools = appConfig.subpackages.find(
      (subpackage) => subpackage.root === 'packageTools',
    );

    expect(packageTools).toBeDefined();
    expect(packageTools.pages).not.toContain('pages/word-to-pdf/index');
    expect(packageTools.pages).not.toContain('pages/pdf-to-word/index');
  });

  it('does not render an empty document-conversion section', () => {
    const efficiencyTemplate = fs.readFileSync(
      path.join(miniappRoot, 'pages/efficiency/index.wxml'),
      'utf8',
    );

    expect(efficiencyTemplate).toMatch(
      /<view class="section-gap" wx:if="\{\{docTools\.length\}\}">/,
    );
  });

  it('publishes mini-program-specific capability copy for every visible tool', () => {
    const unavailableSlugs = new Set(getUnavailableSlugs());
    const visibleTools = generatedCatalog.tools.filter((tool) => !unavailableSlugs.has(tool.slug));

    expect(visibleTools.length).toBeGreaterThan(0);
    for (const tool of visibleTools) {
      expect(tool, tool.slug).toMatchObject({
        capabilitySource: 'miniapp',
        description: expect.any(String),
        descriptionEn: expect.any(String),
        features: expect.any(Array),
        featuresEn: expect.any(Array),
      });
      expect(tool.description.trim().length, tool.slug).toBeGreaterThan(0);
      expect(tool.descriptionEn.trim().length, tool.slug).toBeGreaterThan(0);
      expect(tool.features.length, tool.slug).toBeGreaterThan(0);
      expect(tool.featuresEn.length, tool.slug).toBeGreaterThan(0);
    }
  });
});
