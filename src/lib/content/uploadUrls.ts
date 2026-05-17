import { API_URL } from '@/config/api';

function apiOrigin(): string {
  const base = API_URL;
  if (!base) throw new Error('NEXT_PUBLIC_API_URL is not defined');
  return base.replace(/\/$/, '');
}

export function resolveUploadAssetUrl(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/uploads/')) {
    return `${apiOrigin()}${trimmed}`;
  }
  return trimmed;
}

export function rewriteUploadSrcsInHtml(html: string): string {
  const base = apiOrigin();
  return html.replace(
    /\bsrc=(["'])(\/uploads\/[^"']+)\1/gi,
    (_, quote: string, path: string) => `src=${quote}${base}${path}${quote}`,
  );
}
