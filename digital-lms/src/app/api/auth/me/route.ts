import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  await connectDB();
  const user = await User.findById(session.sub).select("-passwordHash");
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}
