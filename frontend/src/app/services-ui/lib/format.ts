// Single source of truth for money formatting. All money is integer pence;
// never call Number(...) / 100 anywhere outside this file.

export function formatPrice(
  pence: number | null | undefined,
  opts: { currency?: string; showZeroCents?: boolean } = {},
): string {
  if (pence == null || Number.isNaN(pence)) return '';
  const currency = (opts.currency || 'USD').toUpperCase();
  const amount = pence / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: opts.showZeroCents || amount % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function parsePrice(input: string | null | undefined): number {
  if (input == null) return 0;
  const cleaned = String(input).replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function relTime(ts: number | string | Date): string {
  const t = ts instanceof Date ? ts.getTime() : typeof ts === 'string' ? new Date(ts).getTime() : ts;
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + 'd ago';
  return new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function shortDate(ts: number | string | Date | null | undefined): string {
  if (ts == null) return '';
  const t = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(t.getTime())) return '';
  return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function mimeKind(mime: string | null | undefined): 'image' | 'pdf' | 'video' | 'audio' | 'archive' | 'file' {
  if (!mime) return 'file';
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.includes('zip') || mime.includes('rar')) return 'archive';
  return 'file';
}
