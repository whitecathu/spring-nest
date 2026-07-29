import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function ensure(p) {
  fs.mkdirSync(p, { recursive: true });
}

function write(rel, content) {
  const full = path.join(ROOT, rel);
  ensure(path.dirname(full));
  fs.writeFileSync(full, content, 'utf8');
  console.log(rel);
}

function page(dir, title, body) {
  write(
    `${dir}/index.js`,
    `Page({\n  data: { title: ${JSON.stringify(title)} }\n});\n`
  );
  write(
    `${dir}/index.json`,
    JSON.stringify({ navigationBarTitleText: title, usingComponents: {} }, null, 2) + '\n'
  );
  write(
    `${dir}/index.wxml`,
    `<view class="page-pad">
  <view class="glass-card card-pad">
    <view class="text-headline-sm text-primary">{{title}}</view>
    <view class="text-body-sm text-muted" style="margin-top:8px">${body}</view>
  </view>
</view>
`
  );
  write(`${dir}/index.wxss`, `.text-muted { color: var(--on-surface-variant); }\n`);
}

const study = [
  ['packageStudy/pages/home', '学习小筑', '学习小筑 loading — 将由另一 agent 填充。'],
  ['packageStudy/pages/import', '导入题库', '占位页面，稍后完善。'],
  ['packageStudy/pages/set-detail', '题集详情', '占位页面，稍后完善。'],
  ['packageStudy/pages/practice', '练习', '占位页面，稍后完善。'],
  ['packageStudy/pages/incorrect', '错题本', '占位页面，稍后完善。'],
  ['packageStudy/pages/favorites', '学习收藏', '占位页面，稍后完善。'],
  ['packageStudy/pages/stats', '学习统计', '占位页面，稍后完善。'],
];

const tools = [
  ['packageTools/pages/scanner', '扫描仪', '文档扫描占位，稍后接入原生能力。'],
  ['packageTools/pages/bookkeeping', '记账', '随手记账占位，稍后完善。'],
  ['packageTools/pages/word-to-pdf', 'Word 转 PDF', '文档转换占位。'],
  ['packageTools/pages/pdf-to-word', 'PDF 转 Word', '文档转换占位。'],
];

study.forEach(([d, t, b]) => page(d, t, b));
tools.forEach(([d, t, b]) => page(d, t, b));
console.log('stubs ok');
