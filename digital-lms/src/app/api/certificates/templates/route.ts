import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CertificateTemplate } from "@/models/Certificate";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";
import { DEFAULT_CERT_CSS, DEFAULT_CERT_HTML } from "@/lib/certificate-defaults";

export async function GET() {
  try {
    await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const templates = await CertificateTemplate.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ templates });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = await req.json();
    if (body.isDefault) {
      await CertificateTemplate.updateMany({}, { $set: { isDefault: false } });
    }
    const template = await CertificateTemplate.create({
      name: body.name || "Certificate template",
      html: body.html || DEFAULT_CERT_HTML,
      css: body.css || DEFAULT_CERT_CSS,
      backgroundImageUrl: body.backgroundImageUrl || "",
      widthPx: body.widthPx || 1000,
      heightPx: body.heightPx || 700,
      isDefault: !!body.isDefault,
      createdBy: session.sub,
    });
    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
