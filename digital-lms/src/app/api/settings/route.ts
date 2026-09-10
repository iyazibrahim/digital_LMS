import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getSettings } from "@/models/Settings";
import { requireSession, jsonError, getSession } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const settings = await getSettings();
    const session = await getSession();
    const admin = session?.roles?.includes("admin");
    if (!admin) {
      return NextResponse.json({
        siteName: settings.siteName,
        tagline: settings.tagline,
        logoUrl: settings.logoUrl,
        allowGuestAccess: settings.allowGuestAccess,
        allowSignup: settings.allowSignup,
        primaryColor: settings.primaryColor,
        enablePayments: settings.enablePayments,
        enableJobBoard: settings.enableJobBoard,
        enablePrograms: settings.enablePrograms,
        enableDiscussions: settings.enableDiscussions,
        stripePublishableKey:
          settings.stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      });
    }
    return NextResponse.json(settings);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireSession(["admin"]);
    await connectDB();
    const body = await req.json();
    const settings = await getSettings();
    Object.assign(settings, body);
    await settings.save();
    return NextResponse.json(settings);
  } catch (err) {
    return jsonError(err);
  }
}
