import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Certificate } from "@/models/Certificate";
import { getSessionFromRequest, jsonError, AuthError } from "@/lib/auth";
import { getCertificateRenderSource, renderCertificateHtml } from "@/lib/progress";
import { formatDate } from "@/lib/utils";
import { isStaff } from "@/lib/constants";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) throw new AuthError("Unauthorized", 401);

    const { id } = await params;
    await connectDB();
    const cert = await Certificate.findById(id).lean();
    if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!isStaff(session.roles) && String(cert.userId) !== session.sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const source = await getCertificateRenderSource(cert.templateId?.toString());
    const html = renderCertificateHtml(
      source.html,
      {
        recipientName: cert.recipientName,
        courseTitle: cert.courseTitle,
        issuedAt: formatDate(cert.issuedAt),
        certificateNumber: cert.certificateNumber,
        backgroundImageUrl: source.backgroundImageUrl,
      },
      source.css || ""
    );
    return NextResponse.json({ certificate: cert, html });
  } catch (err) {
    return jsonError(err);
  }
}
