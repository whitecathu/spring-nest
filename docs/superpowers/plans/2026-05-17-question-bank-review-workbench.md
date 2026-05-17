# Question Bank Review Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn 复习小筑 from an import-first utility into a practical review workbench that opens on reusable study actions without paid or daily check-in framing.

**Architecture:** Split the existing `review` view into a new `workbench` entry view and the existing `review` session view. Add lightweight review metadata and workbench summary helpers so UI copy can say “本次建议/快速复习” instead of “今日还差/打卡”. Keep all data local in the current Zustand store and localStorage-backed question bank.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, Tailwind CSS 4 utility classes, Zustand, lucide-react, Vitest, Testing Library, Playwright.

---

## Scope Check

This plan implements one subsystem: 复习小筑 product experience. It does not add payment, cloud sync, OCR, PDF parsing, Excel parsing, accounts, reminders, or content marketplace features.

## File Structure

- Modify `src/features/questionBankImporter/types/question.ts`: add optional review metadata fields for practical review feedback.
- Modify `src/features/questionBankImporter/lib/utils/normalize.ts`: initialize new metadata fields.
- Modify `src/features/questionBankImporter/lib/reviewQueues.ts`: add workbench summary helpers and keep existing queue behavior compatible.
- Modify `src/features/questionBankImporter/store/questionBankStore.ts`: add `workbench` view, default to it, add `recordRecall`, and send confirmed imports to the workbench.
- Modify `src/features/questionBankImporter/components/layout/ToolHeader.tsx`: make “复习” navigate to workbench and keep session view out of the top nav.
- Modify `src/features/questionBankImporter/App.tsx`: route `workbench` to the new workbench component and keep `review` as the session page.
- Create `src/features/questionBankImporter/components/dashboard/ReviewWorkbench.tsx`: practical first screen with continue, start, random, wrong, weak, favorite, and import actions.
- Modify `src/features/questionBankImporter/components/upload/UploadPanel.tsx`: remove dashboard duplication, reduce first-screen explanation, reorder import sections.
- Create `src/features/questionBankImporter/components/review/ReviewActionDock.tsx`: mobile-first sticky review action dock.
- Modify `src/features/questionBankImporter/components/review/ReviewSession.tsx`: use `recordRecall`, hide duplicate mobile in-card answer buttons, and use the new action dock.
- Modify `src/features/questionBankImporter/components/review/ReviewControls.tsx`: keep the existing desktop control row and let mobile controls come from `ReviewActionDock`.
- Modify `src/__tests__/reviewQueues.test.ts`: cover workbench summaries and non-check-in wording data.
- Modify `src/__tests__/questionBankStore.test.ts`: cover default view, import flow, and `recordRecall`.
- Create `src/__tests__/reviewWorkbench.test.tsx`: render empty and populated workbench states.
- Modify `e2e/app.spec.ts`: include the question bank route in mobile smoke coverage and add a targeted workbench route check.

---

### Task 1: Review Metadata And Queue Helpers

**Files:**
- Modify: `src/features/questionBankImporter/types/question.ts`
- Modify: `src/features/questionBankImporter/lib/utils/normalize.ts`
- Modify: `src/features/questionBankImporter/lib/reviewQueues.ts`
- Test: `src/__tests__/reviewQueues.test.ts`

- [ ] **Step 1: Write failing tests for workbench summary**

Add these imports to `src/__tests__/reviewQueues.test.ts`:

```ts
import { getReviewWorkbenchSummary } from '../features/questionBankImporter/lib/reviewQueues';
```

Add this test inside `describe('review queue helpers', () => { ... })`:

```ts
it('summarizes practical workbench queues without daily check-in pressure', () => {
  const questions = ['new', 'wrong', 'weak', 'favorite', 'stable'].map(makeQuestion);
  const reviewMeta = {
    wrong: makeMeta('wrong', {
      wrongCount: 2,
      lastAnsweredCorrect: false,
      lastReviewedAt: '2026-05-16T08:00:00.000Z',
      masteryLevel: 30,
    }),
    weak: makeMeta('weak', {
      lastAnsweredCorrect: true,
      lastReviewedAt: '2026-05-15T08:00:00.000Z',
      masteryLevel: 56,
    }),
    favorite: makeMeta('favorite', {
      favorite: true,
      lastAnsweredCorrect: true,
      lastReviewedAt: '2026-05-14T08:00:00.000Z',
      masteryLevel: 82,
    }),
    stable: makeMeta('stable', {
      lastAnsweredCorrect: true,
      lastReviewedAt: '2026-05-17T07:00:00.000Z',
      masteryLevel: 94,
    }),
  };

  const summary = getReviewWorkbenchSummary(questions, reviewMeta, plan, now);

  expect(summary.suggestedQuestions.map((question) => question.id)).toEqual([
    'new',
    'wrong',
    'weak',
  ]);
  expect(summary.quickReviewCount).toBe(3);
  expect(summary.averageMastery).toBe(52);
  expect(summary.unreviewedCount).toBe(1);
  expect(summary.favoriteQuestions.map((question) => question.id)).toEqual(['favorite']);
  expect(summary.actionLabel).toBe('本次建议 3 题');
});
```

- [ ] **Step 2: Run the focused failing test**

Run:

```bash
npm run test -- src/__tests__/reviewQueues.test.ts
```

Expected: FAIL with `getReviewWorkbenchSummary` not exported.

- [ ] **Step 3: Extend ReviewMeta types**

In `src/features/questionBankImporter/types/question.ts`, replace the `ReviewMeta` interface with:

