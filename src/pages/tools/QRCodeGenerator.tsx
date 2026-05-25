import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Download } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface QRCodeModule {
  toCanvas: (
    canvas: HTMLCanvasElement,
    text: string,
    options: { width: number; margin: number; color: { dark: string; light: string } },
  ) => Promise<void>;
}

let QRCode: QRCodeModule | null = null;

export default function QRCodeGenerator({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [input, setInput] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQR = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setQrDataUrl(null);
        setError('');
        return;
      }

      try {
        if (!QRCode) {
          const mod = await import('qrcode');
          QRCode = (mod.default || mod) as QRCodeModule;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        await QRCode.toCanvas(canvas, text.trim(), {
          width: 256,
          margin: 2,
          color: {
            dark: '#3f6751',
            light: '#ffffff',
          },
        });

        const dataUrl = canvas.toDataURL('image/png');
        setQrDataUrl(dataUrl);
        localStorage.setItem('spring_nest_qr_last_input', text.trim());
        setError('');
      } catch (err) {
        setError(t('二维码生成失败', 'Failed to generate QR code'));
        setQrDataUrl(null);
      }
    },
    [t],
  );

  useEffect(() => {
    const lastInput = localStorage.getItem('spring_nest_qr_last_input');
    if (lastInput) {
      setInput(lastInput);
      generateQR(lastInput);
    }
  }, [generateQR]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (!value.trim()) {
      setQrDataUrl(null);
      setError('');
    }
  };

  const handleGenerate = () => {
    if (!input.trim()) {
      setError(t('请输入文本或链接', 'Please enter text or URL'));
      return;
    }
    generateQR(input);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.download = 'qrcode.png';
    a.href = qrDataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <motion.button
        onClick={onBack}
        whileHover={{ x: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30"
      >
        <h2 className="text-2xl font-bold text-on-surface text-center mb-6">
          {t('二维码生成器', 'QR Code Generator')}
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-secondary mb-2">
            {t('输入文本或链接', 'Enter text or URL')}
          </label>
          <textarea
            rows={3}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('输入网址、文字内容...', 'Enter URL, text content...')}
            className="w-full bg-surface-container-low border border-surface-variant/30 rounded-xl py-3 px-4 text-on-surface outline-none focus:border-primary/50 transition-all resize-none font-medium"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          onClick={handleGenerate}
          className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold shadow-lg hover:shadow-xl transition-all mb-6"
        >
          {t('生成二维码', 'Generate QR Code')}
        </motion.button>

        {/* QR Code Display */}
        <div className="flex flex-col items-center">
          {qrDataUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="bg-white p-4 rounded-2xl shadow-sm border border-surface-variant/30 mb-4"
            >
              <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
            </motion.div>
          ) : (
            <div className="w-64 h-64 bg-surface-container-low rounded-2xl flex items-center justify-center mb-4 border border-surface-variant/20">
              <span className="text-secondary/40 text-sm">
                {t('在此显示二维码', 'QR code will appear here')}
              </span>
            </div>
          )}

          {qrDataUrl && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              onClick={handleDownload}
              className="px-6 py-3 bg-surface-container-high text-on-surface rounded-full font-semibold hover:bg-surface-variant transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              {t('下载二维码', 'Download QR Code')}
            </motion.button>
          )}
        </div>

        {/* Hidden canvas for QR generation */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  );
}
