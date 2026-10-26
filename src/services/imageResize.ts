/**
 * Resizes and compresses an uploaded image before it's ever turned into a
 * data URL for storage. This is the actual fix for "photo doesn't save
 * reliably": a raw phone-camera photo can be several MB, and localStorage
 * has a hard ~5-10MB quota for the WHOLE app combined - a single big photo
 * (or a few of them) can silently blow that budget. setItem catches the
 * resulting error and just logs it (see StorageAdapter.ts), so without
 * this fix the save looks like it worked in the moment (React state still
 * holds the image) but is gone after the next reload.
 *
 * These avatars only ever render at a few dozen pixels, so shrinking to at
 * most 256px on the long edge and re-encoding as JPEG loses no visible
 * quality while cutting file size by roughly 95%+.
 */
export function resizeImageFile(file: File, maxDimension = 256, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Like resizeImageFile, but pictures with transparent parts (stickers, cut-out PNG/WebP, e.g. from WhatsApp or the web)
 * stay transparent: they are stored as PNG instead of JPEG (which would turn the see-through parts black).
 */
export function resizeImageKeepAlpha(file: File | Blob, maxDimension = 720, quality = 0.78): Promise<{ url: string; transparent: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode failed'));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height, 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let transparent = false;
        const maybeAlpha = /png|webp|gif|avif|svg/i.test((file as File).type || '') || String(reader.result).startsWith('data:image/png') || String(reader.result).startsWith('data:image/webp');
        if (maybeAlpha) {
          try {
            // look at a coarse grid of pixels: any clearly see-through one means "keep the transparency"
            const step = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / 24));
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            outer: for (let y = 0; y < canvas.height; y += step) {
              for (let x = 0; x < canvas.width; x += step) {
                if (data[(y * canvas.width + x) * 4 + 3] < 200) {
                  transparent = true;
                  break outer;
                }
              }
            }
          } catch {
            // cannot read pixels → treat as opaque
          }
        }
        resolve({ url: transparent ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality), transparent });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
