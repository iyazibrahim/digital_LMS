import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireSession, jsonError } from "@/lib/auth";
import { Role, ROLES } from "@/lib/constants";

export async function GET() {
  try {
    await requireSession(["admin", "instructor"]);
    await connectDB();
    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
    return NextResponse.json({ users });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const body = await req.json();
    const roles = (body.roles || []).filter((r: string) => ROLES.includes(r as Role));
    const user = await User.findByIdAndUpdate(
      body.userId,
      {
        $set: {
          roles,
          isActive: body.isActive !== undefined ? body.isActive : true,
          name: body.name,
        },
      },
      { new: true }
    ).select("-passwordHash");
    return NextResponse.json(user);
  } catch (err) {
    return jsonError(err);
  }
}
