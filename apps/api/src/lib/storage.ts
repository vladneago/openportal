/**
 * S3-compatible storage client for MinIO (dev) and S3 (production).
 * Handles file upload, download, deletion, and signed URLs.
 */

const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "openportal";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "openportal_dev";
const S3_BUCKET = process.env.S3_BUCKET_DOCUMENTS || "documents";
const S3_REGION = process.env.S3_REGION || "us-east-1";

/**
 * Upload a file buffer to object storage.
 * Returns the storage key (path) where the file was stored.
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<{ key: string; url: string }> {
  const url = `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "Content-Length": body.length.toString(),
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Storage upload failed: ${res.status} ${res.statusText}`);
  }

  return { key, url };
}

/**
 * Get a download URL for a file.
 * For MinIO in dev, returns direct URL. In production, use presigned URLs.
 */
export function getFileUrl(key: string): string {
  return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(key: string): Promise<void> {
  const url = `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
  await fetch(url, { method: "DELETE" });
}

/**
 * Generate a unique storage key for a document.
 * Format: tenantId/libraryId/year/month/uuid-filename
 */
export function generateStorageKey(
  tenantId: string,
  libraryId: string,
  fileName: string,
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const id = crypto.randomUUID().split("-")[0];
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${tenantId}/${libraryId}/${year}/${month}/${id}-${safeName}`;
}

/**
 * Parse file extension from filename.
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * Get human-readable file size.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
