import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireSession, jsonError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const name = `${Date.now()}-${safe}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return NextResponse.json({ url: `/uploads/${name}`, fileName: file.name });
  } catch (err) {
    return jsonError(err);
  }
}
