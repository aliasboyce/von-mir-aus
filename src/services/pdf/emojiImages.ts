import { collectEmoji, type EmojiImg } from './pdfBuilder';

/** Pictures for the emoji in a text – drawn with the device's own emoji font onto a transparent canvas. */
async function deflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  type CS = new (f: string) => { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> };
  const Ctor = (globalThis as unknown as { CompressionStream?: CS }).CompressionStream;
  if (!Ctor) return null;
  try {
    const cs = new Ctor('deflate');
    const w = cs.writable.getWriter();
    void w.write(bytes);
    void w.close();
    const buf = await new Response(cs.readable as unknown as ReadableStream).arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

export const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla","Android Emoji",sans-serif';

export async function renderEmoji(e: string, px = 64): Promise<EmojiImg | null> {
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, px, px);
  ctx.font = `${Math.round(px * 0.78)}px ${EMOJI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(e, px / 2, px / 2 + px * 0.05);
  const data = ctx.getImageData(0, 0, px, px).data;
  const rgb = new Uint8Array(px * px * 3);
  const alpha = new Uint8Array(px * px);
  let any = false;
  for (let i = 0, j = 0; i < px * px; i++) {
    rgb[j++] = data[i * 4];
    rgb[j++] = data[i * 4 + 1];
    rgb[j++] = data[i * 4 + 2];
    alpha[i] = data[i * 4 + 3];
    if (data[i * 4 + 3] > 8) any = true;
  }
  if (!any) return null;
  const drgb = await deflate(rgb);
  const dal = drgb ? await deflate(alpha) : null;
  if (drgb && dal) return { w: px, h: px, rgb: drgb, alpha: dal, flate: true };
  return { w: px, h: px, rgb, alpha, flate: false };
}

/** Makes pictures for every emoji found in `texts` (call before building, then setEmojiImages). */
export async function prepareEmojis(texts: string[], px = 64): Promise<Map<string, EmojiImg>> {
  const set = new Set<string>();
  texts.forEach((t) => collectEmoji(t, set));
  const map = new Map<string, EmojiImg>();
  for (const e of set) {
    try {
      const img = await renderEmoji(e, px);
      if (img) map.set(e, img);
    } catch { /* leave this one out */ }
  }
  return map;
}
