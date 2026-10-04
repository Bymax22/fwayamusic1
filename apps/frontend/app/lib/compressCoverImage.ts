const MAX_COVER_BYTES = 380 * 1024;
const MAX_DIMENSIONS = [1200, 1024, 900, 768, 640];
const WEBP_QUALITIES = [0.9, 0.84, 0.78, 0.72, 0.66, 0.58, 0.5];

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The cover image could not be compressed.'));
      },
      'image/webp',
      quality,
    );
  });
}

export async function compressCoverImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Select an image file for the cover art.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot prepare cover images for upload.');

    for (const maxDimension of MAX_DIMENSIONS) {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of WEBP_QUALITIES) {
        const blob = await canvasToBlob(canvas, quality);
        if (blob.size <= MAX_COVER_BYTES) {
          const name = `${file.name.replace(/\.[^.]+$/, '') || 'cover'}.webp`;
          return new File([blob], name, { type: 'image/webp', lastModified: file.lastModified });
        }
      }
    }

    throw new Error('This cover image could not be compressed to the required social-preview size.');
  } finally {
    bitmap.close();
  }
}
