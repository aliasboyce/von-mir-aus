/** Kleine Helfer für Fotos in der 3D-Mindmap: verkleinern, damit der Speicher des Geräts nicht voll läuft. */

export interface SmallImage { dataUrl: string; ar: number; tone: 'dark' | 'light' }

function load(file: File | Blob): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

/** Bilddatei → kleines JPEG (Data-URL), Seitenverhältnis und ob das Bild eher hell oder dunkel wirkt */
export async function fileToSmallImage(file: File | Blob, maxSide = 640, quality = 0.78): Promise<SmallImage | null> {
  if (file.type && !file.type.startsWith('image/')) return null;
  const img = await load(file);
  if (!img || !img.width || !img.height) return null;
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k));
  const h = Math.max(1, Math.round(img.height * k));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = c.toDataURL('image/jpeg', quality);
  if (dataUrl.length < 200) return null;
  const s = document.createElement('canvas');
  s.width = 12;
  s.height = 12;
  const sx = s.getContext('2d');
  let tone: 'dark' | 'light' = 'dark';
  if (sx) {
    sx.drawImage(c, 0, 0, 12, 12);
    const d = sx.getImageData(0, 0, 12, 12).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    tone = sum / (d.length / 4) > 128 ? 'light' : 'dark';
  }
  return { dataUrl, ar: w / h, tone };
}

export const kb = (s: string) => Math.round(s.length / 1024);
