/**
 * Things people copy from Pinterest, Google, WhatsApp, the gallery … arrive in very different shapes: as a real
 * picture file, as a piece of web page (HTML with an <img>), or only as a link / text. This turns all of them into
 * "pictures to place" or "text to place", as far as the browser lets us.
 */

export interface ClipContent {
  files: File[];
  text: string;
  html: string;
}

export function fromDataTransfer(dt: DataTransfer | null): ClipContent {
  const files: File[] = [];
  if (dt) {
    Array.from(dt.files ?? []).forEach((f) => f.type.startsWith('image/') && files.push(f));
    if (!files.length) {
      Array.from(dt.items ?? []).forEach((it) => {
        if (it.kind === 'file' && it.type.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      });
    }
  }
  return { files, text: dt?.getData('text/plain') ?? '', html: dt?.getData('text/html') ?? '' };
}

/** the "paste" button: asks the browser for the clipboard (pictures too). null = not allowed / not possible */
export async function fromAsyncClipboard(): Promise<ClipContent | null> {
  if (!navigator.clipboard?.read) return null;
  try {
    const items = await navigator.clipboard.read();
    const out: ClipContent = { files: [], text: '', html: '' };
    for (const it of items) {
      for (const type of it.types) {
        if (type.startsWith('image/')) {
          const b = await it.getType(type);
          out.files.push(new File([b], 'clip.' + (type.split('/')[1] || 'png'), { type }));
          break; // one version of the same picture is enough
        }
      }
      if (it.types.includes('text/html') && !out.html) out.html = await (await it.getType('text/html')).text();
      if (it.types.includes('text/plain') && !out.text) out.text = await (await it.getType('text/plain')).text();
    }
    return out;
  } catch {
    return null;
  }
}

/** picture addresses inside copied web page HTML (Pinterest, Google Images, …) */
export function imageUrlsFromHtml(html: string): string[] {
  if (!html) return [];
  const urls: string[] = [];
  const re = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const u = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|data:image\/)/i.test(u) && !urls.includes(u)) urls.push(u);
  }
  return urls.slice(0, 6);
}

/** a single copied link that points at a picture */
export function imageUrlFromText(text: string): string | null {
  const t = text.trim();
  if (!/^https?:\/\/\S+$/i.test(t)) return null;
  if (/\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(t) || /pinimg\.com|googleusercontent\.com|gstatic\.com|media\d*\.giphy|cdn\.discordapp|mmg\.whatsapp|scontent/i.test(t)) return t;
  return null;
}

/** loads a picture address into a file – only works when the other site allows it (many do for pictures) */
export async function fetchImageFile(url: string): Promise<File | null> {
  try {
    if (url.startsWith('data:')) {
      const b = await (await fetch(url)).blob();
      return b.type.startsWith('image/') ? new File([b], 'bild', { type: b.type }) : null;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(url, { mode: 'cors', signal: ctrl.signal, referrerPolicy: 'no-referrer' });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const b = await res.blob();
    return b.type.startsWith('image/') ? new File([b], 'bild', { type: b.type }) : null;
  } catch {
    return null;
  }
}
