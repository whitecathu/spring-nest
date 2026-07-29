import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Calculator, Users, Percent, Check } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { springBouncy, springSmooth, springSnappy, toolPageEnter } from '../../lib/animations';

const TIP_PRESETS = [10, 15, 18, 20, 25];

export default function TipCalculator({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [billAmount, setBillAmount] = useState('');
  const [tipPercent, setTipPercent] = useState(15);
  const [customTip, setCustomTip] = useState('');
  const [splitCount, setSplitCount] = useState(1);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(toastTimeoutRef.current);
    },
    [],
  );

  const bill = parseFloat(billAmount) || 0;
  const tip = customTip ? parseFloat(customTip) || 0 : tipPercent;

  const calculations = useMemo(() => {
    const tipAmount = bill * (tip / 100);
    const total = bill + tipAmount;
    const perPerson = splitCount > 0 ? total / splitCount : total;
    return { tipAmount, total, perPerson };
  }, [bill, tip, splitCount]);

  const formatCurrency = (n: number) => `¥${n.toFixed(2)}`;

  const showToast = useCallback(() => {
    const text = `${t('小费', 'Tip')}: ${formatCurrency(calculations.tipAmount)} | ${t('总计', 'Total')}: ${formatCurrency(calculations.total)}${splitCount > 1 ? ` | ${t('每人', 'Per Person')}: ${formatCurrency(calculations.perPerson)}` : ''}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setToastVisible(true);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 1500);
  }, [calculations, splitCount, t]);

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <div {...toolPageEnter}>
        <div className="mb-6">
          <h1 className="text-3xl font-black text-on-surface flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            {t('小费计算器', 'Tip Calculator')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('快速计算小费和分账', 'Quickly calculate tips and split bills')}
          </p>
        </div>

        {/* Bill Amount */}
        <div className="bg-surface-container rounded-2xl p-5 mb-4">
          <label className="text-sm font-semibold text-secondary mb-2 block">
            {t('账单金额', 'Bill Amount')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">
              ¥
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-4 text-2xl font-bold bg-surface-container-lowest rounded-xl outline-none focus:ring-2 focus:ring-primary text-on-surface"
            />
          </div>
        </div>

        {/* Tip Percentage */}
        <div className="bg-surface-container rounded-2xl p-5 mb-4">
          <label className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
            <Percent className="w-4 h-4" />
            {t('小费比例', 'Tip Percentage')}
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {TIP_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setTipPercent(p);
                  setCustomTip('');
                }}
                className={`px-4 py-2 rounded-full font-semibold text-sm min-h-[48px] transition-colors ${
                  tipPercent === p && !customTip
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-variant'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={customTip}
            onChange={(e) => setCustomTip(e.target.value)}
            placeholder={t('自定义比例...', 'Custom %...')}
            className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl outline-none focus:ring-2 focus:ring-primary text-on-surface text-sm"
          />
        </div>

        {/* Split */}
        <div className="bg-surface-container rounded-2xl p-5 mb-6">
          <label className="text-sm font-semibold text-secondary mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('分账人数', 'Split Between')}
          </label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
              className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface font-bold text-xl flex items-center justify-center"
            >
              -
            </button>
            <span
              key={splitCount}
              className="text-3xl font-black text-primary w-16 text-center tabular-nums"
            >
              {splitCount}
            </span>
            <button
              onClick={() => setSplitCount(Math.min(20, splitCount + 1))}
              className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface font-bold text-xl flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>

        {/* Results */}
        {bill > 0 ? (
            <div
              key="results"
              onClick={showToast}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  showToast();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={t('复制小费计算结果', 'Copy tip calculation results')}
              className="relative bg-gradient-to-br from-primary-container/50 to-primary/10 rounded-2xl p-6 space-y-3 cursor-pointer"
            >
              {/* Gradient shift overlay on value change */}
              <div
                key={`${calculations.tipAmount}-${calculations.total}-${calculations.perPerson}`}
                className="absolute inset-0 bg-gradient-to-br from-primary/15 to-tertiary/10 rounded-2xl pointer-events-none"
              />
              {/* Tip Amount - staggered row 1 */}
              <div
                className="flex justify-between items-center"
              >
                <span className="text-secondary font-medium">{t('小费金额', 'Tip Amount')}</span>
                <span
                  key={formatCurrency(calculations.tipAmount)}
                  className="text-xl font-bold text-on-surface"
                >
                  {formatCurrency(calculations.tipAmount)}
                </span>
              </div>

              {/* Total - staggered row 2 */}
              <div
                className="flex justify-between items-center border-t border-on-surface/10 pt-3"
              >
                <span className="text-secondary font-medium">{t('总计', 'Total')}</span>
                <span
                  key={formatCurrency(calculations.total)}
                  className="text-2xl font-black text-primary"
                >
                  {formatCurrency(calculations.total)}
                </span>
              </div>

              {/* Per Person - staggered row 3, AnimatePresence for show/hide */}
              {splitCount > 1 && (
                  <div
                    key="per-person"
                  >
                    <div className="flex justify-between items-center border-t border-on-surface/10 pt-3">
                      <span className="text-secondary font-medium">{t('每人', 'Per Person')}</span>
                      <span
                        key={formatCurrency(calculations.perPerson)}
                        className="text-2xl font-black text-tertiary"
                      >
                        {formatCurrency(calculations.perPerson)}
                      </span>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div
              key="empty"
              className="bg-surface-container rounded-2xl p-8 text-center"
            >
              <div
              >
                <Calculator className="w-10 h-10 text-secondary/30 mx-auto mb-2" />
              </div>
              <p className="text-sm text-secondary/50">
                {t('输入账单金额查看结果', 'Enter bill amount to see results')}
              </p>
            </div>
          )}

        {/* Copied toast */}
        {toastVisible && (
            <div
              role="status"
              aria-live="polite"
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-on-surface text-surface px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 shadow-lg z-50"
            >
              <Check className="w-4 h-4" />
              {t('已复制结果', 'Copied!')}
            </div>
          )}

        <div className="mt-4 text-center text-xs text-secondary/50">
          {t(
            '输入账单金额，选择小费比例和分账人数',
            'Enter bill amount, select tip % and split count',
          )}
        </div>
      </div>
    </div>
  );
}
