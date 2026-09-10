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
  enableJobBoard: boolean;
  enablePrograms: boolean;
  enableDiscussions: boolean;
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
    enableJobBoard: { type: Boolean, default: true },
    enablePrograms: { type: Boolean, default: true },
    enableDiscussions: { type: Boolean, default: true },
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
  return doc;
}