```ts
export type ReviewRecallResult = 'remember' | 'vague' | 'forgot' | 'correct' | 'wrong';

export interface ReviewMeta {
  questionId: string;
  favorite: boolean;
  wrongCount: number;
  correctCount: number;
  lastReviewedAt?: string;
  lastWrongAt?: string;
  lastAnsweredCorrect?: boolean;
  masteryLevel: number;
  confidence?: 1 | 2 | 3 | 4 | 5;
  intervalDays?: number;
  dueAt?: string;
  lapses?: number;
  lastResult?: ReviewRecallResult;
}
```

- [ ] **Step 4: Initialize new metadata fields**

In `src/features/questionBankImporter/lib/utils/normalize.ts`, replace `createReviewMeta` with:

```ts
export function createReviewMeta(questionId: string): ReviewMeta {
  return {
    questionId,
    favorite: false,
    wrongCount: 0,
    correctCount: 0,
    masteryLevel: 0,
    confidence: 1,
    intervalDays: 0,
    lapses: 0,
  };
}
```

- [ ] **Step 5: Add workbench summary helper**

In `src/features/questionBankImporter/lib/reviewQueues.ts`, add this interface below `ReviewQueueSummary`:

```ts
export interface ReviewWorkbenchSummary extends ReviewQueueSummary {
  suggestedQuestions: Question[];
  favoriteQuestions: Question[];
  frequentWrongQuestions: Question[];
  averageMastery: number;
  unreviewedCount: number;
  quickReviewCount: number;
  actionLabel: string;
}
```

Add this function after `getReviewQueueSummary`:

```ts
export function getReviewWorkbenchSummary(
  questions: Question[],
  reviewMeta: Record<string, ReviewMeta>,
  reviewPlan: ReviewPlan,
  now = new Date(),
): ReviewWorkbenchSummary {
  const summary = getReviewQueueSummary(questions, reviewMeta, reviewPlan, now);
  const suggestedQuestions = summary.dueQuestions.length
    ? summary.dueQuestions
    : questions.slice(0, reviewPlan.dailyTarget || 30);
  const favoriteQuestions = questions.filter((question) => getMeta(question.id, reviewMeta).favorite);
  const frequentWrongQuestions = summary.wrongQuestions.filter(
    (question) => getMeta(question.id, reviewMeta).wrongCount >= 2,
  );
  const unreviewedCount = summary.newQuestions.length;
  const averageMastery = questions.length
    ? Math.round(
        questions.reduce(
          (total, question) => total + getMeta(question.id, reviewMeta).masteryLevel,
          0,
        ) / questions.length,
      )
    : 0;
  const quickReviewCount = Math.min(
    suggestedQuestions.length,
    Math.max(1, reviewPlan.dailyTarget || 30),
  );

  return {
    ...summary,
    suggestedQuestions,
    favoriteQuestions,
    frequentWrongQuestions,
    averageMastery,
    unreviewedCount,
    quickReviewCount,
    actionLabel: questions.length ? `本次建议 ${quickReviewCount} 题` : '先导入题库',
  };
}
```

- [ ] **Step 6: Run queue tests**

Run:

```bash
npm run test -- src/__tests__/reviewQueues.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/features/questionBankImporter/types/question.ts src/features/questionBankImporter/lib/utils/normalize.ts src/features/questionBankImporter/lib/reviewQueues.ts src/__tests__/reviewQueues.test.ts
git commit -m "feat: add review workbench summary helpers"
```

---

### Task 2: Store View Model And Recall Feedback

**Files:**
- Modify: `src/features/questionBankImporter/store/questionBankStore.ts`
- Test: `src/__tests__/questionBankStore.test.ts`

- [ ] **Step 1: Write failing store tests**

In `src/__tests__/questionBankStore.test.ts`, add this test after the `beforeEach` block:

```ts
it('opens the practical review workbench by default', () => {
  useQuestionBankStore.setState({
    activeView: 'workbench',
  });

  expect(useQuestionBankStore.getState().activeView).toBe('workbench');
});
```

Replace the expectation in `imports manually reviewed preview questions into the saved bank`:

```ts
expect(state.activeView).toBe('workbench');
```

Add this test after `records the latest wrong time when an answer is missed`:

```ts
it('records recall feedback for memorize mode without daily check-in language', () => {
  useQuestionBankStore.getState().actions.recordRecall('q1', 'vague');

  const state = useQuestionBankStore.getState();
  expect(state.reviewMeta.q1.lastResult).toBe('vague');
  expect(state.reviewMeta.q1.confidence).toBe(2);
  expect(state.reviewMeta.q1.intervalDays).toBe(1);
  expect(state.reviewMeta.q1.dueAt).toBeTruthy();
  expect(state.reviewMeta.q1.wrongCount).toBe(1);
  expect(state.reviewPlan.todayAnswered).toBe(1);
});
```

- [ ] **Step 2: Run focused failing store tests**

Run:

```bash
npm run test -- src/__tests__/questionBankStore.test.ts
```

Expected: FAIL because `workbench` and `recordRecall` are not defined.

- [ ] **Step 3: Import ReviewRecallResult**

In `src/features/questionBankImporter/store/questionBankStore.ts`, update the type import from `../types/question` to include:

```ts
  ReviewRecallResult,
```

- [ ] **Step 4: Add workbench view and action**

Change:

```ts
export type AppView = 'import' | 'bank' | 'review' | 'wrong' | 'settings';
```

to:

