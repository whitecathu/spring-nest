import { describe, expect, it } from 'vitest';
import { parseText } from '../features/questionBankImporter/lib/parsers/parseText';

describe('马克思主义原理 question bank format', () => {
  it('parses single-choice questions with 【正确答案是】：X', () => {
    const text = [
      '一、单项选择题',
      '1、商品是(    )',
      'A.用于满足人们需要的劳动产品',
      'B.为市场交换而生产的有用的劳动产品',
      'C.一切物品',
      'D.一切有用的物品',
      '【正确答案是】：B',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'test.doc' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toBe('B');
    expect(result.questions[0].options).toEqual([
      'A. 用于满足人们需要的劳动产品',
      'B. 为市场交换而生产的有用的劳动产品',
      'C. 一切物品',
      'D. 一切有用的物品',
    ]);
    expect(result.questions[0].type).toBe('single');
  });

  it('parses multi-choice questions with 【正确答案是】：ABCD', () => {
    const text = [
      '一、多项选择题',
      '1、商品的二因素是(    )',
      'A.使用价值',
      'B.交换价值',
      'C.价值',
      'D.价格',
      '【正确答案是】：AC',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'test.doc' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toEqual(['A', 'C']);
    expect(result.questions[0].type).toBe('multiple');
  });

  it('parses judgment questions with 是/否 answers', () => {
    const text = [
      '二、判断题',
      '1、空想社会主义者只看到了资本主义必然灭亡的命运。',
      '【正确答案是】：是',
      '',
      '2、经济文化相对落后国家可以先于发达资本主义国家进入社会主义。',
      '【正确答案是】：否',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'test.doc' });
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].answer).toBe('是');
    expect(result.questions[0].type).toBe('judge');
    expect(result.questions[1].answer).toBe('否');
    expect(result.questions[1].type).toBe('judge');
  });

  it('handles 【正确答案是】 without colon', () => {
    const text = [
      '1、关于共产主义，下列表述正确的是（   ）',
      'A.共产主义是一种科学的理论',
      'B.共产主义是一种科学理论指导下的现实的运动',
      'C.共产主义是一种未来的社会制度和社会形态',
      'D.共产主义是历史发展的必然趋势',
      '【正确答案是】ABCD',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'test.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toEqual(['A', 'B', 'C', 'D']);
  });

  it('handles inline options on one line', () => {
    const text = [
      '一、多项选择题',
      '1、马克思主义关于无产阶级革命形式的基本观点（   ）A.暴力革命是无产阶级革命的唯一形式B.暴力革命是主要的基本形式C.在任何情况下都要争取和平发展原则D.无产阶级革命有暴力和和平两种形式',
      '【正确答案是】：BD',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'test.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toEqual(['B', 'D']);
    expect(result.questions[0].options).toHaveLength(4);
  });

  it('parses chapter headers as chapter field', () => {
    const text = [
      '第四章 资本主义的形成及其本质',
      '一、单项选择题',
      '1、商品是(    )',
      'A.用于满足人们需要的劳动产品',
      'B.为市场交换而生产的有用的劳动产品',
      'C.一切物品',
      'D.一切有用的物品',
      '【正确答案是】：B',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'test.doc' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].chapter).toBe('第四章 资本主义的形成及其本质');
  });

  it('skips goal section headers like 目标1（知识目标）', () => {
    const text = [
      '目标1（知识目标）67道题目',
      '',
      '一、单项选择题',
      '1、商品是(    )',
      'A.用于满足人们需要的劳动产品',
      'B.为市场交换而生产的有用的劳动产品',
      'C.一切物品',
      'D.一切有用的物品',
      '【正确答案是】：B',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'test.doc' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toBe('B');
  });

  it('handles answer on same line as option', () => {
    const text = [
      '2、社会主义社会的主要特征有（  ）',
      'A.剥削制度的消灭和在生产资料所有制上坚持以公有制为主体',
      'B.按劳分配',
      'C.大力发展社会主义市场经济',
      'D.坚持马克思主义指导、共产党的领导',
      '【正确答案是】：ABCD',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'test.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toEqual(['A', 'B', 'C', 'D']);
  });

  it('strips knowledge tag prefix from question', () => {
    const text = [
      '一、单项选择题',
      '11、【知识】资本的周转时间包括(    )',
      'A.劳动时间和产品的销售时间',
      'B.产品的购买时间和生产时间',
      'C.生产时间和流通时间',
      'D.劳动时间和购买时间',
      '【正确答案是】：C',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'test.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toBe('C');
  });

  it('handles inline answer on option line with 【正确答案是】', () => {
    const text = [
      '1、共产主义远大理想与中国特色社会主义共同理想的关系是（     ）',
      'A.从时间上看，二者是最终理想与阶段理想的关系',
      'B.从层次上看，二者是最高纲领与最低纲领的关系',
      'C.从范围上看，二者是全人类理想与全体中国人民理想的关系',
      'D.从哲学上看，二者是抽象和具体的关系',
      '【正确答案是】ABC',
    ].join('\n');

    const result = parseText(text, { sourceFile: 'test.docx' });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].answer).toEqual(['A', 'B', 'C']);
  });
});
