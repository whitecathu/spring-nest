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
import { convertPdfToWord, type PdfToWordResult } from '../../lib/converters/pdfToWord';

type ConversionStatus = 'idle' | 'ready' | 'converting' | 'success' | 'error';

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function PdfToWord({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PdfToWordResult | null>(null);

  const isConverting = status === 'converting';
  const canConvert = Boolean(file) && !isConverting && !error;

  const resetResult = () => {
    setResult(null);
    setProgress(0);
  };

  const handleSelect = (nextFile: File) => {
    resetResult();
    const validation = validateFile(nextFile, {
      extensions: ['pdf'],
      maxSize: DEFAULT_DOCUMENT_MAX_SIZE,
      typeMessage: () => t('请选择 .pdf 文件。', 'Please choose a .pdf file.'),
      sizeMessage: (maxSizeLabel) =>
        t(
          `文件过大，请选择不超过 ${maxSizeLabel} 的 PDF 文件。`,
          `The file is too large. Please choose a PDF file under ${maxSizeLabel}.`,
        ),
    });

    if ('error' in validation) {
      setFile(null);
      setStatus('error');
      setError(validation.error);
      setMessage('');
      return;
    }

    setFile(nextFile);
    setStatus('ready');
    setError('');
    setMessage(
      t('文件已就绪，可以开始提取文本。', 'File is ready. You can start extracting text.'),
    );
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
      setError(t('请先选择一个 PDF 文件。', 'Please choose a PDF file first.'));
      return;
    }

    const validation = validateFile(file, {
      extensions: ['pdf'],
      maxSize: DEFAULT_DOCUMENT_MAX_SIZE,
    });

    if ('error' in validation) {
      setStatus('error');
      setError(validation.error);
      return;
    }

    try {
      setStatus('converting');
      setError('');
      setMessage(
        t('正在准备提取文本，请保持页面打开。', 'Preparing text extraction. Keep this page open.'),
      );
      setProgress(8);
      setResult(null);

      const conversionResult = await convertPdfToWord(file, (nextMessage, nextProgress) => {
        setMessage(nextMessage);
        setProgress(Math.round(nextProgress));
      });

      setResult(conversionResult);
      setStatus('success');
      setMessage(
        t(
          `转换完成，共处理 ${conversionResult.pageCount} 页，提取 ${conversionResult.textLength} 个字符。`,
          `Conversion complete. Processed ${conversionResult.pageCount} pages and extracted ${conversionResult.textLength} characters.`,
        ),
      );
      setProgress(100);
    } catch (conversionError) {
      setStatus('error');
      setError(
        getErrorMessage(
          conversionError,
          t(
            '转换失败，请确认 PDF 未加密且包含可复制文本。',
            'Conversion failed. Please make sure the PDF is not encrypted and contains selectable text.',
          ),
        ),
      );
      setMessage('');
      setProgress(0);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, `${getFileStem(file.name)}-text.docx`);
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
          <h2 className="text-2xl font-bold text-on-surface">{t('PDF 转 Word', 'PDF to Word')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {t(
              '上传文本型 PDF，在浏览器本地提取文字并生成 .docx。复杂版式可能无法完全还原。',
              'Upload a text-based PDF, extract text locally, and generate a .docx file. Complex layouts may not be fully restored.',
            )}
          </p>
        </div>

        <FileDropzone
          id="pdf-to-word-file"
          accept=".pdf,application/pdf"
          file={file}
          title={t('拖拽 PDF 文件到这里', 'Drop a PDF file here')}
          description={t(
            `支持文本型 PDF，最大 ${formatFileSize(DEFAULT_DOCUMENT_MAX_SIZE)}。文件仅在本地处理，不会上传服务器。`,
            `Supports text-based PDFs, up to ${formatFileSize(DEFAULT_DOCUMENT_MAX_SIZE)}. Files are processed locally only and are not uploaded.`,
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

        {result && (
          <div className="mt-4 grid gap-3 rounded-2xl bg-surface-container-low p-4 text-sm text-secondary sm:grid-cols-3">
            <div>
              <p className="font-bold text-on-surface">{result.pageCount}</p>
              <p>{t('页已处理', 'pages processed')}</p>
            </div>
            <div>
              <p className="font-bold text-on-surface">{result.textLength}</p>
              <p>{t('字符已提取', 'characters extracted')}</p>
            </div>
            <div>
              <p className="font-bold text-on-surface">{result.emptyPageCount}</p>
              <p>{t('空文本页', 'empty text pages')}</p>
            </div>
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
            disabled={!result || isConverting}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-surface-container-high px-6 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {t('下载 Word', 'Download Word')}
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
              'PDF 转 Word 为文本提取型转换。扫描件暂不支持 OCR，表格、分栏和复杂版式可能无法还原。',
              'PDF to Word is text extraction conversion. Scanned files need OCR, and tables, columns, and complex layouts may not be restored.',
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
