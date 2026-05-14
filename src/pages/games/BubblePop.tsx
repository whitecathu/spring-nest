import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

export default function BubblePop({ onBack }: { onBack: () => void }) {
  const { t } = useUser();

  return (
    <div className="flex-grow max-w-2xl mx-auto w-full px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🫧</div>
          <h1 className="text-3xl font-black text-on-surface">{t('泡泡消消', 'Bubble Pop')}</h1>
          <p className="text-secondary mt-2">
            {t(
              '点击相同颜色的泡泡消除，连锁反应加分，挑战高分极限。',
              'Pop same-color bubbles for chain reactions and bonus points. Challenge your high score!',
            )}
          </p>
        </div>

        <div className="bg-surface-container rounded-2xl p-8 text-center">
          <p className="text-lg text-on-surface-variant mb-4">
            {t('游戏正在开发中，敬请期待', 'Game is under development. Stay tuned!')}
          </p>
          <div className="text-4xl">🚧</div>
        </div>
      </motion.div>
    </div>
  );
}
