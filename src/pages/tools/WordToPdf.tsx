import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Download, FileWarning, Info, Loader2, RotateCcw } from 'lucide-react';
import FileDropzone from '../../components/tools/FileDropzone';
import { useUser } from '../../contexts/UserContext';
import {
  DEFAULT_DOCUMENT_MAX_SIZE,
  downloadBlob,
  formatFileSize,
  getFileStem,
  validateFile,
} from '../../lib/documentFiles';
import { convertWordToPdf } from '../../lib/converters/wordToPdf';

type ConversionStatus = 'idle' | 'ready' | 'converting' | 'success' | 'error';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function WordToPdf({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const isConverting = status === 'converting';
  const canConvert = Boolean(file) && !isConverting && !error;

  const resetResult = () => {
    setPdfBlob(null);
    setWarnings([]);
    setProgress(0);
  };

  const handleSelect = (nextFile: File) => {
    resetResult();
    const validation = validateFile(nextFile, {
      extensions: ['docx', 'doc'],
      maxSize: DEFAULT_DOCUMENT_MAX_SIZE,
      typeMessage: () =>
        t(
          '请选择 .docx 文件。旧版 .doc 暂不支持浏览器本地转换。',
          'Please choose a .docx file. Legacy .doc files are not supported by this local browser converter yet.',
        ),
      sizeMessage: (maxSizeLabel) =>
        t(
          `文件过大，请选择不超过 ${maxSizeLabel} 的 Word 文件。`,
          `The file is too large. Please choose a Word file under ${maxSizeLabel}.`,
        ),
    });

    if ('error' in validation) {
      setFile(null);
      setStatus('error');
      setError(validation.error);
      setMessage('');
      return;
    }

    if (validation.extension === 'doc') {
      setFile(nextFile);
      setStatus('error');
      setError(
        t(
          '当前浏览器本地转换暂不支持旧版 .doc，请在 Word 或 WPS 中另存为 .docx 后再上传。',
          'This local browser converter does not support legacy .doc yet. Please save it as .docx in Word or WPS and upload again.',
        ),
      );
      setMessage('');
      return;
    }

    setFile(nextFile);
    setStatus('ready');
    setError('');
    setMessage(t('文件已就绪，可以开始转换。', 'File is ready. You can start conversion.'));
  };

  const handleClear = () => {
    setFile(null);
    setStatus('idle');
    setMessage('');
    setError('');
    resetResult();
  };

  const handleConvert = async () => {
    if (!file) {
      setStatus('error');
      setError(t('请先选择一个 .docx 文件。', 'Please choose a .docx file first.'));
      return;
    }

    const validation = validateFile(file, {
      extensions: ['docx'],
      maxSize: DEFAULT_DOCUMENT_MAX_SIZE,
      typeMessage: () =>
        t(
          '请选择 .docx 文件。旧版 .doc 暂不支持浏览器本地转换。',
          'Please choose a .docx file. Legacy .doc files are not supported by this local browser converter yet.',
        ),
    });

    if ('error' in validation) {
      setStatus('error');
      setError(validation.error);
      return;
    }

    try {
      setStatus('converting');
      setError('');
      setMessage(t('正在准备转换，请保持页面打开。', 'Preparing conversion. Keep this page open.'));
      setProgress(8);
      setPdfBlob(null);
      setWarnings([]);

      const result = await convertWordToPdf(file, (nextMessage, nextProgress) => {
        setMessage(nextMessage);
        setProgress(nextProgress);
      });

      setPdfBlob(result.blob);
      setWarnings(result.warnings);
      setStatus('success');
      setMessage(
        t('转换完成，PDF 已准备好下载。', 'Conversion complete. Your PDF is ready to download.'),
      );
      setProgress(100);
    } catch (conversionError) {
      setStatus('error');
      setError(
        getErrorMessage(
          conversionError,
          t(
            '转换失败，请确认文件未损坏后重试。',
            'Conversion failed. Please make sure the file is not corrupted and try again.',
          ),
        ),
      );
      setMessage('');
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob || !file) return;
    downloadBlob(pdfBlob, `${getFileStem(file.name)}.pdf`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <button
        onClick={onBack}
        className="mb-6 flex min-h-[44px] items-center gap-2 text-sm font-semibold text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-5 w-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-surface-variant/30 bg-white p-6 shadow-lg dark:bg-surface-container-high"
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-on-surface">{t('Word 转 PDF', 'Word to PDF')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {t(
              '上传 .docx 文件，在浏览器本地生成 PDF。复杂排版可能与原文略有差异。',
              'Upload a .docx file and generate a PDF locally in your browser. Complex layouts may differ slightly.',
            )}
          </p>
        </div>

        <FileDropzone
          id="word-to-pdf-file"
          accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          file={file}
          title={t('拖拽 Word 文件到这里', 'Drop a Word file here')}
          description={t(
            `支持 .docx，最大 ${formatFileSize(DEFAULT_DOCUMENT_MAX_SIZE)}。文件仅在本地处理，不会上传服务器。`,
            `Supports .docx, up to ${formatFileSize(DEFAULT_DOCUMENT_MAX_SIZE)}. Files are processed locally only and are not uploaded.`,
          )}
          browseLabel={file ? t('重新选择', 'Choose again') : t('选择文件', 'Choose file')}
          selectedLabel={t('已选择文件', 'Selected file')}
          clearLabel={t('清空文件', 'Clear file')}
          disabled={isConverting}
          onSelect={handleSelect}
          onClear={handleClear}
        />

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!error && message && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary-container/50 bg-primary-container/25 p-3 text-sm leading-relaxed text-on-primary-container">
            {status === 'success' ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            )}
            <span>{message}</span>
          </div>
        )}

        {(isConverting || status === 'success') && (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>
            <p className="mt-2 text-right text-xs font-semibold text-secondary">{progress}%</p>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-4 rounded-xl bg-surface-container-low p-3 text-xs leading-relaxed text-secondary">
            {t('解析提示：', 'Parser notes:')} {warnings.slice(0, 3).join('；')}
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
          <button
            onClick={handleConvert}
            disabled={!canConvert}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-on-primary shadow-md transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConverting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isConverting ? t('转换中', 'Converting') : t('开始转换', 'Start conversion')}
          </button>
          <button
            onClick={handleDownload}
            disabled={!pdfBlob || isConverting}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-surface-container-high px-6 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {t('下载 PDF', 'Download PDF')}
          </button>
        </div>

        <button
          onClick={handleClear}
          disabled={isConverting}
          className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-surface-container-low px-4 text-sm font-semibold text-secondary transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          {t('清空并重新开始', 'Clear and restart')}
        </button>
      </motion.div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-surface-variant/30 bg-white/80 p-5 dark:bg-surface-container-high/70">
          <h3 className="font-bold text-on-surface">{t('本地处理', 'Local processing')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {t(
              '文件仅在本地处理，不会上传到服务器或第三方接口。',
              'Files are processed locally only and are not uploaded to a server or third-party API.',
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-surface-variant/30 bg-white/80 p-5 dark:bg-surface-container-high/70">
          <h3 className="font-bold text-on-surface">{t('转换限制', 'Conversion limits')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {t(
              '会尽量保留文本、标题、段落、表格和图片。页眉页脚、批注、复杂分栏或精确分页可能不同。',
              'Text, headings, paragraphs, tables, and images are preserved as much as possible. Headers, footers, comments, columns, and exact pagination may differ.',
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
