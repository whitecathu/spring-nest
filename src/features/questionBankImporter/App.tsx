import { useEffect } from 'react';
import { Download, Server, Trash2 } from 'lucide-react';
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
  const actions = useQuestionBankStore((state) => state.actions);

  function clearData() {
    if (window.confirm('确认清空本地题库、错题、收藏和复习记录？此操作不可撤销。')) {
      actions.clearBank();
    }
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
            localStorage 中。
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
            <Server className="mt-1 text-[var(--color-primary)]" size={20} aria-hidden="true" />
            <div>
              <h2 className="text-xl font-bold text-[var(--color-ink)]">后端解析预留</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                `backendQuestionBankClient` 已预留 parse、save、load、export 接口。当前 MVP 使用
                local adapter，不会把文件上传到服务器。
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
