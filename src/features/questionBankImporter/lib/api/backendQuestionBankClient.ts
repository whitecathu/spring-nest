import type { ParseResult, QuestionBank } from '../../types/question';
import type { QuestionBankClient } from './questionBankClient';

export class BackendQuestionBankClient implements QuestionBankClient {
  private readonly baseUrl: string;

  constructor(baseUrl = '/api/question-bank') {
    this.baseUrl = baseUrl;
  }

  async parseFiles(): Promise<ParseResult> {
    throw new Error(`后端解析接口尚未接入：POST ${this.baseUrl}/parse`);
  }

  async saveQuestionBank(): Promise<void> {
    throw new Error(`后端保存接口尚未接入：PUT ${this.baseUrl}`);
  }

  async loadQuestionBank(): Promise<QuestionBank | null> {
    throw new Error(`后端读取接口尚未接入：GET ${this.baseUrl}`);
  }

  async exportQuestionBank(): Promise<Blob> {
    throw new Error(`后端导出接口尚未接入：GET ${this.baseUrl}/export`);
  }
}

export const backendQuestionBankClient = new BackendQuestionBankClient();
