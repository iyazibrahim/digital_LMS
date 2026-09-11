import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { getSessionFromRequest } from "@/lib/auth";
import { contentTypeFor, resolveUploadPath } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path: parts } = await params;
  if (!parts?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const abs = resolveUploadPath(parts);
  if (!abs) return NextResponse.json({ error: "Invalid path" }, { status: 400 });

  try {
    const st = await stat(abs);
    if (!st.isFile()) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const stream = createReadStream(abs);
    const webStream = Readable.toWeb(stream) as ReadableStream;
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": contentTypeFor(abs),
        "Content-Length": String(st.size),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
