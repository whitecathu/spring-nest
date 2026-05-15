import type { ParseResult, QuestionBank } from '../../types/question';
import { parseFiles } from '../parsers';
import { questionBankStorage } from '../storage/questionBankStorage';
import type { QuestionBankClient } from './questionBankClient';

export const localQuestionBankClient: QuestionBankClient = {
  parseFiles(files: File[]): Promise<ParseResult> {
    return parseFiles(files);
  },

  async saveQuestionBank(bank: QuestionBank): Promise<void> {
    questionBankStorage.save(bank);
  },

  async loadQuestionBank(): Promise<QuestionBank | null> {
    return questionBankStorage.load();
  },

  async exportQuestionBank(bank: QuestionBank): Promise<Blob> {
    return new Blob([JSON.stringify(bank, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
  },
};
