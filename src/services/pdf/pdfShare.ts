/**
 * Hands a finished PDF to the person without any print dialog:
 *  1. Phones/tablets with a share sheet (iOS Safari AND the iOS home-
 *     screen app, Android Chrome): navigator.share with the file — the
 *     person picks "In Dateien sichern", Mail, Drucken, ... themselves.
 *  2. Everything else (desktop): a normal file download.
 * "Das PDF funktioniert nicht, er sagt er braucht Safari"-Fund — this
 * is the path that works in iOS standalone mode, where window.print()
 * is blocked outright.
 */
export type PdfDeliveryResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

export function safeFilename(title: string, fallback = 'dokument'): string {
  const base = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${base || fallback}.pdf`;
}

export async function deliverPdf(bytes: Uint8Array, filename: string, title?: string): Promise<PdfDeliveryResult> {
  try {
    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    const file = new File([blob], filename, { type: 'application/pdf' });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: title ?? filename });
        return 'shared';
      } catch (err) {
        if ((err as Error).name === 'AbortError') return 'cancelled';
        // fall through to download
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}
