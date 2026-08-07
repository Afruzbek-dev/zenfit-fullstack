/**
 * Client-side image downscaling.
 *
 * Avatars are stored as data URIs in the database, so the file has to be small
 * before it ever leaves the phone: a modern camera photo is 3–8 MB, while a
 * 256px square lands around 20–30 KB. Cropping to a centre square keeps faces
 * where the user expects them in a circular frame.
 */

const MIME_FALLBACK = "image/jpeg";

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Rasmni o'qib bo'lmadi"));
    };
    img.src = url;
  });
}

function supportsWebp(canvas) {
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

/**
 * @returns {Promise<string>} a `data:image/...;base64,...` URI
 */
export async function toSquareDataUrl(file, size = 256, quality = 0.82) {
  if (!file.type.startsWith("image/")) throw new Error("Faqat rasm fayli tanlang");

  const img = await loadImage(file);
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

  const mime = supportsWebp(canvas) ? "image/webp" : MIME_FALLBACK;
  let dataUrl = canvas.toDataURL(mime, quality);

  // The server caps the stored string; step the quality down rather than
  // failing on a photo that is merely noisy.
  let q = quality;
  while (dataUrl.length > 200_000 && q > 0.4) {
    q -= 0.15;
    dataUrl = canvas.toDataURL(mime, q);
  }
  return dataUrl;
}
