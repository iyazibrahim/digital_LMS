import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireSession, jsonError } from "@/lib/auth";
import { Role, ROLES } from "@/lib/constants";
import { parsePageParams } from "@/lib/paginate";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "instructor"]);
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip } = parsePageParams(searchParams);
    const q = (searchParams.get("q") || "").trim();
    const filter: Record<string, unknown> = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      User.countDocuments(filter),
    ]);
    return NextResponse.json({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
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
