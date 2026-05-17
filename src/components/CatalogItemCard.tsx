import { ArrowRight, Heart, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SurfaceMotionTone } from '../lib/animations';
import type { AppItem } from '../types/app';
import { MotionButton, MotionCard } from './MotionSurface';

type CatalogItemVariant = 'tool' | 'game' | 'feature';

type CatalogItemCardProps = {
  item: AppItem;
  variant?: CatalogItemVariant;
  actionLabel: string;
  to?: string;
  isFavorite: boolean;
  onFavorite: (id: string) => void;
  onAction?: () => void;
  t: (zh: string, en: string) => string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function getCardTone(variant: CatalogItemVariant): SurfaceMotionTone {
  if (variant === 'game') return 'game';
  if (variant === 'feature') return 'glassGarden';
  return 'tool';
}

export default function CatalogItemCard({
  item,
  variant = 'tool',
  actionLabel,
  to,
  isFavorite,
  onFavorite,
  onAction,
  t,
}: CatalogItemCardProps) {
  const isGame = variant === 'game' || item.type === 'game';
  const showImage = Boolean(item.image);
  const title = t(item.title, item.titleEn);
  const category = t(item.category, item.categoryEn);
  const actionContent = (
    <>
      {isGame ? <Play className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      <span>{actionLabel}</span>
    </>
  );

  return (
    <MotionCard
      tone={getCardTone(variant)}
      className={cx(
        'group relative flex h-full min-h-[320px] flex-col gap-4 overflow-hidden rounded-3xl p-5',
        variant === 'game' ? 'surface-playful' : 'surface-raised',
        variant === 'feature' && 'p-6',
      )}
      aria-label={title}
    >
      <button
        type="button"
        onClick={() => onFavorite(item.id)}
        className={cx(
          'absolute right-4 top-4 z-[2] inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors',
          isFavorite
            ? 'bg-red-50 text-red-500 dark:bg-red-900/20'
            : 'bg-white/70 text-secondary hover:bg-red-50 hover:text-red-500 dark:bg-surface-container/70',
        )}
        aria-label={isFavorite ? t('取消收藏', 'Remove favorite') : t('收藏', 'Add favorite')}
      >
        <Heart className={cx('h-5 w-5', isFavorite && 'fill-current')} />
      </button>

      {showImage ? (
        <div className="relative h-44 overflow-hidden rounded-2xl bg-surface-container-low">
          <img
            src={item.image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-transparent" />
        </div>
      ) : (
        <div
          className={cx(
            'flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-4xl shadow-inner transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-3',
            item.iconBg || 'bg-surface-container',
          )}
          aria-hidden="true"
        >
          {item.icon}
        </div>
      )}

      <div className="min-w-0 pr-10">
        <h3 className="font-nunito text-xl font-extrabold text-on-surface transition-colors group-hover:text-primary">
          {title}
        </h3>
        <span className="mt-2 inline-flex rounded-full bg-primary-container/35 px-3 py-1 text-xs font-bold text-on-primary-container">
          {category}
        </span>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-secondary">
        {t(item.description, item.descriptionEn)}
      </p>

      <div className="mt-auto flex items-center justify-end">
        {to ? (
          <Link to={to} className="motion-button motion-button-primary px-5 text-sm">
            {actionContent}
          </Link>
        ) : (
          <MotionButton
            type="button"
            tone="primary"
            magnetic
            onClick={onAction}
            className="px-5 text-sm"
          >
            {actionContent}
          </MotionButton>
        )}
      </div>
    </MotionCard>
  );
}
