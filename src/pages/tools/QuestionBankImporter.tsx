import QuestionBankImporterApp from '../../features/questionBankImporter/App';
import '../../features/questionBankImporter/questionBankImporter.css';

interface QuestionBankImporterProps {
  onBack: () => void;
}

export default function QuestionBankImporter(_props: QuestionBankImporterProps) {
  return (
    <div className="question-bank-importer rounded-[2rem] border border-surface-variant/30 bg-background/30">
      <QuestionBankImporterApp />
    </div>
  );
}
