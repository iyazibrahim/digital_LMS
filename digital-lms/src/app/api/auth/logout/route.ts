import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}

export async function GET() {
  const res = NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  );
  clearAuthCookies(res);
  return res;
}
