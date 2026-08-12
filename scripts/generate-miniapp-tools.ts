import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import {
  miniProgramHiddenSlugs,
  miniProgramOfflineSlugs,
  miniProgramTabs,
  miniProgramToolCatalog,
  miniProgramToolCategories,
} from '../src/lib/miniProgram/toolCatalog';

const outputPath = resolve('miniapp/data/tools.js');
const payload = {
  tabs: miniProgramTabs,
  categories: miniProgramToolCategories,
  offlineSlugs: [...miniProgramOfflineSlugs],
  hiddenSlugs: [...miniProgramHiddenSlugs],
  tools: miniProgramToolCatalog,
};

mkdirSync(dirname(outputPath), { recursive: true });
const prettierConfig = (await resolveConfig(outputPath)) || {};
const output = await format(`module.exports = ${JSON.stringify(payload, null, 2)};\n`, {
  ...prettierConfig,
  filepath: outputPath,
});
writeFileSync(outputPath, output, 'utf8');

console.log(`Generated ${miniProgramToolCatalog.length} mini program tools at ${outputPath}`);
