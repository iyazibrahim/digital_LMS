import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CertificateTemplate } from "@/models/Certificate";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    await connectDB();
    const template = await CertificateTemplate.findById(id).lean();
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ template });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    if (body.isDefault) {
      await CertificateTemplate.updateMany(
        { _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }
    const template = await CertificateTemplate.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          html: body.html,
          css: body.css,
          backgroundImageUrl: body.backgroundImageUrl,
          widthPx: body.widthPx,
          heightPx: body.heightPx,
          isDefault: body.isDefault,
        },
      },
      { new: true }
    );
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ template });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession(["admin"]);
    const { id } = await params;
    await connectDB();
    await CertificateTemplate.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
