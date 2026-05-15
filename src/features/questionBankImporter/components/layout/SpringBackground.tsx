import type { ReactNode } from 'react';

export function SpringBackground({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-[var(--color-bg)] text-[var(--color-ink)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(135deg,#f9faf6_0%,#eef7f2_48%,#fff4d9_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-45 [background-image:linear-gradient(rgba(20,66,45,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(20,66,45,0.045)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 [background-image:linear-gradient(120deg,rgba(223,243,231,0.36)_0%,transparent_34%,rgba(247,197,176,0.24)_66%,transparent_100%)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),transparent)]" />
      {children}
    </div>
  );
}
