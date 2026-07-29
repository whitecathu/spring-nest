const helpers = require('./helpers');
const studyStorage = require('./storage');

function createSampleDeck() {
  var questions = [
    {
      id: 'sample-q-1',
      type: 'single',
      stem: '春日小筑的主色调最接近以下哪一项？',
      options: ['A. 森林绿', 'B. 电光紫', 'C. 霓虹粉', 'D. 纯黑'],
      answer: 'A',
      explanation: '产品视觉以温暖奶油底与森林绿强调色为主。',
    },
    {
      id: 'sample-q-2',
      type: 'multiple',
      stem: '学习小筑支持哪些题型？（多选）',
      options: ['A. 单选', 'B. 多选', 'C. 判断', 'D. 填空'],
      answer: 'ABC',
      explanation: 'P0 版本支持单选、多选与判断题。',
    },
    {
      id: 'sample-q-3',
      type: 'judge',
      stem: '错题本会在答错后自动收录题目。',
      options: ['是', '否'],
      answer: '是',
      explanation: '刷题或考试答错的题目会进入错题本，便于复盘。',
    },
    {
      id: 'sample-q-4',
      type: 'single',
      stem: '背题模式的主要特点是？',
      options: ['A. 直接展示正确答案', 'B. 限时交卷', 'C. 隐藏所有选项', 'D. 只统计错误率'],
      answer: 'A',
      explanation: '背题模式适合沉浸记忆，会直接点亮正确选项。',
    },
    {
      id: 'sample-q-5',
      type: 'single',
      stem: '导入题库时，TXT 题目之间通常如何分隔？',
      options: ['A. 空行', 'B. 逗号', 'C. 井号', 'D. 制表符'],
      answer: 'A',
      explanation: 'TXT 解析以空行分块，每块包含题干、选项与答案。',
    },
    {
      id: 'sample-q-6',
      type: 'judge',
      stem: '考试模式会从题集中随机抽题并倒计时。',
      options: ['是', '否'],
      answer: '是',
      explanation: '模拟考试支持设置题量与时长，并在交卷后统计成绩。',
    },
  ].map(function (q) {
    return helpers.normalizeQuestion(q, q.id);
  }).filter(Boolean);

  return {
    id: helpers.uid('deck-sample'),
    name: '示例题集 · 学习小筑入门',
    desc: '演示单选、多选与判断题的完整复习流程。',
    emoji: '🌿',
    color: '#2D6A4F',
    questions: questions,
    createdAt: Date.now(),
    lastReviewed: helpers.getDisplayReviewDate(),
  };
}

function seedSampleDeckIfEmpty() {
  var decks = studyStorage.getDecks();
  if (decks.length > 0) return decks[0];
  return studyStorage.addDeck(createSampleDeck());
}

function seedSampleDeck() {
  return studyStorage.addDeck(createSampleDeck());
}

module.exports = {
  createSampleDeck,
  seedSampleDeckIfEmpty,
  seedSampleDeck,
};
