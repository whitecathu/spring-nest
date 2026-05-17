import type { ButtonHTMLAttributes, ReactNode } from 'react';

type SoftButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface SoftButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SoftButtonVariant;
  icon?: ReactNode;
}

const variantClasses: Record<SoftButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-soft hover:bg-[var(--color-primary-strong)]',
  secondary:
    'border border-[var(--color-outline)] bg-[color:rgb(255_255_255_/_0.72)] text-[var(--color-ink)] shadow-soft hover:bg-[var(--color-surface)]',
  ghost: 'text-[var(--color-ink)] hover:bg-[color:rgb(255_255_255_/_0.55)]',
  danger:
    'border border-[color:rgb(186_26_26_/_0.25)] bg-[var(--color-error-soft)] text-[var(--color-error)] hover:bg-[color:rgb(255_218_214_/_0.9)]',
};

export function SoftButton({
  variant = 'secondary',
  icon,
  className = '',
  children,
  type = 'button',
  ...props
}: SoftButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
      <span className="min-w-0 truncate">{children}</span>
    </button>
  );
}
