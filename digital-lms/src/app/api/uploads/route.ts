import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { requireSession, jsonError } from "@/lib/auth";
import {
  ensureUploadsRoot,
  sanitizeFileName,
  validateUploadFile,
  UPLOADS_ROOT,
} from "@/lib/uploads";

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const check = validateUploadFile(file, { allowZip: false });
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const safe = sanitizeFileName(file.name);
    const name = `${Date.now()}-${safe}`;
    await ensureUploadsRoot();
    await writeFile(path.join(UPLOADS_ROOT, name), bytes);
    return NextResponse.json({ url: `/uploads/${name}`, fileName: file.name });
  } catch (err) {
    return jsonError(err);
  }
}
