export function createId(prefix = 'id'): string {
  const random =
    globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${random.replaceAll('-', '').slice(0, 18)}`;
}
