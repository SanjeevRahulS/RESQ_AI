import { supabase } from "@/integrations/supabase/client";
import { PHOTO_BUCKET } from "./constants";
import { createPhotoUploads } from "./reads.functions";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"];
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export function validatePhoto(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return `${file.name}: only JPG, PNG, WebP, HEIC or GIF images are supported.`;
  if (file.size > MAX_PHOTO_BYTES) return `${file.name}: image is larger than 8 MB.`;
  return null;
}

/** Uploads report photos into server-issued, one-time upload slots and returns their storage paths. */
export async function uploadReportPhotos(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  const slots = await createPhotoUploads({
    data: { files: files.map((f) => ({ contentType: f.type as never, size: f.size })) },
  });
  for (const [i, file] of files.entries()) {
    const slot = slots[i];
    if (!slot) throw new Error("Photo upload could not be started. Please try again.");
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .uploadToSignedUrl(slot.path, slot.token, file, { contentType: file.type });
    if (error) throw new Error(`Photo upload failed (${file.name}): ${error.message}`);
  }
  return slots.map((s) => s.path);
}
