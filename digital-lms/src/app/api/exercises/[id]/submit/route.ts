import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  ProgrammingExercise,
  ProgrammingSubmission,
} from "@/models/ProgrammingExercise";
import { requireSession, jsonError } from "@/lib/auth";

/** Simple local runner: compare printed/returned string against expected for demo parity */
function runSimple(code: string, input: string, language: string): string {
  // For v1 without Piston: if code contains expected pattern via console.log simulation
  // Evaluate only safe string-output exercises by extracting final return/print literal.
  try {
    if (language === "javascript" || language === "js") {
       
      const fn = new Function(
        "input",
        `${code}\n; if (typeof solve === 'function') return String(solve(input)); if (typeof main === 'function') return String(main(input)); return '';`
      );
      return String(fn(input)).trim();
    }
  } catch {
    return "";
  }
  // Fallback: treat entire trimmed code output marker // OUTPUT: value
  const m = code.match(/OUTPUT:\s*(.+)/i);
  if (m) return m[1].trim();
  // Or if input unused, use last quoted string in code
  const quotes = [...code.matchAll(/["'`](.+?)["'`]/g)].map((x) => x[1]);
  return quotes.length ? quotes[quotes.length - 1] : "";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await req.json();
    await connectDB();
    const exercise = await ProgrammingExercise.findById(id);
    if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const results = exercise.testCases.map(
      (tc: { input: string; expectedOutput: string }) => {
        const actual = runSimple(
          body.code || "",
          tc.input,
          body.language || exercise.language
        );
        const expected = String(tc.expectedOutput).trim();
        return {
          input: tc.input,
          expected,
          actual,
          passed: actual === expected,
        };
      }
    );
    const passed = results.every((r: { passed: boolean }) => r.passed);

    const submission = await ProgrammingSubmission.create({
      exerciseId: id,
      userId: session.sub,
      code: body.code,
      language: body.language || exercise.language,
      passed,
      results,
    });

    return NextResponse.json({
      passed,
      results,
      submissionId: submission._id,
    });
  } catch (err) {
    return jsonError(err);
  }
}
