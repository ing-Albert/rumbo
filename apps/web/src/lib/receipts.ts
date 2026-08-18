import { supabase } from "./supabase";

export const RECEIPTS_BUCKET = "receipts";

/** Lado mayor al que se reduce la foto antes de subirla. */
const MAX_SIDE = 1400;
const JPEG_QUALITY = 0.72;

/**
 * Reduce la foto antes de subirla.
 *
 * La camara de un telefono da imagenes de varios megas, y un recibo se lee
 * perfectamente con mucho menos. Sin esto cada gasto costaria una subida lenta
 * con datos moviles y llenaria el almacenamiento a cambio de nada.
 */
export async function compressReceipt(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  // Si el navegador no puede recomprimir, subir el original es peor que nada
  // pero mejor que perder el recibo.
  return blob ?? file;
}

/**
 * Sube el recibo y devuelve su ruta.
 *
 * La ruta empieza por el id del usuario porque es lo que miran las politicas
 * del bucket: la primera carpeta tiene que coincidir con quien pide el archivo.
 */
export async function uploadReceipt(userId: string, file: File): Promise<string | null> {
  if (!supabase) return null;
  const blob = await compressReceipt(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  return error ? null : path;
}

/**
 * URL temporal para ver un recibo.
 *
 * El bucket es privado: sin firmar, la ruta sola no sirve para nada, que es
 * justo lo que se quiere de una foto que puede tener datos de una compra.
 */
export async function receiptUrl(path: string, secondsValid = 300): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, secondsValid);
  return error ? null : data.signedUrl;
}

export async function deleteReceipt(path: string): Promise<void> {
  if (!supabase) return;
  await supabase.storage.from(RECEIPTS_BUCKET).remove([path]);
}
