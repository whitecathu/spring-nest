import type { HTMLAttributes } from 'react';

export function GlassCard({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[1.6rem] border border-[var(--color-outline-soft)] bg-[var(--color-card)] p-5 shadow-soft transition duration-300 ease-out md:p-6 ${className}`}
      {...props}
    />
  );
}
