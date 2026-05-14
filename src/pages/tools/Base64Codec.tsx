import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRightLeft, Copy, Check, Trash2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodeBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export default function Base64Codec({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const handleEncode = useCallback(() => {
    try {
      setError('');
      const result = encodeBase64(input);
      setOutput(result);
    } catch {
      setError(t('编码失败', 'Encoding failed'));
    }
  }, [input, t]);

  const handleDecode = useCallback(() => {
    try {
      setError('');
      const result = decodeBase64(input);
      setOutput(result);
    } catch {
      setError(t('无效的 Base64 字符串', 'Invalid Base64 string'));
    }
  }, [input, t]);

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30"
      >
        <h2 className="text-2xl font-bold text-on-surface text-center mb-6">
          {t('Base64 编解码', 'Base64 Codec')}
        </h2>

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
              placeholder={t('输入要编码/解码的文本...', 'Enter text to encode/decode...')}
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
            {t('Base64', 'Base64')}
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
      </motion.div>
    </div>
  );
}
