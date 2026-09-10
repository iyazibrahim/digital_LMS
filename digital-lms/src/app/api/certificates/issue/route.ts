import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireSession, jsonError, AuthError } from "@/lib/auth";
import { User } from "@/models/User";
import { Certificate } from "@/models/Certificate";
import { issueCertificate } from "@/lib/progress";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = await req.json();

    if (!body.userId || (!body.courseId && !body.courseTitle)) {
      throw new AuthError("userId and courseId (or courseTitle) are required", 400);
    }

    const user = await User.findById(body.userId);
    if (!user) throw new AuthError("User not found", 404);

    if (body.courseId) {
      const cert = await issueCertificate(body.userId, body.courseId, body.batchId);
      if (!cert.issuedBy) {
        cert.issuedBy = session.sub as never;
        await cert.save();
      }
      return NextResponse.json({ certificate: cert }, { status: 201 });
    }

    const certificateNumber = `DP-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const certificate = await Certificate.create({
      userId: body.userId,
      batchId: body.batchId,
      certificateNumber,
      recipientName: body.recipientName || user.name,
      courseTitle: body.courseTitle,
      issuedBy: session.sub,
      issuedAt: new Date(),
    });

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
