import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { parseBillFile, importedRowToEntry, type ImportedRow, type BillFormat } from '../../../lib/bookkeepingImport';
import type { BookkeepingEntry } from '../../../lib/bookkeeping';

interface BillImporterProps {
  t: (zh: string, en: string) => string;
  onImport: (entries: BookkeepingEntry[]) => void;
  onClose: () => void;
}

export default function BillImporter({ t, onImport, onClose }: BillImporterProps) {
  const [format, setFormat] = useState<BillFormat>('unknown');
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    setLoading(true);
    try {
      const result = await parseBillFile(file);
      if (result.rows.length === 0) {
        // Read file content for debug hint
        let preview = '';
        let debugInfo = '';
        try {
          const buf = await file.arrayBuffer();
          let text = new TextDecoder('utf-8').decode(buf);
          if (text.includes('�')) text = new TextDecoder('gbk').decode(buf);
          const allLines = text.split('\n');
          // Find where CSV-like lines start (lines with many commas)
          const csvLineIdx = allLines.findIndex((l) => l.split(',').length >= 8);
          // Show lines around the CSV header area
          const start = Math.max(0, csvLineIdx - 2);
          const end = Math.min(allLines.length, csvLineIdx + 5);
          preview = allLines.slice(start, end).join('\n').slice(0, 500);
          debugInfo = `\n行数:${allLines.length} CSV头行:${csvLineIdx >= 0 ? csvLineIdx + 1 : '未找到'}`;
        } catch { /* ignore */ }

        const hintText = preview
          ? `\n\n${t('疑似表头区域', 'Header area')}:${debugInfo}\n${preview}`
          : debugInfo;
        setError(
          `${t(
            '无法解析此文件，请确认是微信或支付宝导出的 CSV 账单文件',
            'Could not parse. Please confirm it is a WeChat/Alipay CSV bill export.',
          )}${hintText}`,
        );
      } else {
        setFormat(result.format);
        setRows(result.rows);
      }
    } catch {
      setError(t('文件读取失败', 'Failed to read file'));
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    const now = Date.now();
    const entries = rows.map((row, i) => importedRowToEntry(row, now + i));
    onImport(entries);
    onClose();
  };

  const totalExpense = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const totalIncome = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
            {t('导入账单', 'Import Bill')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {rows.length === 0 ? (
            <>
              {/* Upload area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-colors"
              >
                <Upload className="w-10 h-10 text-neutral-400" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                  {t(
                    '点击或拖拽上传微信/支付宝 CSV 账单',
                    'Click or drag to upload WeChat/Alipay CSV bill',
                  )}
                </p>
                <p className="text-xs text-neutral-400">
                  {t('支持 .csv 格式，自动识别编码', 'Supports .csv, auto-detect encoding')}
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  {t('解析中...', 'Parsing...')}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap break-all">{error}</p>
                    <p className="text-xs text-red-400 mt-2">
                      {t(
                        '提示：请从微信/支付宝直接导出原始 CSV 文件，不要修改格式',
                        'Tip: Export the original CSV directly from WeChat/Alipay without modifying the format',
                      )}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Summary */}
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-neutral-600 dark:text-neutral-300">
                  {format === 'wechat' ? t('微信账单', 'WeChat Bill') : t('支付宝账单', 'Alipay Bill')}
                  {' · '}
                  {t(`共 ${rows.length} 笔`, `${rows.length} records`)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 text-center">
                  <div className="text-xs text-red-500">{t('支出', 'Expense')}</div>
                  <div className="text-lg font-bold text-red-600">¥{totalExpense.toFixed(2)}</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center">
                  <div className="text-xs text-emerald-500">{t('收入', 'Income')}</div>
                  <div className="text-lg font-bold text-emerald-600">¥{totalIncome.toFixed(2)}</div>
                </div>
              </div>

              {/* Preview */}
              <div className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                <table className="w-full text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-neutral-500 font-medium">{t('日期', 'Date')}</th>
                      <th className="px-3 py-2 text-left text-neutral-500 font-medium">{t('分类', 'Category')}</th>
                      <th className="px-3 py-2 text-right text-neutral-500 font-medium">{t('金额', 'Amount')}</th>
                      <th className="px-3 py-2 text-left text-neutral-500 font-medium">{t('备注', 'Note')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {rows.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                        <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">{row.date}</td>
                        <td className="px-3 py-2">
                          <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                            {row.category}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${row.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                          {row.type === 'income' ? '+' : '-'}{row.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-neutral-500 dark:text-neutral-400 max-w-[120px] truncate">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <div className="text-center text-xs text-neutral-400 py-2">
                    {t(`还有 ${rows.length - 50} 条记录...`, `and ${rows.length - 50} more...`)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {rows.length > 0 && (
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => { setRows([]); setFormat('unknown'); setError(''); }}
              className="px-4 py-2 text-sm rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              {t('重新选择', 'Reselect')}
            </button>
            <button
              onClick={handleImport}
              className="px-5 py-2 text-sm rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors font-medium"
            >
              <FileText className="w-4 h-4 inline mr-1.5" />
              {t(`导入 ${rows.length} 笔`, `Import ${rows.length}`)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
