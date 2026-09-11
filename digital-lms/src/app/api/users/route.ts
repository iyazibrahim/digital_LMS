import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { requireSession, jsonError, hashPassword, AuthError } from "@/lib/auth";
import { Role, ROLES } from "@/lib/constants";
import { parsePageParams } from "@/lib/paginate";
import { generateTempPassword } from "@/lib/temp-password";

const createSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  roles: z.array(z.enum(ROLES)).optional(),
});

function isDuplicateKey(err: unknown) {
  return typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000;
}

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

export async function POST(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const body = createSchema.parse(await req.json());
    const email = body.email.toLowerCase();
    const exists = await User.findOne({ email });
    if (exists) throw new AuthError("Email already registered", 409);

    const roles = (body.roles?.length ? body.roles : ["student"]) as Role[];
    const uniqueRoles = [...new Set(roles)];
    const temporaryPassword = generateTempPassword();

    const user = await User.create({
      name: body.name,
      email,
      passwordHash: await hashPassword(temporaryPassword),
      roles: uniqueRoles,
      mustChangePassword: true,
      isActive: true,
    });

    return NextResponse.json({
      temporaryPassword,
      user: {
        _id: String(user._id),
        name: user.name,
        email: user.email,
        roles: user.roles,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    if (isDuplicateKey(err)) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const body = await req.json();
    const roles = (body.roles || []).filter((r: string) => ROLES.includes(r as Role));
    if (!roles.length) {
      throw new AuthError("User must keep at least one role", 400);
    }
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
