import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Batch, BatchEnrollment } from "@/models/Batch";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { notifyMany } from "@/lib/notify";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const batch = await Batch.findById(id);
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    batch.announcements.unshift({
      title: body.title,
      body: body.body,
      createdBy: session.sub as never,
    } as never);
    await batch.save();

    const ens = await BatchEnrollment.find({ batchId: id, status: "active" })
      .select("userId")
      .lean();
    await notifyMany(
      ens.map((e) => e.userId),
      {
        type: "announcement",
        title: `Batch announcement: ${body.title}`,
        body: String(body.body || "").slice(0, 500),
        href: `/batches/${batch.slug}`,
        email: true,
      }
    );

    return NextResponse.json(batch);
  } catch (err) {
    return jsonError(err);
  }
}
