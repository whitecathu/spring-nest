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
}

export function ReviewControls({
  favorite,
  onPrevious,
  onNext,
  onRandom,
  onExit,
  onFavorite,
  onWrong,
}: ReviewControlsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <SoftButton icon={<ArrowLeft size={16} aria-hidden="true" />} onClick={onPrevious}>
        上一题
      </SoftButton>
      <SoftButton icon={<ArrowRight size={16} aria-hidden="true" />} onClick={onNext}>
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
