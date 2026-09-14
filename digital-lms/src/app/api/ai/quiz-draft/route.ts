import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/models/Settings";
import { requireSession, jsonError } from "@/lib/auth";
import { PRIVILEGED_ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Draft quiz questions from a topic/lesson text.
 * Uses OpenAI when configured; otherwise returns a heuristic template for human edit.
 */
export async function POST(req: NextRequest) {
  try {
    await requireSession(PRIVILEGED_ROLES);
    await connectDB();
    const body = z
      .object({
        topic: z.string().min(3),
        content: z.string().optional(),
        count: z.number().min(1).max(20).optional(),
      })
      .parse(await req.json());

    const count = body.count || 5;
    const settings = await getSettings();
    const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            temperature: 0.4,
            messages: [
              {
                role: "system",
                content:
                  "You draft LMS quiz questions. Return ONLY valid JSON: {\"questions\":[{\"type\":\"single\"|\"multiple\"|\"open\",\"prompt\":string,\"options\":[{\"text\":string,\"isCorrect\":boolean}],\"points\":number}]}. For open type, options may be []. Always include human-reviewable content; never invent unsafe content.",
              },
              {
                role: "user",
                content: `Create ${count} quiz questions about: ${body.topic}\n\nContext:\n${(
                  body.content || ""
                ).slice(0, 6000)}`,
              },
            ],
          }),
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({
            questions: parsed.questions || [],
            source: "openai",
            reviewRequired: true,
          });
        }
      } catch (err) {
        console.error("[ai-quiz]", err);
      }
    }

    // Heuristic fallback — instructor must edit
    const questions = Array.from({ length: count }).map((_, i) => ({
      type: i % 3 === 2 ? "open" : "single",
      prompt: `Draft Q${i + 1}: What is an important concept in "${body.topic}"? (edit me)`,
      options:
        i % 3 === 2
          ? []
          : [
              { text: "Correct answer (edit)", isCorrect: true },
              { text: "Distractor A (edit)", isCorrect: false },
              { text: "Distractor B (edit)", isCorrect: false },
              { text: "Distractor C (edit)", isCorrect: false },
            ],
      points: 1,
    }));

    return NextResponse.json({
      questions,
      source: "template",
      reviewRequired: true,
      message: apiKey
        ? "AI response could not be parsed; returning editable templates."
        : "No OpenAI key configured — returning editable templates. Set OPENAI_API_KEY or Studio Settings.",
    });
  } catch (err) {
    return jsonError(err);
  }
}
