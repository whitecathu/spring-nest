import { useState, useCallback } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRightLeft, Copy, Check, Trash2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

export default function UrlCodec({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'component' | 'uri'>('component');
  const [error, setError] = useState('');
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const handleEncode = useCallback(() => {
    try {
      setError('');
      const result = mode === 'component' ? encodeURIComponent(input) : encodeURI(input);
      setOutput(result);
    } catch {
      setError(t('编码失败', 'Encoding failed'));
    }
  }, [input, mode, t]);

  const handleDecode = useCallback(() => {
    try {
      setError('');
      const result = mode === 'component' ? decodeURIComponent(input) : decodeURI(input);
      setOutput(result);
    } catch {
      setError(t('无效的编码字符串', 'Invalid encoded string'));
    }
  }, [input, mode, t]);

  const handleSwap = useCallback(() => {
    setInput(output);
    setOutput(input);
    setError('');
  }, [input, output]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
  }, []);

  const handleCopy = useCallback(async (text: string, which: 'input' | 'output') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    if (which === 'input') {
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    } else {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  }, []);

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div
        className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30"
      >
        <h2 className="text-2xl font-bold text-on-surface text-center mb-6">
          {t('URL 编解码', 'URL Codec')}
        </h2>

        {/* Mode Selector */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => {
              setMode('component');
              setError('');
            }}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              mode === 'component'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
            }`}
          >
            encodeURIComponent
          </button>
          <button
            onClick={() => {
              setMode('uri');
              setError('');
            }}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              mode === 'uri'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-secondary hover:bg-surface-variant'
            }`}
          >
            encodeURI
          </button>
        </div>

        <div className="text-xs text-secondary/60 text-center mb-4">
          {mode === 'component'
            ? t(
                '编码所有特殊字符，适合 URL 参数值',
                'Encodes all special characters, suitable for URL parameter values',
              )
            : t(
                "保留 URL 结构字符 (:/?#[]@!$&'()*+,;=)",
                "Preserves URL structure characters (:/?#[]@!$&'()*+,;=)",
              )}
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-secondary mb-2">
            {t('原文', 'Input')}
          </label>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
              className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl py-3 px-4 text-on-surface text-sm outline-none focus:border-primary/50 min-h-[100px] resize-y font-mono"
              placeholder={t('输入要编码/解码的 URL 文本...', 'Enter URL text to encode/decode...')}
            />
            {input && (
              <button
                onClick={() => handleCopy(input, 'input')}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 text-secondary hover:text-primary transition-colors"
              >
                {copiedInput ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleEncode}
            className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            {t('编码', 'Encode')}
          </button>
          <button
            onClick={handleDecode}
            className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary-container font-semibold text-sm hover:bg-primary-container/80 transition-colors"
          >
            {t('解码', 'Decode')}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Output */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-secondary mb-2">
            {t('编码结果', 'Result')}
          </label>
          <div className="relative">
            <textarea
              value={output}
              readOnly
              className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl py-3 px-4 text-on-surface text-sm outline-none min-h-[100px] resize-y font-mono"
              placeholder={t('结果将显示在这里...', 'Result will appear here...')}
            />
            {output && (
              <button
                onClick={() => handleCopy(output, 'output')}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 text-secondary hover:text-primary transition-colors"
              >
                {copiedOutput ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Utility Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSwap}
            className="flex-1 py-3 rounded-xl bg-surface-container-high text-secondary font-semibold text-sm hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            {t('交换', 'Swap')}
          </button>
          <button
            onClick={handleClear}
            className="flex-1 py-3 rounded-xl bg-red-50 text-red-500 font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t('清空', 'Clear')}
          </button>
        </div>
      </div>
    </div>
  );
}
