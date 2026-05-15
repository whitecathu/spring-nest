import type { ParseResult, QuestionBank } from '../../types/question';

export interface QuestionBankClient {
  parseFiles(files: File[]): Promise<ParseResult>;
  saveQuestionBank(bank: QuestionBank): Promise<void>;
  loadQuestionBank(): Promise<QuestionBank | null>;
  exportQuestionBank(bank: QuestionBank): Promise<Blob>;
}
