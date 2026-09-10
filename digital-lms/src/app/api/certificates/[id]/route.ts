import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Certificate } from "@/models/Certificate";
import { getSettings } from "@/models/Settings";
import { jsonError } from "@/lib/auth";
import { renderCertificateHtml } from "@/lib/progress";
import { formatDate } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const cert = await Certificate.findById(id).lean();
    if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const settings = await getSettings();
    const html = renderCertificateHtml(settings.defaultCertificateHtml, {
      recipientName: cert.recipientName,
      courseTitle: cert.courseTitle,
      issuedAt: formatDate(cert.issuedAt),
      certificateNumber: cert.certificateNumber,
    });
    return NextResponse.json({ certificate: cert, html });
  } catch (err) {
    return jsonError(err);
  }
}
