import path from "path";
import { mkdir } from "fs/promises";

export const UPLOADS_ROOT = path.join(process.cwd(), "storage", "uploads");

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_SCORM_BYTES = 50 * 1024 * 1024; // 50 MB

/** Extension → MIME allowlist for general uploads */
export const ALLOWED_UPLOADS: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".gif": ["image/gif"],
  ".webp": ["image/webp"],
  ".txt": ["text/plain"],
  ".doc": ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".ppt": ["application/vnd.ms-powerpoint"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".zip": ["application/zip", "application/x-zip-compressed"],
};

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp3": "audio/mpeg",
  ".zip": "application/zip",
};

export function extnameLower(name: string) {
  return path.extname(name).toLowerCase();
}

export function sanitizeFileName(name: string) {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base || "file";
}

export function contentTypeFor(filePath: string) {
  return MIME_BY_EXT[extnameLower(filePath)] || "application/octet-stream";
}

export async function ensureUploadsRoot() {
  await mkdir(UPLOADS_ROOT, { recursive: true });
}

/**
 * Resolve a relative upload path under UPLOADS_ROOT; reject traversal.
 * Returns absolute path or null if invalid.
 */
export function resolveUploadPath(relativeParts: string[]): string | null {
  const joined = path.normalize(path.join(...relativeParts));
  if (joined.includes("..") || path.isAbsolute(joined)) return null;
  const abs = path.resolve(UPLOADS_ROOT, joined);
  const root = path.resolve(UPLOADS_ROOT);
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return abs;
}

export function validateUploadFile(
  file: File,
  { maxBytes = MAX_UPLOAD_BYTES, allowZip = false }: { maxBytes?: number; allowZip?: boolean } = {}
): { ok: true; ext: string } | { ok: false; error: string } {
  if (!file?.name) return { ok: false, error: "No file" };
  if (file.size <= 0) return { ok: false, error: "Empty file" };
  if (file.size > maxBytes) {
    return { ok: false, error: `File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)` };
  }
  const ext = extnameLower(file.name);
  const allowed = ALLOWED_UPLOADS[ext];
  if (!allowed) return { ok: false, error: `File type not allowed (${ext || "unknown"})` };
  if (ext === ".zip" && !allowZip) {
    return { ok: false, error: "ZIP uploads only allowed for SCORM packages" };
  }
  const mime = (file.type || "").toLowerCase();
  // Browsers sometimes send empty type — allow if extension is known
  if (mime && !allowed.includes(mime) && mime !== "application/octet-stream") {
    return { ok: false, error: `MIME type not allowed (${mime})` };
  }
  return { ok: true, ext };
}
