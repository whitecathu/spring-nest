export function LoadingState({ label = '正在解析文件' }: { label?: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--color-outline-soft)] bg-[color:rgb(255_255_255_/_0.7)] p-5">
      <p className="text-sm font-semibold text-[var(--color-ink)]">{label}</p>
      <div className="mt-4 space-y-3" aria-hidden="true">
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-[var(--color-primary-soft)]" />
        <div className="h-3 w-full animate-pulse rounded-full bg-[var(--color-primary-soft)]" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-[var(--color-primary-soft)]" />
      </div>
    </div>
  );
}
