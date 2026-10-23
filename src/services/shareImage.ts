/**
 * Makes a picture small enough to travel inside a share link: a thumbnail of
 * at most 240 px as JPEG (about 6-10 KB). Photos from the web (https) are sent
 * as the address only; the drawn symbol pictures are not sent at all, the
 * receiving app draws the same one again.
 */

const MAX_CHARS = 26000;

function shrink(src: string, maxDim: number, quality: number): Promise<string | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(undefined);
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(undefined);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(undefined);
      }
    };
    img.src = src;
  });
}

/** The image value to put into a share payload, or undefined when none should travel. */
export async function imageForShare(src: string | undefined): Promise<string | undefined> {
  if (!src) return undefined;
  if (src.startsWith('data:image/svg+xml')) return undefined;
  if (/^https:\/\//i.test(src)) return src.length <= 400 ? src : undefined;
  if (!src.startsWith('data:image/')) return undefined;
  for (const [dim, q] of [[240, 0.55], [180, 0.45], [120, 0.4]] as const) {
    const out = await shrink(src, dim, q);
    if (out && out.length <= MAX_CHARS) return out;
  }
  return undefined;
}

/** Accepts only pictures that are safe to show from a received link. */
export function isAcceptableSharedImage(src: unknown): src is string {
  if (typeof src !== 'string' || src.length > MAX_CHARS + 100) return false;
  if (/^https:\/\/picsum\.photos\//i.test(src)) return true;
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src);
}
