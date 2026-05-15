import { useEffect, useState, type FormEvent } from 'react';
import { Clock, Download, Server, Target, Trash2 } from 'lucide-react';
import { routes } from './app/routes';
import { AppShell } from './components/layout/AppShell';
import { GlassCard } from './components/common/GlassCard';
import { SoftButton } from './components/common/SoftButton';
import { UploadPanel } from './components/upload/UploadPanel';
import { QuestionList } from './components/question/QuestionList';
import { ReviewSession } from './components/review/ReviewSession';
import { WrongBook } from './components/wrong-book/WrongBook';
import { appConfig } from './config/appConfig';
import { supportedFormats } from './config/supportedFormats';
import { useQuestionBankStore } from './store/questionBankStore';

function SettingsPanel() {
  const questions = useQuestionBankStore((state) => state.questions);
  const importedFiles = useQuestionBankStore((state) => state.importedFiles);
  const reviewPlan = useQuestionBankStore((state) => state.reviewPlan);
  const actions = useQuestionBankStore((state) => state.actions);
  const [dailyTarget, setDailyTarget] = useState(String(reviewPlan.dailyTarget));
  const [sessionMinutes, setSessionMinutes] = useState(String(reviewPlan.sessionMinutes));

  function clearData() {
    if (window.confirm('确认清空本地题库、错题、收藏和复习记录？此操作不可撤销。')) {
      actions.clearBank();
    }
  }

  function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    actions.updateReviewPlan({
      dailyTarget: Number(dailyTarget),
      sessionMinutes: Number(sessionMinutes),
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-[var(--color-primary)]">设置</p>
        <h1 className="mt-1 text-3xl font-bold text-[var(--color-ink)]">本地数据与后端接入</h1>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <h2 className="text-xl font-bold text-[var(--color-ink)]">本地题库</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            当前共有 {questions.length} 道题、{importedFiles.length} 份导入报告。数据保存在浏览器
            本地存储中，并在可用时使用 IndexedDB 作为大题库备份。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <SoftButton
              variant="primary"
              icon={<Download size={17} aria-hidden="true" />}
              onClick={actions.exportJson}
              disabled={!questions.length}
            >
              导出 JSON
            </SoftButton>
            <SoftButton
              variant="danger"
              icon={<Trash2 size={17} aria-hidden="true" />}
              onClick={clearData}
            >
              清空本地数据
            </SoftButton>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-start gap-3">
            <Target className="mt-1 text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-[var(--color-ink)]">今日复习计划</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                已完成 {reviewPlan.todayAnswered} / {reviewPlan.dailyTarget} 题，连续复习{' '}
                {reviewPlan.streakDays} 天。目标只保存在本地。
              </p>
              <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={savePlan}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                    每日题量
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={dailyTarget}
                    onChange={(event) => setDailyTarget(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                    计划分钟
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={sessionMinutes}
                    onChange={(event) => setSessionMinutes(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] px-3 text-sm"
                  />
                </label>
                <SoftButton
                  variant="primary"
                  type="submit"
                  icon={<Clock size={17} aria-hidden="true" />}
                >
                  保存计划
                </SoftButton>
              </form>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-start gap-3">
            <Server className="mt-1 text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <div>
              <h2 className="text-xl font-bold text-[var(--color-ink)]">高级格式说明</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                当前使用本地解析与本地保存，不会把文件上传到服务器。Excel、PDF、OCR 或 7Z
                不在浏览器端伪装支持，请先转为 CSV、JSON、TXT 或 DOCX，再导入复习。
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="text-xl font-bold text-[var(--color-ink)]">支持格式</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {supportedFormats.map((format) => (
            <div
              key={format.extension}
              className="rounded-2xl bg-[color:rgb(255_255_255_/_0.62)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-[var(--color-ink)]">{format.label}</span>
                <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {format.level}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {format.description}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function ActiveView() {
  const activeView = useQuestionBankStore((state) => state.activeView);

  if (activeView === 'bank') return <QuestionList />;
  if (activeView === 'review') return <ReviewSession />;
  if (activeView === 'wrong') return <WrongBook />;
  if (activeView === 'settings') return <SettingsPanel />;
  return <UploadPanel />;
}

export default function App() {
  const activeView = useQuestionBankStore((state) => state.activeView);
  const questions = useQuestionBankStore((state) => state.questions);
  const toast = useQuestionBankStore((state) => state.toast);
  const actions = useQuestionBankStore((state) => state.actions);

  useEffect(() => {
    actions.loadFromStorage();
  }, [actions]);

  useEffect(() => {
    if (
      window.location.pathname !== routes.questionBankImporter &&
      window.location.pathname !== '/'
    ) {
      window.history.replaceState(null, '', routes.questionBankImporter);
    }
  }, []);

  return (
    <AppShell
      activeView={activeView}
      onViewChange={actions.setActiveView}
      questionCount={questions.length}
      toast={toast}
      onDismissToast={actions.dismissToast}
    >
      <ActiveView />
      <footer className="mt-10 pb-6 text-center text-xs text-[var(--color-muted)]">
        {appConfig.description}
      </footer>
    </AppShell>
  );
}
