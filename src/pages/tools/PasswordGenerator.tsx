import { useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Copy, Check, RefreshCw } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

function generatePassword(length: number, useUpper: boolean, useNum: boolean, useSym: boolean): string {
  let charset = LOWERCASE;
  if (useUpper) charset += UPPERCASE;
  if (useNum) charset += NUMBERS;
  if (useSym) charset += SYMBOLS;

  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

function getStrength(pwd: string, opts: boolean[]): { label: string; labelEn: string; color: string; pct: number } {
  const [upper, num, sym] = opts;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (upper && /[A-Z]/.test(pwd)) score++;
  if (num && /[0-9]/.test(pwd)) score++;
  if (sym && /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) score++;
  if (score <= 2) return { label: '弱', labelEn: 'Weak', color: 'bg-red-500', pct: 25 };
  if (score <= 3) return { label: '中等', labelEn: 'Medium', color: 'bg-yellow-500', pct: 50 };
  if (score <= 4) return { label: '强', labelEn: 'Strong', color: 'bg-green-400', pct: 75 };
  return { label: '非常强', labelEn: 'Very Strong', color: 'bg-green-600', pct: 100 };
}

export default function PasswordGenerator({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useNum, setUseNum] = useState(true);
  const [useSym, setUseSym] = useState(true);
  const [copied, setCopied] = useState(false);

  const password = useMemo(() => generatePassword(length, useUpper, useNum, useSym), [length, useUpper, useNum, useSym]);

  const strength = useMemo(() => getStrength(password, [useUpper, useNum, useSym]), [password, useUpper, useNum, useSym]);

  const [displayPwd, setDisplayPwd] = useState(password);

  const regenerate = useCallback(() => {
    setDisplayPwd(generatePassword(length, useUpper, useNum, useSym));
  }, [length, useUpper, useNum, useSym]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayPwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = displayPwd;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [displayPwd]);

  return (
    <div className="flex-grow max-w-md mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-6 transition-colors font-semibold text-sm">
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-lg border border-surface-variant/30">
        <h2 className="text-2xl font-bold text-on-surface text-center mb-6">{t('密码生成器', 'Password Generator')}</h2>

        {/* Generated Password Display */}
        <div className="bg-surface-container-low rounded-2xl p-4 mb-4 flex items-center gap-3">
          <span className="flex-1 font-mono text-lg text-on-surface break-all select-all">{displayPwd}</span>
          <button onClick={handleCopy} className={`p-2 rounded-xl transition-all shrink-0 ${copied ? 'bg-green-100 text-green-600' : 'bg-white text-secondary hover:text-primary hover:bg-primary-container/20'}`}>
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
          <button onClick={regenerate} className="p-2 rounded-xl bg-white text-secondary hover:text-primary hover:bg-primary-container/20 transition-all shrink-0">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Strength Indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-secondary">{t('密码强度', 'Strength')}</span>
            <span className="text-sm font-bold">{t(strength.label, strength.labelEn)}</span>
          </div>
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.pct}%` }} />
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          {/* Length */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-on-surface">{t('长度', 'Length')}</label>
              <span className="text-sm font-bold text-primary">{length}</span>
            </div>
            <input
              type="range"
              min={6}
              max={32}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-secondary/50 mt-1">
              <span>6</span>
              <span>32</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-on-surface">{t('包含大写字母', 'Uppercase (A-Z)')}</span>
              <button
                onClick={() => setUseUpper(!useUpper)}
                className={`w-11 h-6 rounded-full transition-colors relative ${useUpper ? 'bg-primary' : 'bg-surface-variant'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${useUpper ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-on-surface">{t('包含数字', 'Numbers (0-9)')}</span>
              <button
                onClick={() => setUseNum(!useNum)}
                className={`w-11 h-6 rounded-full transition-colors relative ${useNum ? 'bg-primary' : 'bg-surface-variant'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${useNum ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-on-surface">{t('包含特殊字符', 'Symbols (!@#$...)')}</span>
              <button
                onClick={() => setUseSym(!useSym)}
                className={`w-11 h-6 rounded-full transition-colors relative ${useSym ? 'bg-primary' : 'bg-surface-variant'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${useSym ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
