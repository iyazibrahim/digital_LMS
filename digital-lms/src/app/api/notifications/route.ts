import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { requireSession, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const unreadOnly = req.nextUrl.searchParams.get("unread") === "1";
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 30), 100);
    const filter: Record<string, unknown> = { userId: session.sub };
    if (unreadOnly) filter.readAt = { $exists: false };

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ userId: session.sub, readAt: { $exists: false } }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const body = await req.json();
    if (body.markAllRead) {
      await Notification.updateMany(
        { userId: session.sub, readAt: { $exists: false } },
        { $set: { readAt: new Date() } }
      );
      return NextResponse.json({ ok: true });
    }
    if (body.id) {
      await Notification.updateOne(
        { _id: body.id, userId: session.sub },
        { $set: { readAt: new Date() } }
      );
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "id or markAllRead required" }, { status: 400 });
  } catch (err) {
    return jsonError(err);
  }
}
