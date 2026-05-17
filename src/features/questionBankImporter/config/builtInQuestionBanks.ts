export interface BuiltInQuestionBank {
  id: string;
  title: string;
  fileName: string;
  assetPath: string;
  size: number;
  format: string;
  description: string;
}

export const builtInQuestionBanks: BuiltInQuestionBank[] = [
  {
    id: 'maogai-2024-revised',
    title: '2024 修订版毛概题库',
    fileName: '2024修订版毛概题库.rar',
    assetPath: 'built-in-question-banks/2024-revised-maogai-question-bank.rar',
    size: 205357,
    format: 'RAR',
    description:
      '随应用内置的毛概复习资料，包含导论及第一至第八章 Word 题库。点击后先在本地解析预览，确认后才写入题库。',
  },
];

export const defaultBuiltInQuestionBank = builtInQuestionBanks[0];
