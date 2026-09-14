import { Types } from "mongoose";
import { Program, ProgramMember } from "@/models/Program";
import { Enrollment } from "@/models/Enrollment";

/**
 * If the learner is in a program with enforceOrder, ensure all prior courses
 * in that program are completed before allowing access to this course.
 */
export async function assertProgramOrder(
  userId: string,
  courseId: string
): Promise<{ ok: true } | { ok: false; message: string; blockedBy?: string }> {
  const memberships = await ProgramMember.find({ userId }).lean();
  if (!memberships.length) return { ok: true };

  for (const m of memberships) {
    const program = await Program.findById(m.programId).lean();
    if (!program?.enforceOrder || !program.courseIds?.length) continue;

    const ids = program.courseIds.map((id) => String(id));
    const idx = ids.indexOf(String(courseId));
    if (idx <= 0) continue;

    for (let i = 0; i < idx; i++) {
      const priorId = ids[i];
      const en = await Enrollment.findOne({
        userId,
        courseId: new Types.ObjectId(priorId),
      }).lean();
      if (!en?.completed) {
        return {
          ok: false,
          message: `Complete the previous course in "${program.title}" before continuing.`,
          blockedBy: priorId,
        };
      }
    }
  }

  return { ok: true };
}
