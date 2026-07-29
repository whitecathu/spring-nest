/** Generate a unique ID for game particles, popups, etc. */
export function uid(): string {
  return crypto.randomUUID();
}
