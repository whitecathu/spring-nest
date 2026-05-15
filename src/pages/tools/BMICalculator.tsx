import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw, Scale } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { toolPageEnter } from '../../lib/animations';

type BmiBand = {
  min: number;
  max: number;
  label: string;
  labelEn: string;
  tone: string;
  advice: string;
  adviceEn: string;
};

const bmiBands: BmiBand[] = [
  {
    min: 0,
    max: 18.5,
    label: '偏瘦',
    labelEn: 'Underweight',
    tone: 'bg-amber-100 text-amber-700',
    advice: '规律饮食，增加优质蛋白和力量训练，避免只靠零食补热量。',
    adviceEn:
      'Eat regularly, add quality protein and strength training, and avoid relying on snacks.',
  },
  {
    min: 18.5,
    max: 24,
    label: '健康范围',
    labelEn: 'Healthy range',
    tone: 'bg-primary-container/50 text-on-primary-container',
    advice: '继续保持稳定作息、均衡饮食和每周运动习惯。',
    adviceEn: 'Keep a steady routine, balanced meals, and weekly exercise.',
  },
  {
    min: 24,
    max: 28,
    label: '超重',
    labelEn: 'Overweight',
    tone: 'bg-orange-100 text-orange-700',
    advice: '优先减少含糖饮料和夜宵，加入可持续的有氧与力量训练。',
    adviceEn:
      'Reduce sugary drinks and late snacks first, then add sustainable cardio and strength work.',
  },
  {
    min: 28,
    max: Number.POSITIVE_INFINITY,
    label: '肥胖',
    labelEn: 'Obesity range',
    tone: 'bg-red-100 text-red-700',
    advice: '建议结合腰围、血压等指标，并咨询专业医生制定计划。',
    adviceEn: 'Check waist and blood pressure too, and consult a clinician for a plan.',
  },
];

function findBand(bmi: number) {
  return bmiBands.find((band) => bmi >= band.min && bmi < band.max) ?? bmiBands[0];
}

function parsePositiveNumber(value: string) {
  const normalized = value.replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default function BMICalculator({ onBack }: { onBack: () => void }) {
  const { t } = useUser();
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('65');

  const result = useMemo(() => {
    const heightCm = parsePositiveNumber(height);
    const weightKg = parsePositiveNumber(weight);
    if (!heightCm || !weightKg) return null;
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    return { bmi, band: findBand(bmi) };
  }, [height, weight]);

  const idealRange = useMemo(() => {
    const heightCm = parsePositiveNumber(height);
    if (!heightCm) return null;
    const heightM = heightCm / 100;
    return {
      low: 18.5 * heightM * heightM,
      high: 23.9 * heightM * heightM,
    };
  }, [height]);

  return (
    <div className="flex-grow mx-auto w-full max-w-3xl px-4 py-8">
      <button
        onClick={onBack}
        className="mb-4 flex min-h-[48px] items-center gap-2 px-2 -ml-2 text-sm font-semibold text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-5 w-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div {...toolPageEnter} className="space-y-5">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black text-on-surface">
            <Scale className="h-8 w-8 text-primary" />
            {t('BMI 计算器', 'BMI Calculator')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            {t(
              '输入身高体重，快速计算 BMI，并查看健康范围与建议。',
              'Enter height and weight to calculate BMI and see the health range.',
            )}
          </p>
        </div>

        <section className="grid gap-5 rounded-3xl border border-surface-variant/30 bg-white/85 p-5 shadow-lg dark:bg-surface-container-high/80 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <label className="grid gap-2 text-sm font-bold text-on-surface">
              {t('身高（厘米）', 'Height (cm)')}
              <input
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                inputMode="decimal"
                className="min-h-[52px] rounded-2xl border border-surface-variant/40 bg-surface-container-low px-4 text-lg font-semibold outline-none focus:border-primary"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-on-surface">
              {t('体重（公斤）', 'Weight (kg)')}
              <input
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                inputMode="decimal"
                className="min-h-[52px] rounded-2xl border border-surface-variant/40 bg-surface-container-low px-4 text-lg font-semibold outline-none focus:border-primary"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setHeight('170');
                setWeight('65');
              }}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
            >
              <RotateCcw className="h-4 w-4" />
              {t('恢复示例', 'Reset example')}
            </button>
          </div>

          <div className="rounded-3xl bg-surface-container-low p-5">
            {result ? (
              <>
                <p className="text-sm font-bold text-secondary">{t('计算结果', 'Result')}</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-5xl font-black text-primary">{result.bmi.toFixed(1)}</span>
                  <span className="pb-2 text-sm font-semibold text-secondary">BMI</span>
                </div>
                <span
                  className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-bold ${result.band.tone}`}
                >
                  {t(result.band.label, result.band.labelEn)}
                </span>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                  {t(result.band.advice, result.band.adviceEn)}
                </p>
                {idealRange && (
                  <p className="mt-4 rounded-2xl bg-white/70 p-3 text-sm leading-6 text-secondary dark:bg-surface-container-high">
                    {t(
                      `按当前身高，健康体重约为 ${idealRange.low.toFixed(1)}-${idealRange.high.toFixed(1)} 公斤。`,
                      `For this height, a healthy weight is roughly ${idealRange.low.toFixed(1)}-${idealRange.high.toFixed(1)} kg.`,
                    )}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm leading-7 text-secondary">
                {t('请输入有效的身高和体重。', 'Enter a valid height and weight.')}
              </p>
            )}
          </div>
        </section>
      </motion.div>
    </div>
  );
}
