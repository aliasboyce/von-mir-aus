/**
 * Hintergrund entfernen – einfache Methode ohne KI: Die Farbe des Randes wird als „Hintergrund“ angenommen,
 * von dort aus wird alles ähnlich Farbige durchsichtig gemacht (Flutfüllung). Funktioniert gut bei einfarbigen,
 * ruhigen Hintergründen (Papier, Wand, Himmel, Tisch), nicht bei unruhigen Szenen.
 */
export interface RemoveResult { url?: string; reason?: 'busy' | 'failed' | 'nothing'; removedPct?: number }

export async function removeBackground(dataUrl: string, tolerance: number): Promise<RemoveResult> {
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('decode'));
      i.src = dataUrl;
    });
    const k = Math.min(1, 720 / Math.max(img.width, img.height));
    const w = Math.max(2, Math.round(img.width * k));
    const h = Math.max(2, Math.round(img.height * k));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { reason: 'failed' };
    ctx.drawImage(img, 0, 0, w, h);
    const im = ctx.getImageData(0, 0, w, h);
    const d = im.data;
    // Rand abtasten
    const samples: number[][] = [];
    const take = (x: number, y: number) => {
      const o = (y * w + x) * 4;
      samples.push([d[o], d[o + 1], d[o + 2]]);
    };
    for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 40))) { take(x, 0); take(x, h - 1); }
    for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 40))) { take(0, y); take(w - 1, y); }
    const med = [0, 1, 2].map((ch) => samples.map((s) => s[ch]).sort((a, b) => a - b)[Math.floor(samples.length / 2)]);
    const dist = (r: number, g: number, b: number) => Math.hypot(r - med[0], g - med[1], b - med[2]);
    const close = samples.filter((s) => dist(s[0], s[1], s[2]) < 60).length / samples.length;
    if (close < 0.55) return { reason: 'busy' };
    const tol = tolerance;
    const mask = new Uint8Array(w * h); // 1 = Hintergrund
    const stack: number[] = [];
    const push = (x: number, y: number) => {
      const i = y * w + x;
      if (mask[i]) return;
      const o = i * 4;
      if (dist(d[o], d[o + 1], d[o + 2]) <= tol) {
        mask[i] = 1;
        stack.push(i);
      }
    };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) {
      const i = stack.pop() as number;
      const x = i % w;
      const y = (i - x) / w;
      if (x > 0) push(x - 1, y);
      if (x < w - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1);
      if (y < h - 1) push(x, y + 1);
    }
    let removed = 0;
    for (let i = 0; i < mask.length; i++) if (mask[i]) removed++;
    const pct = Math.round((removed / mask.length) * 100);
    if (pct < 3) return { reason: 'nothing', removedPct: pct };
    // weicher Rand: Randpixel des Motivs halbtransparent
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (mask[i]) {
          d[i * 4 + 3] = 0;
        } else {
          const near = (x > 0 && mask[i - 1]) || (x < w - 1 && mask[i + 1]) || (y > 0 && mask[i - w]) || (y < h - 1 && mask[i + w]);
          if (near) d[i * 4 + 3] = 150;
        }
      }
    }
    ctx.putImageData(im, 0, 0);
    return { url: c.toDataURL('image/png'), removedPct: pct };
  } catch {
    return { reason: 'failed' };
  }
}
