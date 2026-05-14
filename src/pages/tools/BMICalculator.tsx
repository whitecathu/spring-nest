import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { toolPageEnter } from '../../lib/animations';

export default function BMICalculator({ onBack }: { onBack: () => void }) {
  const { t } = useUser();

  return (
    <div className="flex-grow max-w-lg mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回工具列表', 'Back to Tools')}
      </button>

      <motion.div {...toolPageEnter}>
        <div className="mb-6">
          <h1 className="text-3xl font-black text-on-surface flex items-center gap-3">
            <span className="text-3xl">⚖️</span>
            {t('BMI 计算器', 'BMI Calculator')}
          </h1>
          <p className="text-sm text-secondary mt-1">
            {t('输入身高体重，快速计算 BMI 指数', 'Enter height and weight to calculate BMI')}
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl p-8 text-center">
          <p className="text-lg text-on-surface-variant mb-4">
            {t('工具正在开发中，敬请期待', 'Tool is under development. Stay tuned!')}
          </p>
          <div className="text-4xl">🚧</div>
        </div>
      </motion.div>
    </div>
  );
}
