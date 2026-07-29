import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  miniProgramOfflineSlugs,
  miniProgramTabs,
  miniProgramToolCatalog,
  miniProgramToolCategories,
} from '../src/lib/miniProgram/toolCatalog';

const outputPath = resolve('miniapp/data/tools.js');
const payload = {
  generatedAt: new Date().toISOString(),
  tabs: miniProgramTabs,
  categories: miniProgramToolCategories,
  offlineSlugs: [...miniProgramOfflineSlugs],
  tools: miniProgramToolCatalog,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `module.exports = ${JSON.stringify(payload, null, 2)};\n`, 'utf8');

console.log(`Generated ${miniProgramToolCatalog.length} mini program tools at ${outputPath}`);
