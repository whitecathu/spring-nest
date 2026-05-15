import { ArrowLeft, ArrowRight, Heart, Home, Shuffle, TriangleAlert } from 'lucide-react';
import { SoftButton } from '../common/SoftButton';

interface ReviewControlsProps {
  favorite: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onRandom: () => void;
  onExit: () => void;
  onFavorite: () => void;
  onWrong: () => void;
  canPrevious?: boolean;
  canNext?: boolean;
}

export function ReviewControls({
  favorite,
  onPrevious,
  onNext,
  onRandom,
  onExit,
  onFavorite,
  onWrong,
  canPrevious = true,
  canNext = true,
}: ReviewControlsProps) {
  return (
    <div className="sticky bottom-2 z-20 flex flex-wrap justify-center gap-2 rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[color:rgb(249_250_246_/_0.9)] p-2 shadow-soft backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
      <SoftButton
        icon={<ArrowLeft size={16} aria-hidden="true" />}
        onClick={onPrevious}
        disabled={!canPrevious}
      >
        上一题
      </SoftButton>
      <SoftButton
        icon={<ArrowRight size={16} aria-hidden="true" />}
        onClick={onNext}
        disabled={!canNext}
      >
        下一题
      </SoftButton>
      <SoftButton icon={<Shuffle size={16} aria-hidden="true" />} onClick={onRandom}>
        随机题
      </SoftButton>
      <SoftButton icon={<Heart size={16} aria-hidden="true" />} onClick={onFavorite}>
        {favorite ? '取消收藏' : '收藏'}
      </SoftButton>
      <SoftButton icon={<TriangleAlert size={16} aria-hidden="true" />} onClick={onWrong}>
        标记错题
      </SoftButton>
      <SoftButton icon={<Home size={16} aria-hidden="true" />} onClick={onExit}>
        退出复习
      </SoftButton>
    </div>
  );
}
