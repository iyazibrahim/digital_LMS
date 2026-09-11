import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, readdir, readFile, stat } from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import {
  UPLOADS_ROOT,
  MAX_SCORM_BYTES,
  ensureUploadsRoot,
  sanitizeFileName,
  resolveUploadPath,
} from "@/lib/uploads";

async function findHtml(dir: string): Promise<string | null> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const found = await findHtml(full);
      if (found) return found;
    } else if (/\.(html?|htm)$/i.test(e.name) && e.name.toLowerCase() !== "imsmanifest.xml") {
      return full;
    }
  }
  return null;
}

async function resolveLaunch(extractDir: string, publicBase: string): Promise<string> {
  try {
    const manifestPath = path.join(extractDir, "imsmanifest.xml");
    const st = await stat(manifestPath).catch(() => null);
    if (st?.isFile()) {
      const xml = await readFile(manifestPath, "utf8");
      const hrefMatch =
        xml.match(/<resource[^>]*href=["']([^"']+)["']/i) ||
        xml.match(/href=["']([^"']+\.html?)["']/i);
      if (hrefMatch?.[1]) {
        const href = hrefMatch[1].replace(/^\.\//, "");
        return `${publicBase}/${href}`.replace(/\\/g, "/");
      }
    }
  } catch {
    /* fall through */
  }

  const html = await findHtml(extractDir);
  if (html) {
    const rel = path.relative(extractDir, html).replace(/\\/g, "/");
    return `${publicBase}/${rel}`;
  }
  return `${publicBase}/package.zip`;
}

/** Extract zip entries only under extractDir (zip-slip safe). */
async function extractZipSafe(bytes: Buffer, extractDir: string) {
  const zip = new AdmZip(bytes);
  const root = path.resolve(extractDir);
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.replace(/^[/\\]+/, "").replace(/\\/g, "/");
    if (!name || name.split("/").some((p) => p === ".." || p === "")) {
      throw new Error(`Unsafe zip entry: ${entry.entryName}`);
    }
    const dest = path.resolve(extractDir, name);
    if (!dest.startsWith(root + path.sep)) {
      throw new Error(`Zip path traversal blocked: ${entry.entryName}`);
    }
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, entry.getData());
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".zip")) {
      return NextResponse.json({ error: "SCORM package must be a .zip file" }, { status: 400 });
    }
    if (file.size > MAX_SCORM_BYTES) {
      return NextResponse.json({ error: "SCORM package too large (max 50MB)" }, { status: 400 });
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const publicBase = `/uploads/scorm/${id}`;
    const extractDir = path.join(UPLOADS_ROOT, "scorm", id);
    if (!resolveUploadPath(["scorm", id])) {
      return NextResponse.json({ error: "Invalid package path" }, { status: 400 });
    }
    await ensureUploadsRoot();
    await mkdir(extractDir, { recursive: true });

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(extractDir, sanitizeFileName("package.zip")), bytes);

    try {
      await extractZipSafe(bytes, extractDir);
    } catch (zipErr) {
      console.error("[scorm/packages] zip extract", zipErr);
      return NextResponse.json({ error: "Invalid or unsafe SCORM zip" }, { status: 400 });
    }

    const launchPath = await resolveLaunch(extractDir, publicBase);

    return NextResponse.json({
      packageUrl: `${publicBase}/package.zip`,
      launchPath,
      id,
    });
  } catch (err) {
    console.error("[scorm/packages]", err);
    return jsonError(err);
  }
}
