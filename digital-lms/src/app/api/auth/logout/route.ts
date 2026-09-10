import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}

export async function GET() {
  // #region agent log
  const payload = {sessionId:'900175',runId:'post-fix',hypothesisId:'A',location:'logout/route.ts:GET',message:'logout GET hit',data:{appUrl:process.env.NEXT_PUBLIC_APP_URL||'unset'},timestamp:Date.now()};
  fetch('http://127.0.0.1:7694/ingest/5a6a4c95-e3c7-440d-8a72-c416ea345cfb',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'900175'},body:JSON.stringify(payload)}).catch(()=>{});
  try {
    const { appendFileSync } = await import("fs");
    const { join } = await import("path");
    appendFileSync(join(process.cwd(), "..", "debug-900175.log"), JSON.stringify(payload) + "\n");
  } catch { /* production / no file */ }
  // #endregion
  const res = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  );
  clearAuthCookies(res);
  return res;
}
