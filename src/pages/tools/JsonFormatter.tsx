import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Check, Trash2, ArrowDownUp, Minimize2, Maximize2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

function getFriendlyError(err: unknown, input: string): string {
  if (err instanceof SyntaxError) {
    const msg = err.message;
    // Try to extract position from error message
    const posMatch = msg.match(/position\s+(\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      const lines = input.substring(0, pos).split('\n');
      const line = lines.length;
      const col = lines[lines.length - 1].length + 1;
      return `JSON 格式错误：第 ${line} 行，第 ${col} 列`;
    }
    // Fallback: try line info from Chrome-style messages
    const lineMatch = msg.match(/line\s+(\d+)/i);
    if (lineMatch) {
      return `JSON 格式错误：第 ${lineMatch[1]} 行`;
    }
    return `JSON 格式错误：${msg}`;
  }
  return '未知错误';
}

export default function JsonFormatter({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setError('');
      setOutput('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (err) {
      setError(getFriendlyError(err, input));
      setOutput('');
    }
  }, [input]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      setError('');
      setOutput('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (err) {
      setError(getFriendlyError(err, input));
      setOutput('');
    }
  }, [input]);

  const handleSwap = useCallback(() => {
    if (output) {
      setInput(output);
      setOutput('');
      setError('');
    }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
  }, []);

  const handleCopy = useCallback(async () => {
    const text = output || input;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output, input]);

  return (
    <div className="flex-grow max-w-2xl mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30"
      >
        <h2 className="text-2xl font-bold text-on-surface text-center mb-6">
          {t('JSON 格式化', 'JSON Formatter')}
        </h2>

        {/* Input */}
        <div className="mb-4">
          <label className="text-sm font-medium text-on-surface mb-2 block">
            {t('输入 JSON', 'Input JSON')}
          </label>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
            }}
            placeholder={t('在此粘贴 JSON...', 'Paste JSON here...')}
            rows={8}
            className="w-full p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 text-on-surface placeholder-secondary/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-mono leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleFormat}
            className="flex-1 min-w-[80px] py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <Maximize2 className="w-4 h-4" />
            {t('格式化', 'Format')}
          </button>
          <button
            onClick={handleMinify}
            className="flex-1 min-w-[80px] py-2.5 rounded-xl bg-primary-container/50 text-primary font-semibold text-sm hover:bg-primary-container transition-colors flex items-center justify-center gap-1.5"
          >
            <Minimize2 className="w-4 h-4" />
            {t('压缩', 'Minify')}
          </button>
          <button
            onClick={handleSwap}
            disabled={!output}
            className="flex-1 min-w-[80px] py-2.5 rounded-xl bg-surface-container-high text-secondary font-semibold text-sm hover:bg-surface-variant transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <ArrowDownUp className="w-4 h-4" />
            {t('交换', 'Swap')}
          </button>
          <button
            onClick={handleCopy}
            className={`flex-1 min-w-[80px] py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-1.5 ${
              copied
                ? 'bg-green-100 text-green-600'
                : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t('已复制!', 'Copied!') : t('复制结果', 'Copy')}
          </button>
          <button
            onClick={handleClear}
            className="py-2.5 px-4 rounded-xl bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {t('清空', 'Clear')}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div>
            <label className="text-sm font-medium text-on-surface mb-2 block">
              {t('结果', 'Result')}
            </label>
            <textarea
              value={output}
              readOnly
              rows={8}
              className="w-full p-4 rounded-2xl bg-surface-container-low border border-surface-variant/30 text-on-surface resize-none text-sm font-mono leading-relaxed"
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
