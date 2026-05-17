import QuestionBankImporterApp from '../../features/questionBankImporter/App';
import '../../features/questionBankImporter/questionBankImporter.css';

interface QuestionBankImporterProps {
  onBack: () => void;
}

export default function QuestionBankImporter(_props: QuestionBankImporterProps) {
  return (
    <div className="question-bank-importer w-full overflow-hidden bg-[var(--color-bg)] sm:rounded-[1.5rem] sm:border sm:border-surface-variant/30">
      <QuestionBankImporterApp />
    </div>
  );
}
