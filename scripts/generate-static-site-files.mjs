import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['tsx', 'scripts/generate-site-assets.ts'],
  { stdio: 'inherit' },
);

process.exit(result.status ?? 1);
