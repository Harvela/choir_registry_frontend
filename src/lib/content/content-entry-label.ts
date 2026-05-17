import type { ContentEntryDto } from './types';

/** Pick a human-readable label from common CMS field keys. */
export function contentEntryLabel(entry: ContentEntryDto): string {
  const fv = entry.fieldValues ?? {};
  for (const k of ['title', 'name', 'slug', 'headline', 'churchName']) {
    const v = fv[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return `#${entry.id}`;
}
