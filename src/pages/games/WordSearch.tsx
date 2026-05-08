import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

export default function WordSearch({ onBack }: { onBack: () => void }) {
  const { t } = useUser();

  return (
    <div className="flex-grow max-w-2xl mx-auto w-full px-4 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary mb-4 transition-colors font-semibold text-sm min-h-[48px] px-2 -ml-2">
        <ArrowLeft className="w-5 h-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔤</div>
          <h1 className="text-3xl font-black text-on-surface">{t('找词游戏', 'Word Search')}</h1>
          <p className="text-secondary mt-2">{t('在字母网格中找出隐藏的单词，支持横竖斜八个方向，锻炼观察力和词汇量。', 'Find hidden words in a letter grid across all 8 directions. Trains observation and vocabulary.')}</p>
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
