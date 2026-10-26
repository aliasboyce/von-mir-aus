/** turns any picture (data URL, URL or Blob) into JPEG bytes on a white background – the form the PDF writer embeds */
export interface JpegImage { bytes: Uint8Array; w: number; h: number }

export async function toJpeg(src: string | Blob, maxSide = 1600, quality = 0.86): Promise<JpegImage | null> {
  let url = typeof src === 'string' ? src : URL.createObjectURL(src);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('decode failed'));
      i.src = url;
    });
    const k = Math.min(1, maxSide / Math.max(img.width, img.height, 1));
    const w = Math.max(1, Math.round(img.width * k));
    const h = Math.max(1, Math.round(img.height * k));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob) return null;
    return { bytes: new Uint8Array(await blob.arrayBuffer()), w, h };
  } catch {
    return null;
  } finally {
    if (typeof src !== 'string') URL.revokeObjectURL(url);
    url = '';
  }
}
