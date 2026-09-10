import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/models/Payment";
import { requireSession, jsonError } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const body = await req.json();
    const coupon = await Coupon.create({
      ...body,
      code: String(body.code || "").toUpperCase(),
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
