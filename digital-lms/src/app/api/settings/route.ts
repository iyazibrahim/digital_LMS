import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  getSettings,
  publicSettings,
  adminSettingsView,
  type ISettings,
} from "@/models/Settings";
import { requireSession, jsonError, getSession } from "@/lib/auth";

const ALLOWED_PATCH = [
  "siteName",
  "tagline",
  "logoUrl",
  "allowGuestAccess",
  "allowSignup",
  "primaryColor",
  "zoomAccountId",
  "zoomClientId",
  "zoomClientSecret",
  "stripePublishableKey",
  "stripeSecretKey",
  "stripeWebhookSecret",
  "enablePayments",
  "enableBulletin",
  "enableJobs",
  "enablePrograms",
  "enableDiscussions",
  "enableEvaluations",
  "resendApiKey",
  "googleClientId",
  "googleClientSecret",
  "microsoftClientId",
  "microsoftClientSecret",
  "openaiApiKey",
  "minWatchPercent",
  "minReadSeconds",
  "minScormSeconds",
  "defaultCertificateHtml",
] as const;

type PatchKey = (typeof ALLOWED_PATCH)[number];

const SECRET_FIELDS = new Set<PatchKey>([
  "zoomClientSecret",
  "stripeSecretKey",
  "stripeWebhookSecret",
  "resendApiKey",
  "googleClientSecret",
  "microsoftClientSecret",
  "openaiApiKey",
]);

export async function GET() {
  try {
    await connectDB();
    const settings = await getSettings();
    const session = await getSession();
    const admin = session?.roles?.includes("admin");
    if (!admin) {
      return NextResponse.json({ settings: publicSettings(settings) });
    }
    return NextResponse.json({ settings: adminSettingsView(settings) });
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

    for (const key of ALLOWED_PATCH) {
      if (!(key in body)) continue;
      const val = body[key];
      if (SECRET_FIELDS.has(key)) {
        if (typeof val !== "string" || !val || val.includes("•")) continue;
        settings.set(key, val);
        continue;
      }
      settings.set(key, val as ISettings[typeof key]);
    }

    if ("enableBulletin" in body) {
      settings.enableJobBoard = !!settings.enableBulletin || !!settings.enableJobs;
    }
    if ("enableJobs" in body) {
      settings.enableJobBoard = !!settings.enableBulletin || !!settings.enableJobs;
    }

    await settings.save();
    return NextResponse.json({ settings: adminSettingsView(settings) });
  } catch (err) {
    return jsonError(err);
  }
}
