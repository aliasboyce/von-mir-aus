/**
 * "Momentaufnahme": turns a finished SVG drawing into a real picture (PNG) – for the photo button in the
 * full-screen views and for the PDF, where a picture prints far more reliably than live vector drawing.
 */

/** an SVG string made ready to be a stand-alone picture (size, namespaces, default font) */
export function prepareSvg(markup: string, fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'): { svg: string; w: number; h: number } | null {
  const m = /<svg\b[^>]*>/.exec(markup);
  if (!m) return null;
  const vb = /viewBox="([-\d.e+\s,]+)"/.exec(m[0]);
  if (!vb) return null;
  const parts = vb[1].trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n)) || parts[2] <= 0 || parts[3] <= 0) return null;
  const [, , w, h] = parts;
  let tag = m[0].replace(/\s(width|height|style)="[^"]*"/g, '');
  if (!/xmlns=/.test(tag)) tag = tag.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  if (!/xmlns:xlink=/.test(tag)) tag = tag.replace('<svg', '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  tag = tag.replace('>', ` width="${w}" height="${h}" font-family="${fontFamily}">`);
  return { svg: markup.replace(m[0], tag), w, h };
}

/** draws an SVG string onto a canvas and returns it as PNG – null if the browser cannot do it */
export async function svgToPngBlob(markup: string, opts: { maxSide?: number; background?: string } = {}): Promise<Blob | null> {
  const prep = prepareSvg(markup);
  if (!prep) return null;
  const maxSide = opts.maxSide ?? 2000;
  const scale = Math.min(3, maxSide / Math.max(prep.w, prep.h));
  const cw = Math.max(1, Math.round(prep.w * scale));
  const ch = Math.max(1, Math.round(prep.h * scale));
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(prep.svg);
  const img = new Image();
  const loaded = new Promise<boolean>((res) => {
    img.onload = () => res(true);
    img.onerror = () => res(false);
  });
  img.src = url;
  if (!(await loaded)) return null;
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = opts.background ?? '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, 0, 0, cw, ch);
  return new Promise<Blob | null>((res) => {
    try {
      canvas.toBlob((b) => res(b), 'image/png');
    } catch {
      res(null);
    }
  });
}

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error('read failed'));
    r.readAsDataURL(blob);
  });

/** Hands a picture to the person: share sheet where files can be shared (phones: "Save image"), else a download. */
export async function deliverImage(blob: Blob, filename: string, title: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], filename, { type: blob.type || 'image/png' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (typeof nav.canShare === 'function' && nav.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'cancelled';
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

/** file-name friendly stamp: 2026-10-20_11-30 */
export const stamp = () => {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}_${z(d.getHours())}-${z(d.getMinutes())}`;
};
