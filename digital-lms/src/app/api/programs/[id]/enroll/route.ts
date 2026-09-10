import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Program, ProgramMember } from "@/models/Program";
import { Enrollment } from "@/models/Enrollment";
import { requireSession, jsonError } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await connectDB();
    const program = await Program.findById(id);
    if (!program || !program.published) {
      return NextResponse.json({ error: "Not available" }, { status: 404 });
    }
    let member = await ProgramMember.findOne({ programId: id, userId: session.sub });
    if (!member) {
      member = await ProgramMember.create({ programId: id, userId: session.sub });
      for (const courseId of program.courseIds) {
        const exists = await Enrollment.findOne({ userId: session.sub, courseId });
        if (!exists) {
          await Enrollment.create({
            userId: session.sub,
            courseId,
            source: "self",
          });
        }
      }
    }
    return NextResponse.json(member);
  } catch (err) {
    return jsonError(err);
  }
}
