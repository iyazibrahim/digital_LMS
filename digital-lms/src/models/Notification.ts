import { Schema, models, model, Types } from "mongoose";

export type NotificationType =
  | "enrollment"
  | "live_class"
  | "assignment_graded"
  | "evaluation"
  | "certificate"
  | "announcement"
  | "password_reset"
  | "at_risk"
  | "general";

export interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  readAt?: Date;
  emailSent: boolean;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "enrollment",
        "live_class",
        "assignment_graded",
        "evaluation",
        "certificate",
        "announcement",
        "password_reset",
        "at_risk",
        "general",
      ],
      default: "general",
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    href: String,
    readAt: Date,
    emailSent: { type: Boolean, default: false },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });

export const Notification =
  models.Notification || model<INotification>("Notification", NotificationSchema);