```ts
export type AppView = 'workbench' | 'import' | 'bank' | 'review' | 'wrong' | 'settings';
```

Add this action signature inside `actions`:

```ts
    recordRecall: (questionId: string, result: Exclude<ReviewRecallResult, 'correct' | 'wrong'>) => void;
```

Set initial `activeView` to:

```ts
  activeView: 'workbench',
```

In `clearBank`, set:

```ts
        activeView: 'workbench',
```

- [ ] **Step 5: Add recall scoring helpers**

Add these helpers below `scoreMastery`:

```ts
function addDays(date: Date, days: number): string {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function nextIntervalDays(meta: ReviewMeta, result: ReviewRecallResult): number {
  const current = Math.max(0, meta.intervalDays ?? 0);
  if (result === 'remember' || result === 'correct') return current <= 0 ? 2 : Math.min(30, current * 2);
  if (result === 'vague') return Math.max(1, Math.min(3, current || 1));
  return 1;
}

function nextConfidence(result: ReviewRecallResult): 1 | 2 | 3 | 4 | 5 {
  if (result === 'remember' || result === 'correct') return 4;
  if (result === 'vague') return 2;
  return 1;
}

function isPositiveRecall(result: ReviewRecallResult): boolean {
  return result === 'remember' || result === 'correct';
}

function applyRecallResult(
  meta: ReviewMeta,
  result: ReviewRecallResult,
  answeredAt: Date,
): ReviewMeta {
  const positive = isPositiveRecall(result);
  const intervalDays = nextIntervalDays(meta, result);
  return {
    ...meta,
    wrongCount: meta.wrongCount + (positive ? 0 : 1),
    correctCount: meta.correctCount + (positive ? 1 : 0),
    lastReviewedAt: answeredAt.toISOString(),
    lastWrongAt: positive ? meta.lastWrongAt : answeredAt.toISOString(),
    lastAnsweredCorrect: positive,
    masteryLevel: scoreMastery(meta, positive),
    confidence: nextConfidence(result),
    intervalDays,
    dueAt: addDays(answeredAt, intervalDays),
    lapses: (meta.lapses ?? 0) + (positive ? 0 : 1),
    lastResult: result,
  };
}
```

- [ ] **Step 6: Update `recordAnswer`**

Inside `recordAnswer`, replace the current metadata object for `[questionId]` with:

```ts
          [questionId]: applyRecallResult(current, correct ? 'correct' : 'wrong', new Date()),
```

Keep `const reviewPlan = advanceReviewPlan(state.reviewPlan);` unchanged.

- [ ] **Step 7: Add `recordRecall` action**

Add this action after `recordAnswer`:

```ts
    recordRecall(questionId, result) {
      set((state) => {
        const bank = ensureBank(state);
        const current = bank.reviewMeta[questionId] ?? createReviewMeta(questionId);
        const reviewMeta = {
          ...bank.reviewMeta,
          [questionId]: applyRecallResult(current, result, new Date()),
        };
        const reviewPlan = advanceReviewPlan(state.reviewPlan);
        return {
          ...updateBank(state, () => ({ ...bank, reviewMeta, reviewPlan })),
          reviewPlan,
        };
      });
    },
```

- [ ] **Step 8: Send successful imports to workbench**

In `importReviewedQuestions`, change:

```ts
          activeView: 'bank',
```

to:

```ts
          activeView: 'workbench',
```

In `importBackupJson`, change:

```ts
            activeView: 'bank',
```

to:

```ts
            activeView: 'workbench',
```

- [ ] **Step 9: Run store tests**

Run:

```bash
npm run test -- src/__tests__/questionBankStore.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

Run:

```bash
git add src/features/questionBankImporter/store/questionBankStore.ts src/__tests__/questionBankStore.test.ts
git commit -m "feat: add review workbench state"
```

---

### Task 3: Review Workbench Component

**Files:**
- Create: `src/features/questionBankImporter/components/dashboard/ReviewWorkbench.tsx`
- Create: `src/__tests__/reviewWorkbench.test.tsx`
- Modify: `src/features/questionBankImporter/App.tsx`
- Modify: `src/features/questionBankImporter/components/layout/ToolHeader.tsx`

- [ ] **Step 1: Write failing component tests**

Create `src/__tests__/reviewWorkbench.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReviewWorkbench } from '../features/questionBankImporter/components/dashboard/ReviewWorkbench';
import { defaultReviewPlan, useQuestionBankStore } from '../features/questionBankImporter/store/questionBankStore';
import type { Question, ReviewMeta } from '../features/questionBankImporter/types/question';

