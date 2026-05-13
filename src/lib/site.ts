const DEFAULT_SITE_ORIGIN = 'https://spring-nest.pages.dev';

function normalizeOrigin(value?: string): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

export function getSiteOrigin(): string {
  const envOrigin =
    normalizeOrigin(import.meta.env.VITE_SITE_URL) ??
    normalizeOrigin(import.meta.env.VITE_PUBLIC_SITE_URL);

  if (envOrigin) return envOrigin;

  return DEFAULT_SITE_ORIGIN;
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${getSiteOrigin()}${path}`;
}
