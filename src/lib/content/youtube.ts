/** Extract a YouTube video ID from an ID or full URL. */
export function extractYouTubeId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (!trimmed.includes('/') && !trimmed.includes('?')) {
    return trimmed;
  }
  try {
    const url = new URL(
      trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
    );
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.replace(/^\//, '').split('/')[0] ?? '';
    }
    const v = url.searchParams.get('v');
    if (v) return v;
    const embed = url.pathname.match(/\/embed\/([^/?]+)/);
    if (embed?.[1]) return embed[1];
  } catch {
    return trimmed;
  }
  return trimmed;
}
