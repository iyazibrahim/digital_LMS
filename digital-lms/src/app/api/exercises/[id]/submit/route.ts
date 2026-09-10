import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  ProgrammingExercise,
  ProgrammingSubmission,
} from "@/models/ProgrammingExercise";
import { requireSession, jsonError } from "@/lib/auth";

/** Simple local runner: compare printed/returned string against expected for demo parity */
function runSimple(code: string, input: string, language: string): string {
  try {
    if (language === "javascript" || language === "js") {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        "input",
        `${code}\n; if (typeof solve === 'function') return String(solve(input)); if (typeof main === 'function') return String(main(input)); return '';`
      );
      return String(fn(input)).trim();
    }
  } catch {
    return "";
  }
  const m = code.match(/OUTPUT:\s*(.+)/i);
  if (m) return m[1].trim();
  const quotes = [...code.matchAll(/["'`](.+?)["'`]/g)].map((x) => x[1]);
  return quotes.length ? quotes[quotes.length - 1] : "";
}

function normalizeAnswer(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
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

    const kind = exercise.kind || "coding";

    if (kind === "short_answer") {
      const answer = String(body.answerText || "").trim();
      const expected = exercise.expectedAnswers || [];
      const passed =
        expected.length === 0
          ? !!answer
          : expected.some((a) => normalizeAnswer(a) === normalizeAnswer(answer));
      const submission = await ProgrammingSubmission.create({
        exerciseId: id,
        userId: session.sub,
        code: "",
        language: "text",
        answerText: answer,
        passed,
        results: [
          {
            input: "",
            expected: expected.join(" | ") || "(any non-empty)",
            actual: answer,
            passed,
          },
        ],
      });
      return NextResponse.json({
        passed,
        message: passed ? "Correct" : "Incorrect answer",
        results: submission.results,
        submissionId: submission._id,
      });
    }

    if (kind === "written") {
      const answer = String(body.answerText || "").trim();
      if (!answer) {
        return NextResponse.json({ error: "Answer required" }, { status: 400 });
      }
      const submission = await ProgrammingSubmission.create({
        exerciseId: id,
        userId: session.sub,
        code: "",
        language: "text",
        answerText: answer,
        passed: true,
        results: [],
      });
      return NextResponse.json({
        passed: true,
        message: "Written response submitted",
        submissionId: submission._id,
      });
    }

    if (kind === "file") {
      const fileUrl = String(body.fileUrl || "").trim();
      if (!fileUrl) {
        return NextResponse.json({ error: "File required" }, { status: 400 });
      }
      const submission = await ProgrammingSubmission.create({
        exerciseId: id,
        userId: session.sub,
        code: "",
        language: "file",
        fileUrl,
        passed: true,
        results: [],
      });
      return NextResponse.json({
        passed: true,
        message: "File submitted",
        submissionId: submission._id,
      });
    }

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
    const passed = results.length ? results.every((r: { passed: boolean }) => r.passed) : false;

    const submission = await ProgrammingSubmission.create({
      exerciseId: id,
      userId: session.sub,
      code: body.code || "",
      language: body.language || exercise.language,
      passed,
      results,
    });

    return NextResponse.json({
      passed,
      message: passed ? "All tests passed" : "Some tests failed",
      results,
      submissionId: submission._id,
    });
  } catch (err) {
    return jsonError(err);
  }
}
