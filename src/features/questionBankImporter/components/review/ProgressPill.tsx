export function ProgressPill({ current, total }: { current: number; total: number }) {
  return (
    <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--color-primary-soft)] px-3 text-sm font-semibold text-[var(--color-primary)]">
      第 {current} / {total} 题
    </span>
  );
}