const question: Question = {
  id: 'q1',
  sourceFile: 'sample.txt',
  type: 'single',
  question: '题干',
  options: ['A. 对', 'B. 错'],
  answer: 'A',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const meta: ReviewMeta = {
  questionId: 'q1',
  favorite: true,
  wrongCount: 1,
  correctCount: 0,
  masteryLevel: 35,
  lastAnsweredCorrect: false,
};

describe('ReviewWorkbench', () => {
  beforeEach(() => {
    useQuestionBankStore.setState({
      currentBank: null,
      questions: [],
      reviewMeta: {},
      importedFiles: [],
      reviewPlan: defaultReviewPlan,
      lastReviewSession: undefined,
      currentReviewQuestionIds: [],
      currentReviewIndex: 0,
      activeView: 'workbench',
      toast: undefined,
    });
  });

  it('renders a short import path for an empty bank', () => {
    render(<ReviewWorkbench />);

    expect(screen.getByRole('heading', { name: '先放进题库，再开始复习' })).toBeVisible();
    expect(screen.getByRole('button', { name: /选择文件/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /粘贴题库/ })).toBeVisible();
    expect(screen.queryByText(/今日还差|连续复习|打卡|Pro|付费/)).toBeNull();
  });

  it('renders practical review actions for an existing bank', () => {
    useQuestionBankStore.setState({
      questions: [question],
      reviewMeta: { q1: meta },
      importedFiles: [
        {
          id: 'file-1',
          name: 'sample.txt',
          extension: 'txt',
          size: 128,
          status: 'success',
          message: '解析完成',
          questionCount: 1,
          warnings: [],
        },
      ],
      reviewPlan: { ...defaultReviewPlan, dailyTarget: 20 },
      activeView: 'workbench',
    });

    render(<ReviewWorkbench />);

    expect(screen.getByRole('heading', { name: '复习工作台' })).toBeVisible();
    expect(screen.getByRole('button', { name: /开始复习/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /快速抽查/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /错题重练/ })).toBeVisible();
    expect(screen.getByText('本次建议 1 题')).toBeVisible();
    expect(screen.queryByText(/今日还差|连续复习|打卡|Pro|付费/)).toBeNull();
  });
});
```

- [ ] **Step 2: Run failing component test**

Run:

```bash
npm run test -- src/__tests__/reviewWorkbench.test.tsx
```

Expected: FAIL because `ReviewWorkbench` does not exist.

- [ ] **Step 3: Create ReviewWorkbench component**

Create `src/features/questionBankImporter/components/dashboard/ReviewWorkbench.tsx`:

```tsx
import {
  AlertTriangle,
  BookOpen,
  Brain,
  Clock3,
  FileUp,
  History,
  ListChecks,
  Play,
  Shuffle,
  Star,
  Target,
} from 'lucide-react';
import { useMemo } from 'react';
import { getReviewWorkbenchSummary } from '../../lib/reviewQueues';
import { useQuestionBankStore } from '../../store/questionBankStore';
import { EmptyState } from '../common/EmptyState';
import { GlassCard } from '../common/GlassCard';
import { SoftButton } from '../common/SoftButton';

function idsOf<T extends { id: string }>(items: T[]) {
  return items.map((item) => item.id);
}

export function ReviewWorkbench() {
  const questions = useQuestionBankStore((state) => state.questions);
  const reviewMeta = useQuestionBankStore((state) => state.reviewMeta);
  const reviewPlan = useQuestionBankStore((state) => state.reviewPlan);
  const importedFiles = useQuestionBankStore((state) => state.importedFiles);
  const lastReviewSession = useQuestionBankStore((state) => state.lastReviewSession);
  const actions = useQuestionBankStore((state) => state.actions);
  const summary = useMemo(
    () => getReviewWorkbenchSummary(questions, reviewMeta, reviewPlan),
    [questions, reviewMeta, reviewPlan],
  );
  const canResume = Boolean(
    lastReviewSession?.questionIds.some((id) => questions.some((question) => question.id === id)),
  );
  const suggestedIds = idsOf(summary.suggestedQuestions);
  const weakIds = idsOf(summary.weakQuestions);
  const wrongIds = idsOf(summary.wrongQuestions);
  const favoriteIds = idsOf(summary.favoriteQuestions);
  const recentFiles = importedFiles.slice(0, 3);

  if (!questions.length) {
    return (
      <div className="space-y-5">
        <section className="rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[var(--color-card)] p-5 shadow-soft md:p-7">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[var(--color-primary)]">复习工作台</p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-[var(--color-ink)] md:text-4xl">
              先放进题库，再开始复习
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)] md:text-base">
              文件、粘贴文本和内置题库都会先在本地预览。确认无误后，再进入复习、抽查或错题整理。
            </p>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <SoftButton
              variant="primary"
              icon={<FileUp size={17} aria-hidden="true" />}
              onClick={() => actions.setActiveView('import')}
            >
              选择文件
            </SoftButton>
            <SoftButton
              icon={<BookOpen size={17} aria-hidden="true" />}
              onClick={() => actions.setActiveView('import')}
            >
              粘贴题库
            </SoftButton>
            <SoftButton
              icon={<Star size={17} aria-hidden="true" />}
              onClick={() => actions.setActiveView('import')}
            >
              预览内置题库
            </SoftButton>
          </div>
        </section>
        <EmptyState
          title="还没有本地题库"
          description="导入后会保存在当前浏览器中，可以随时继续复习。"
          actionLabel="去导入"
          onAction={() => actions.setActiveView('import')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[linear-gradient(135deg,rgb(255_255_255_/_0.9),rgb(230_244_236_/_0.84)_54%,rgb(255_246_226_/_0.7))] p-5 shadow-soft md:p-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-primary)]">复习工作台</p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-[var(--color-ink)] md:text-4xl">
              打开题库，直接开始
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)] md:text-base">
              按错题、薄弱题和未复习题给出本次建议。你也可以随机抽查或只背答案。
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <SoftButton
                variant="primary"
                icon={<Play size={17} aria-hidden="true" />}
                onClick={() => actions.startReview(suggestedIds, 'quiz')}
                disabled={!suggestedIds.length}
              >
                开始复习
              </SoftButton>
              <SoftButton
                icon={<History size={17} aria-hidden="true" />}
                onClick={actions.resumeReview}
                disabled={!canResume}
              >
                继续上次
              </SoftButton>
              <SoftButton
                icon={<Shuffle size={17} aria-hidden="true" />}
                onClick={actions.randomQuestion}
              >
                快速抽查
              </SoftButton>
              <SoftButton
                icon={<FileUp size={17} aria-hidden="true" />}
                onClick={() => actions.setActiveView('import')}
              >
                导入题库
              </SoftButton>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.1rem] bg-[var(--color-primary-soft)] p-4 text-[var(--color-primary)]">
              <ListChecks size={18} aria-hidden="true" />
              <p className="mt-3 text-2xl font-black">{summary.quickReviewCount}</p>
              <p className="text-xs font-semibold opacity-80">{summary.actionLabel}</p>
            </div>
            <div className="rounded-[1.1rem] bg-[color:rgb(255_255_255_/_0.65)] p-4 text-[var(--color-ink)]">
              <Clock3 size={18} aria-hidden="true" />
              <p className="mt-3 text-2xl font-black">{summary.estimatedMinutes}</p>
              <p className="text-xs font-semibold text-[var(--color-muted)]">预计分钟</p>
            </div>
            <div className="rounded-[1.1rem] bg-[var(--color-accent-yellow)] p-4 text-[var(--color-ink)]">
              <Brain size={18} aria-hidden="true" />
              <p className="mt-3 text-2xl font-black">{summary.averageMastery}</p>
              <p className="text-xs font-semibold text-[var(--color-muted)]">平均掌握</p>
            </div>
            <div className="rounded-[1.1rem] bg-[var(--color-error-soft)] p-4 text-[var(--color-error)]">
              <AlertTriangle size={18} aria-hidden="true" />
              <p className="mt-3 text-2xl font-black">{summary.wrongQuestions.length}</p>
              <p className="text-xs font-semibold opacity-80">错题</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <GlassCard>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">快速队列</p>
              <h2 className="mt-1 text-xl font-bold text-[var(--color-ink)]">按场景复习</h2>
            </div>
            <span className="rounded-full bg-[color:rgb(255_255_255_/_0.68)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
              {questions.length} 题
            </span>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <SoftButton
              variant="secondary"
              icon={<AlertTriangle size={17} aria-hidden="true" />}
              onClick={() => actions.startReview(wrongIds, 'quiz')}
              disabled={!wrongIds.length}
            >
              错题重练
            </SoftButton>
            <SoftButton
              variant="secondary"
              icon={<Target size={17} aria-hidden="true" />}
              onClick={() => actions.startReview(weakIds, 'memorize')}
              disabled={!weakIds.length}
            >
              薄弱题
            </SoftButton>
            <SoftButton
              variant="secondary"
              icon={<Star size={17} aria-hidden="true" />}
              onClick={() => actions.startReview(favoriteIds, 'quiz')}
              disabled={!favoriteIds.length}
            >
              收藏题
            </SoftButton>
            <SoftButton
              variant="secondary"
              icon={<Brain size={17} aria-hidden="true" />}
              onClick={() =>
                actions.startReview(
                  idsOf(summary.frequentWrongQuestions.length ? summary.frequentWrongQuestions : summary.weakQuestions),
                  'quiz',
                )
              }
              disabled={!summary.frequentWrongQuestions.length && !summary.weakQuestions.length}
            >
              考前速刷
            </SoftButton>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold text-[var(--color-primary)]">最近导入</p>
          <div className="mt-4 space-y-3">
            {recentFiles.length ? (
              recentFiles.map((file) => (
                <div key={file.id} className="rounded-2xl bg-[color:rgb(255_255_255_/_0.62)] p-3">
                  <p className="truncate text-sm font-bold text-[var(--color-ink)]">{file.name}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {file.questionCount} 题 · {file.status}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[var(--color-muted)]">
                还没有导入记录。导入成功后会显示在这里。
              </p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Route workbench in App**

In `src/features/questionBankImporter/App.tsx`, import:

```ts
import { ReviewWorkbench } from './components/dashboard/ReviewWorkbench';
```

In `ActiveView`, add this before the bank branch:

```tsx
  if (activeView === 'workbench') return <ReviewWorkbench />;
```

- [ ] **Step 5: Update top navigation**

In `src/features/questionBankImporter/components/layout/ToolHeader.tsx`, replace `navItems` with:

```ts
const navItems: Array<{ view: AppView; label: string; icon: typeof FileUp }> = [
  { view: 'workbench', label: '复习', icon: RotateCcw },
  { view: 'import', label: '导入', icon: FileUp },
  { view: 'bank', label: '题库', icon: BookOpen },
  { view: 'wrong', label: '错题', icon: TriangleAlert },
  { view: 'settings', label: '设置', icon: Settings },
];
```

Change the app name button `onClick` to:

```tsx
            onClick={() => onViewChange('workbench')}
```

- [ ] **Step 6: Remove old dashboard duplication from UploadPanel**

In `src/features/questionBankImporter/components/upload/UploadPanel.tsx`, remove:

```ts
import { StudyCommandCenter } from '../dashboard/StudyCommandCenter';
```

Remove this render line:

```tsx
      {questions.length ? <StudyCommandCenter /> : null}
```

Leave `src/features/questionBankImporter/components/dashboard/StudyCommandCenter.tsx` unchanged in this task. It is no longer imported after this step, but keeping the file avoids mixing component deletion into the workbench wiring commit.

- [ ] **Step 7: Run component tests**

Run:

```bash
npm run test -- src/__tests__/reviewWorkbench.test.tsx src/__tests__/questionBankStore.test.ts src/__tests__/reviewQueues.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/features/questionBankImporter/components/dashboard/ReviewWorkbench.tsx src/__tests__/reviewWorkbench.test.tsx src/features/questionBankImporter/App.tsx src/features/questionBankImporter/components/layout/ToolHeader.tsx src/features/questionBankImporter/components/upload/UploadPanel.tsx
git commit -m "feat: add review workbench screen"
```

---

### Task 4: Import Page Information Order

**Files:**
- Modify: `src/features/questionBankImporter/components/upload/UploadPanel.tsx`
- Modify: `src/features/questionBankImporter/components/upload/FileParseResult.tsx`

- [ ] **Step 1: Reorder import sections**

In `UploadPanel`, move the existing built-in bank `GlassCard` so the left column render order is exactly:

```tsx
<DragDropZone onFiles={(files) => void previewFiles(files)} disabled={isBusy} />
```

Then the existing paste text `GlassCard` whose heading is:

```tsx
<h3 className="font-bold text-[var(--color-ink)]">粘贴文本导入</h3>
```

Then the existing built-in bank `GlassCard` whose heading is:

```tsx
<h3 id="built-in-bank-title" className="font-bold text-[var(--color-ink)]">
  内置题库：{defaultBuiltInQuestionBank.title}
</h3>
```

Then keep these existing status/result renders in their current order:

```tsx
{isBusy ? <ParseProgress /> : null}
{storageError ? <ErrorState title="本地数据读取失败" message={storageError} /> : null}
{importedFiles.length ? (
  <FileParseResult
    files={importedFiles}
    questionCount={questions.length}
    onBank={() => actions.setActiveView('bank')}
    onReview={() => actions.startReview()}
    onImportMore={() => actions.setActiveView('import')}
    onExport={actions.exportJson}
  />
) : (
  <EmptyState
    title="还没有上传文件"
    description="拖拽自己的 txt、md、csv、json、zip、rar、doc、docx 题库文件，或点击上方按钮选择文件。"
    icon={<FileArchive size={22} aria-hidden="true" />}
  />
)}
```

Do not change `previewPastedText`, `previewFileInput`, `previewFiles`, `previewBuiltInQuestionBank`, or `importPreviewQuestions`.

- [ ] **Step 2: Shorten first-screen copy**

In the paste block, change the paragraph to:

```tsx
                  从文档、网页或聊天记录复制题目，先预览修正，再写入本地题库。
```

In the built-in bank block, change the description paragraph to:

```tsx
                    {defaultBuiltInQuestionBank.description}
```

Keep format support details in the right column and settings page.

- [ ] **Step 3: Verify post-import actions**

In `src/features/questionBankImporter/components/upload/FileParseResult.tsx`, keep these exact action labels:

```tsx
查看题库
开始复习
继续导入
```

The `开始复习` button must call `onReview`, and the `继续导入` button must call `onImportMore`:

```tsx
<SoftButton
  icon={<Play size={17} aria-hidden="true" />}
  onClick={onReview}
  disabled={!questionCount}
>
  开始复习
</SoftButton>
<SoftButton icon={<FilePlus2 size={17} aria-hidden="true" />} onClick={onImportMore}>
  继续导入
</SoftButton>
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/features/questionBankImporter/components/upload/UploadPanel.tsx src/features/questionBankImporter/components/upload/FileParseResult.tsx
git commit -m "refactor: simplify question bank import flow"
```

---

### Task 5: Mobile Review Action Dock

**Files:**
- Create: `src/features/questionBankImporter/components/review/ReviewActionDock.tsx`
- Modify: `src/features/questionBankImporter/components/review/ReviewSession.tsx`
- Modify: `src/features/questionBankImporter/components/review/ReviewControls.tsx`
- Test: `src/__tests__/questionBankStore.test.ts`

- [ ] **Step 1: Add a store test for remember feedback**

In `src/__tests__/questionBankStore.test.ts`, add this after the vague feedback test:

```ts
it('records remembered answers with longer review intervals', () => {
  useQuestionBankStore.getState().actions.recordRecall('q1', 'remember');

  const updated = useQuestionBankStore.getState().reviewMeta.q1;
  expect(updated.lastResult).toBe('remember');
  expect(updated.confidence).toBe(4);
  expect(updated.intervalDays).toBe(2);
  expect(updated.correctCount).toBe(3);
  expect(updated.lastAnsweredCorrect).toBe(true);
});
```

- [ ] **Step 2: Run store test**

Run:

```bash
npm run test -- src/__tests__/questionBankStore.test.ts
```

Expected: PASS.

- [ ] **Step 3: Create mobile action dock**

Create `src/features/questionBankImporter/components/review/ReviewActionDock.tsx`:

```tsx
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, Heart, Home, RotateCcw, TriangleAlert, X } from 'lucide-react';

interface DockButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  tone?: 'plain' | 'primary' | 'danger';
}

function DockButton({ label, icon, onClick, disabled, active, tone = 'plain' }: DockButtonProps) {
  const toneClass =
    tone === 'primary' || active
      ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
      : tone === 'danger'
        ? 'bg-[var(--color-error-soft)] text-[var(--color-error)]'
        : 'bg-[color:rgb(255_255_255_/_0.72)] text-[var(--color-ink)]';
  return (
    <button
      type="button"
      className={`inline-flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-[1rem] px-3 text-xs font-bold transition active:scale-[0.96] disabled:opacity-40 ${toneClass}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

interface ReviewActionDockProps {
  favorite: boolean;
  canPrevious: boolean;
  canNext: boolean;
  answerVisible: boolean;
  submitted: boolean;
  isMemorize: boolean;
  isAnalysis: boolean;
  isMultipleChoice: boolean;
  selectedCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
  onFavorite: () => void;
  onWrong: () => void;
  onRevealAnswer: () => void;
  onSubmitChoice: () => void;
  onForgot: () => void;
  onVague: () => void;
  onRemember: () => void;
}

export function ReviewActionDock({
  favorite,
  canPrevious,
  canNext,
  answerVisible,
  submitted,
  isMemorize,
  isAnalysis,
  isMultipleChoice,
  selectedCount,
  onPrevious,
  onNext,
  onExit,
  onFavorite,
  onWrong,
  onRevealAnswer,
  onSubmitChoice,
  onForgot,
  onVague,
  onRemember,
}: ReviewActionDockProps) {
  if (isAnalysis) {
    return (
      <div className="sticky bottom-2 z-20 grid grid-cols-[1fr_1fr_1.4fr] gap-2 rounded-[1.25rem] border border-[var(--color-outline-soft)] bg-[color:rgb(249_250_246_/_0.94)] p-2 shadow-soft backdrop-blur md:hidden">
        <DockButton label="上一题" icon={<ArrowLeft size={17} aria-hidden="true" />} onClick={onPrevious} disabled={!canPrevious} />
        <DockButton label="收藏" icon={<Heart size={17} aria-hidden="true" />} onClick={onFavorite} active={favorite} />
        <DockButton label={canNext ? '下一题' : '退出'} icon={canNext ? <ArrowRight size={17} aria-hidden="true" /> : <Home size={17} aria-hidden="true" />} onClick={canNext ? onNext : onExit} tone="primary" />
      </div>
    );
  }

  if (isMemorize || (!isMultipleChoice && answerVisible && !submitted)) {
    return (
      <div className="sticky bottom-2 z-20 grid grid-cols-3 gap-2 rounded-[1.25rem] border border-[var(--color-outline-soft)] bg-[color:rgb(249_250_246_/_0.94)] p-2 shadow-soft backdrop-blur md:hidden">
        <DockButton label="重来" icon={<RotateCcw size={17} aria-hidden="true" />} onClick={onForgot} disabled={!answerVisible || submitted} tone="danger" />
        <DockButton label="模糊" icon={<X size={17} aria-hidden="true" />} onClick={onVague} disabled={!answerVisible || submitted} />
        <DockButton label="掌握" icon={<Check size={17} aria-hidden="true" />} onClick={onRemember} disabled={!answerVisible || submitted} tone="primary" />
      </div>
    );
  }

  const primaryLabel = isMultipleChoice && !submitted ? '提交' : answerVisible || submitted ? '下一题' : '答案';
  const primaryAction = isMultipleChoice && !submitted ? onSubmitChoice : answerVisible || submitted ? (canNext ? onNext : onExit) : onRevealAnswer;
  const primaryDisabled = isMultipleChoice && !submitted ? selectedCount === 0 : false;

  return (
    <div className="sticky bottom-2 z-20 grid grid-cols-[1fr_1fr_1.4fr] gap-2 rounded-[1.25rem] border border-[var(--color-outline-soft)] bg-[color:rgb(249_250_246_/_0.94)] p-2 shadow-soft backdrop-blur md:hidden">
      <DockButton label="上一题" icon={<ArrowLeft size={17} aria-hidden="true" />} onClick={onPrevious} disabled={!canPrevious} />
      <DockButton label={favorite ? '已收藏' : '收藏'} icon={<Heart size={17} aria-hidden="true" />} onClick={onFavorite} active={favorite} />
      <DockButton label={primaryLabel} icon={primaryLabel === '答案' ? <Eye size={17} aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />} onClick={primaryAction} disabled={primaryDisabled} tone="primary" />
      {submitted ? (
        <DockButton label="错题" icon={<TriangleAlert size={17} aria-hidden="true" />} onClick={onWrong} tone="danger" />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Wire dock into ReviewSession**

In `src/features/questionBankImporter/components/review/ReviewSession.tsx`, import:

```ts
import { ReviewActionDock } from './ReviewActionDock';
```

Replace calls in memorize and short-answer result buttons:

```tsx
onClick={() => recordShortAnswer(false)}
```

with:

```tsx
onClick={() => recordShortAnswer('forgot')}
```

Replace the “模糊” button call:

```tsx
onClick={() => recordShortAnswer(false)}
```

with:

```tsx
onClick={() => recordShortAnswer('vague')}
```

Replace the “掌握” button call:

```tsx
onClick={() => recordShortAnswer(true)}
```

with:

```tsx
onClick={() => recordShortAnswer('remember')}
```

Change the function signature:

```ts
  function recordShortAnswer(result: 'remember' | 'vague' | 'forgot') {
```

Inside that function, set:

```ts
    const remembered = result === 'remember';
    setCorrect(remembered);
```

Update session stats with `remembered` and call:

```ts
    actions.recordRecall(question.id, result);
```

Add the dock above the `<p className="text-center...">` footer:

```tsx
      <ReviewActionDock
        favorite={meta.favorite}
        canPrevious={index > 0}
        canNext={index < total - 1}
        answerVisible={answerVisible}
        submitted={submitted}
        isMemorize={isMemorize}
        isAnalysis={isAnalysis}
        isMultipleChoice={question.type === 'multiple'}
        selectedCount={selected.length}
        onPrevious={actions.previousQuestion}
        onNext={actions.nextQuestion}
        onExit={() => actions.setActiveView('workbench')}
        onFavorite={() => actions.toggleFavorite(question.id)}
        onWrong={() => actions.markWrong(question.id)}
        onRevealAnswer={() => setAnswerVisible(true)}
        onSubmitChoice={submitChoice}
        onForgot={() => recordShortAnswer('forgot')}
        onVague={() => recordShortAnswer('vague')}
        onRemember={() => recordShortAnswer('remember')}
      />
```

- [ ] **Step 5: Make desktop controls exit to workbench**

In the existing `ReviewControls` usage, change:

```tsx
        onExit={() => actions.setActiveView('bank')}
```

to:

```tsx
        onExit={() => actions.setActiveView('workbench')}
```

- [ ] **Step 6: Run tests and typecheck**

Run:

```bash
npm run test -- src/__tests__/questionBankStore.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/features/questionBankImporter/components/review/ReviewActionDock.tsx src/features/questionBankImporter/components/review/ReviewSession.tsx src/features/questionBankImporter/components/review/ReviewControls.tsx src/__tests__/questionBankStore.test.ts
git commit -m "feat: improve mobile review actions"
```

---

### Task 6: E2E And Visual Verification

**Files:**
- Modify: `e2e/app.spec.ts`

- [ ] **Step 1: Add question bank route to mobile smoke list**

In `e2e/app.spec.ts`, find `const mobileRoutes = [` and add:

```ts
      '/tools/question-bank-importer',
```

- [ ] **Step 2: Add targeted workbench E2E test**

Add this test near the other tool smoke tests:

```ts
  test('复习小筑 opens on practical review workbench without check-in copy', async ({ page }) => {
    await page.goto('/tools/question-bank-importer');
    await expect(page.getByRole('heading', { name: /复习工作台|先放进题库/ })).toBeVisible();
    await expect(page.locator('main')).not.toContainText(/今日还差|连续复习|完成打卡|Pro|付费体验/);
    await expect(page.getByRole('button', { name: /选择文件|开始复习/ })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tools/question-bank-importer');
    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 2);
  });
```

- [ ] **Step 3: Run focused unit and e2e checks**

Run:

```bash
npm run test -- src/__tests__/reviewQueues.test.ts src/__tests__/questionBankStore.test.ts src/__tests__/reviewWorkbench.test.tsx
npm run typecheck
npx playwright test e2e/app.spec.ts --grep "复习小筑|mobile"
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS with Vite production output.

- [ ] **Step 5: Start or reuse local dev server**

Run this PowerShell check:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
```

When the command prints a listener, use `http://localhost:3000`. When it prints no listener, start:

```bash
npm run dev
```

Expected: dev server available at `http://localhost:3000`.

- [ ] **Step 6: Capture desktop screenshot**

Run:

```powershell
New-Item -ItemType Directory -Force -Path artifacts | Out-Null
@'
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://localhost:3000/tools/question-bank-importer', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'artifacts/question-bank-workbench-desktop.png', fullPage: true });
  await browser.close();
})();
'@ | node -
```

Expected: screenshot shows either the empty workbench import path or populated workbench, not only the startup splash.

- [ ] **Step 7: Capture mobile screenshot**

Run:

```powershell
New-Item -ItemType Directory -Force -Path artifacts | Out-Null
@'
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://localhost:3000/tools/question-bank-importer', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'artifacts/question-bank-workbench-mobile.png', fullPage: true });
  await browser.close();
})();
'@ | node -
```

Expected: screenshot has no horizontal overflow and shows the workbench heading plus the main action path.

- [ ] **Step 8: Remove screenshot artifacts after inspection**

Run:

```bash
Remove-Item -LiteralPath artifacts/question-bank-workbench-desktop.png,artifacts/question-bank-workbench-mobile.png -Force
```

Expected: `git status --short -- artifacts` prints no tracked or untracked screenshot files.

- [ ] **Step 9: Commit**

Run:

```bash
git add e2e/app.spec.ts
git commit -m "test: cover question bank workbench"
```

---

## Final Verification

- [ ] Run all relevant unit tests:

```bash
npm run test -- src/__tests__/reviewQueues.test.ts src/__tests__/questionBankStore.test.ts src/__tests__/reviewWorkbench.test.tsx
```

- [ ] Run full typecheck:

```bash
npm run typecheck
```

- [ ] Run production build:

```bash
npm run build
```

- [ ] Run targeted Playwright:

```bash
npx playwright test e2e/app.spec.ts --grep "复习小筑|mobile"
```

- [ ] Manually inspect `http://localhost:3000/tools/question-bank-importer` at desktop and 390px mobile widths.

## Self-Review

Spec coverage:

- Default “复习” workbench: Task 2 and Task 3.
- No paid or Pro scope: Task 3 tests and Task 6 E2E assert forbidden copy is absent.
- No daily check-in framing: Task 1, Task 3, and Task 6 avoid “今日还差/连续复习/打卡”.
- Mobile-first review actions: Task 5.
- Import page reduced explanation: Task 4.
- Local storage and no backend change: all tasks stay within existing local store and parser code.

Placeholder scan:

- The plan contains no placeholder sections, unnamed future steps, or undefined feature buckets.

Type consistency:

- `AppView` adds `workbench`; `ReviewWorkbench` and `ToolHeader` use `workbench`.
- `ReviewRecallResult` is defined in `types/question.ts`; `recordRecall` consumes `remember | vague | forgot`.
- `getReviewWorkbenchSummary` returns `ReviewWorkbenchSummary`; component tests use its public labels and counts.
