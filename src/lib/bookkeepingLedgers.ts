export interface Ledger {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

const STORAGE_KEY = 'spring_nest_bookkeeping_ledgers';

export function loadLedgers(): Ledger[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is Ledger =>
        typeof l === 'object' &&
        l !== null &&
        typeof l.id === 'string' &&
        typeof l.name === 'string',
    );
  } catch {
    return [];
  }
}

export function saveLedgers(ledgers: Ledger[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ledgers));
}

export function createLedger(
  name: string,
  emoji: string = '',
  options: { id?: string; now?: number } = {},
): Ledger | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  return {
    id:
      options.id ?? `ledger_${options.now ?? Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    emoji: emoji.trim(),
    createdAt: options.now ?? Date.now(),
  };
}

export function updateLedger(
  ledgers: Ledger[],
  id: string,
  updates: Partial<Pick<Ledger, 'name' | 'emoji'>>,
): Ledger[] {
  return ledgers.map((l) => (l.id === id ? { ...l, ...updates } : l));
}

export function deleteLedger(ledgers: Ledger[], id: string): Ledger[] {
  return ledgers.filter((l) => l.id !== id);
}

export const DEFAULT_LEDGER_ID = '__default__';
