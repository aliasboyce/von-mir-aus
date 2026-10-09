/**
 * Hands a small generated file (a calendar file) to the person: through the
 * system share sheet when it can carry files (phones, and the only reliable
 * route in the iOS home-screen app), otherwise as a normal download.
 */
export async function deliverTextFile(content: string, filename: string, mime: string, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([content], filename, { type: mime });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (typeof nav.canShare === 'function' && nav.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
      // fall through to the download
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}
