import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Certificate } from "@/models/Certificate";
import { requireSession, jsonError } from "@/lib/auth";
import { isStaff, STAFF_ROLES } from "@/lib/constants";
import { issueCertificate } from "@/lib/progress";

export async function GET() {
  try {
    const session = await requireSession();
    await connectDB();

    const filter = isStaff(session.roles) ? {} : { userId: session.sub };

    const certificates = await Certificate.find(filter)
      .populate("userId", "name email")
      .populate("courseId", "title slug")
      .populate("batchId", "title slug")
      .sort({ issuedAt: -1 })
      .lean();

    return NextResponse.json({ certificates });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(STAFF_ROLES);
    const body = await req.json();
    await connectDB();
    const cert = await issueCertificate(body.userId, body.courseId, body.batchId);
    return NextResponse.json({ certificate: cert }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
