import { Schema, models, model } from "mongoose";

export interface ISettings {
  siteName: string;
  tagline: string;
  logoUrl?: string;
  allowGuestAccess: boolean;
  allowSignup: boolean;
  primaryColor: string;
  zoomAccountId?: string;
  zoomClientId?: string;
  zoomClientSecret?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  enablePayments: boolean;
  /** @deprecated migrated to enableBulletin / enableJobs */
  enableJobBoard?: boolean;
  enableBulletin: boolean;
  enableJobs: boolean;
  /** One-time migration: public jobs default off */
  jobsDisabledDefaultApplied?: boolean;
  enablePrograms: boolean;
  enableDiscussions: boolean;
  enableEvaluations: boolean;
  resendApiKey?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  microsoftClientId?: string;
  microsoftClientSecret?: string;
  openaiApiKey?: string;
  minWatchPercent: number;
  minReadSeconds: number;
  minScormSeconds: number;
  defaultCertificateHtml: string;
}

const SettingsSchema = new Schema<ISettings>(
  {
    siteName: { type: String, default: "Digital Penang LMS" },
    tagline: {
      type: String,
      default: "One-stop learning platform for Digital Penang",
    },
    logoUrl: String,
    allowGuestAccess: { type: Boolean, default: true },
    allowSignup: { type: Boolean, default: true },
    primaryColor: { type: String, default: "#1D4ED8" },
    zoomAccountId: String,
    zoomClientId: String,
    zoomClientSecret: String,
    stripePublishableKey: String,
    stripeSecretKey: String,
    stripeWebhookSecret: String,
    enablePayments: { type: Boolean, default: false },
    enableJobBoard: { type: Boolean, default: false },
    enableBulletin: { type: Boolean, default: true },
    enableJobs: { type: Boolean, default: false },
    /** One-time flag: public job board forced off until admin re-enables */
    jobsDisabledDefaultApplied: { type: Boolean, default: false },
    enablePrograms: { type: Boolean, default: true },
    enableDiscussions: { type: Boolean, default: true },
    enableEvaluations: { type: Boolean, default: true },
    resendApiKey: String,
    googleClientId: String,
    googleClientSecret: String,
    microsoftClientId: String,
    microsoftClientSecret: String,
    openaiApiKey: String,
    minWatchPercent: { type: Number, default: 80 },
    minReadSeconds: { type: Number, default: 20 },
    minScormSeconds: { type: Number, default: 30 },
    defaultCertificateHtml: {
      type: String,
      default: `<div style="border:8px solid #1D4ED8;padding:48px;text-align:center;font-family:Georgia,serif">
  <h1>Certificate of Completion</h1>
  <p>This certifies that</p>
  <h2>{{recipientName}}</h2>
  <p>has successfully completed</p>
  <h3>{{courseTitle}}</h3>
  <p>Issued on {{issuedAt}} · No. {{certificateNumber}}</p>
</div>`,
    },
  },
  { timestamps: true }
);

export const Settings = models.Settings || model<ISettings>("Settings", SettingsSchema);

export async function getSettings() {
  let doc = await Settings.findOne();
  if (!doc) {
    doc = await Settings.create({});
  }
  // Migrate legacy enableJobBoard → enableBulletin once
  let dirty = false;
  if (doc.enableBulletin === undefined || doc.enableBulletin === null) {
    doc.enableBulletin = doc.enableJobBoard !== false;
    dirty = true;
  }
  // Public job board OFF by default; admin re-enables in Studio → Settings
  if (!doc.jobsDisabledDefaultApplied) {
    doc.enableJobs = false;
    doc.enableJobBoard = false;
    doc.jobsDisabledDefaultApplied = true;
    dirty = true;
  } else if (doc.enableJobs === undefined || doc.enableJobs === null) {
    doc.enableJobs = false;
    dirty = true;
  }
  if (doc.enableEvaluations === undefined || doc.enableEvaluations === null) {
    doc.enableEvaluations = true;
    dirty = true;
  }
  if (dirty) await doc.save();
  return doc;
}

export function publicSettings(settings: ISettings) {
  return {
    siteName: settings.siteName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl,
    allowGuestAccess: settings.allowGuestAccess,
    allowSignup: settings.allowSignup,
    primaryColor: settings.primaryColor,
    enablePayments: settings.enablePayments,
    enableBulletin: settings.enableBulletin ?? true,
    enableJobs: settings.enableJobs === true,
    enablePrograms: settings.enablePrograms,
    enableDiscussions: settings.enableDiscussions,
    enableEvaluations: settings.enableEvaluations !== false,
    hasGoogleOAuth: !!(settings.googleClientId || process.env.GOOGLE_CLIENT_ID),
    hasMicrosoftOAuth: !!(settings.microsoftClientId || process.env.MICROSOFT_CLIENT_ID),
    minWatchPercent: settings.minWatchPercent ?? 80,
    minReadSeconds: settings.minReadSeconds ?? 20,
    minScormSeconds: settings.minScormSeconds ?? 30,
    stripePublishableKey:
      settings.stripePublishableKey || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  };
}

export function adminSettingsView(settings: ISettings) {
  const mask = (v?: string) => (v ? "••••••••" : "");
  return {
    ...publicSettings(settings),
    zoomAccountId: settings.zoomAccountId || "",
    zoomClientId: settings.zoomClientId || "",
    zoomClientSecret: settings.zoomClientSecret ? mask(settings.zoomClientSecret) : "",
    stripePublishableKey: settings.stripePublishableKey || "",
    stripeSecretKey: settings.stripeSecretKey ? mask(settings.stripeSecretKey) : "",
    stripeWebhookSecret: settings.stripeWebhookSecret
      ? mask(settings.stripeWebhookSecret)
      : "",
    defaultCertificateHtml: settings.defaultCertificateHtml,
    googleClientId: settings.googleClientId || process.env.GOOGLE_CLIENT_ID || "",
    microsoftClientId: settings.microsoftClientId || process.env.MICROSOFT_CLIENT_ID || "",
    resendApiKey: settings.resendApiKey ? "••••••••" : "",
    openaiApiKey: settings.openaiApiKey ? "••••••••" : "",
    _hasZoomSecret: !!settings.zoomClientSecret,
    _hasStripeSecret: !!settings.stripeSecretKey,
    _hasStripeWebhook: !!settings.stripeWebhookSecret,
    _hasResendKey: !!(settings.resendApiKey || process.env.RESEND_API_KEY),
    _hasOpenaiKey: !!(settings.openaiApiKey || process.env.OPENAI_API_KEY),
    _hasGoogleSecret: !!(settings.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET),
    _hasMicrosoftSecret: !!(
      settings.microsoftClientSecret || process.env.MICROSOFT_CLIENT_SECRET
    ),
  };
}
