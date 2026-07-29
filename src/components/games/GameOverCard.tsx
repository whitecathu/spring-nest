import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Trophy } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

interface GameOverCardProps {
  score: number;
  bestScore: number;
  isNewRecord: boolean;
  onRestart: () => void;
  emoji?: string;
  extraInfo?: React.ReactNode;
  restartLabel?: string;
}

export default function GameOverCard({
  score,
  isNewRecord,
  onRestart,
  emoji = '🎮',
  extraInfo,
  restartLabel,
}: GameOverCardProps) {
  const { t } = useUser();
  const cardRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLParagraphElement>(null);
  const recordRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, { opacity: 0, scale: 0.85, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' });
    }
    if (emojiRef.current) {
      gsap.fromTo(emojiRef.current, { scale: 0 }, { scale: 1, duration: 0.4, delay: 0.1, ease: 'back.out(2)' });
    }
    if (isNewRecord && recordRef.current) {
      gsap.fromTo(recordRef.current, { scale: 0 }, { scale: 1, duration: 0.4, delay: 0.3, ease: 'back.out(2)' });
    }
  }, [isNewRecord]);

  return (
    <div
      ref={cardRef}
      className="mt-6 p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-700/30 rounded-2xl text-center"
  >
      <p ref={emojiRef} className="text-3xl mb-2">
        {emoji}
      </p>
      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
        {t('游戏结束', 'Game Over')}
      </p>
      <p className="text-xl font-bold text-orange-500 mb-1">
        {t('得分', 'Score')}: {score}
      </p>
      {extraInfo}
      {isNewRecord && (
        <p ref={recordRef} className="text-sm text-orange-500 flex items-center justify-center gap-1 mb-4">
          <Trophy className="w-4 h-4" />
          {t('新纪录！', 'New Record!')}
        </p>
      )}
      <button
        onClick={onRestart}
        className="px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors min-h-[48px]"
    >
        {restartLabel ?? t('再来一局', 'Play Again')}
      </button>
    </div>
  );
}
