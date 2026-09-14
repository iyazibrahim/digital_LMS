import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Job } from "@/models/Job";
import { getSettings } from "@/models/Settings";
import { getSession, requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();
    const staff = session?.roles?.some((r) => PRIVILEGED_ROLES.includes(r));
    if (!staff) {
      const settings = await getSettings();
      if (settings.enableJobs !== true) {
        return NextResponse.json({ jobs: [], disabled: true });
      }
    }
    const jobs = await Job.find(staff ? {} : { status: "open" })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ jobs });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = await req.json();
    const job = await Job.create({ ...body, postedBy: session.sub });
    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
