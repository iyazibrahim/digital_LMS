import { Schema, models, model, Types } from "mongoose";

export interface ICertificateTemplate {
  _id: Types.ObjectId;
  name: string;
  html: string;
  css?: string;
  backgroundImageUrl?: string;
  widthPx: number;
  heightPx: number;
  isDefault: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateTemplateSchema = new Schema<ICertificateTemplate>(
  {
    name: { type: String, required: true },
    html: { type: String, required: true },
    css: { type: String, default: "" },
    backgroundImageUrl: String,
    widthPx: { type: Number, default: 1000 },
    heightPx: { type: Number, default: 700 },
    isDefault: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const CertificateTemplate =
  models.CertificateTemplate ||
  model<ICertificateTemplate>("CertificateTemplate", CertificateTemplateSchema);

export interface IBadge {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  imageUrl?: string;
  courseId?: Types.ObjectId;
  autoAwardOnCourseComplete: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema = new Schema<IBadge>(
  {
    name: { type: String, required: true },
    description: String,
    imageUrl: String,
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    autoAwardOnCourseComplete: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Badge = models.Badge || model<IBadge>("Badge", BadgeSchema);

export interface IUserBadge {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  badgeId: Types.ObjectId;
  courseId?: Types.ObjectId;
  awardedAt: Date;
}

const UserBadgeSchema = new Schema<IUserBadge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    badgeId: { type: Schema.Types.ObjectId, ref: "Badge", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    awardedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export const UserBadge =
  models.UserBadge || model<IUserBadge>("UserBadge", UserBadgeSchema);

export interface ICertificate {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId?: Types.ObjectId;
  batchId?: Types.ObjectId;
  templateId?: Types.ObjectId;
  certificateNumber: string;
  verificationCode?: string;
  issuedAt: Date;
  issuedBy?: Types.ObjectId;
  recipientName: string;
  courseTitle: string;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch" },
    templateId: { type: Schema.Types.ObjectId, ref: "CertificateTemplate" },
    certificateNumber: { type: String, required: true, unique: true },
    verificationCode: { type: String, unique: true, sparse: true, index: true },
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
    recipientName: { type: String, required: true },
    courseTitle: { type: String, required: true },
  },
  { timestamps: true }
);

export const Certificate =
  models.Certificate || model<ICertificate>("Certificate", CertificateSchema);

export interface IEvaluatorSlot {
  _id: Types.ObjectId;
  evaluatorId: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  isBooked: boolean;
  bookedBy?: Types.ObjectId;
  courseId?: Types.ObjectId;
  batchId?: Types.ObjectId;
  notes?: string;
}

const EvaluatorSlotSchema = new Schema<IEvaluatorSlot>(
  {
    evaluatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    isBooked: { type: Boolean, default: false },
    bookedBy: { type: Schema.Types.ObjectId, ref: "User" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch" },
    notes: String,
  },
  { timestamps: true }
);

export const EvaluatorSlot =
  models.EvaluatorSlot || model<IEvaluatorSlot>("EvaluatorSlot", EvaluatorSlotSchema);

export interface IEvaluationRequest {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId?: Types.ObjectId;
  batchId?: Types.ObjectId;
  slotId?: Types.ObjectId;
  status: "pending" | "scheduled" | "passed" | "failed" | "cancelled";
  notes?: string;
  evaluatedBy?: Types.ObjectId;
  evaluatedAt?: Date;
}

const EvaluationRequestSchema = new Schema<IEvaluationRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch" },
    slotId: { type: Schema.Types.ObjectId, ref: "EvaluatorSlot" },
    status: {
      type: String,
      enum: ["pending", "scheduled", "passed", "failed", "cancelled"],
      default: "pending",
    },
    notes: String,
    evaluatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    evaluatedAt: Date,
  },
  { timestamps: true }
);

export const EvaluationRequest =
  models.EvaluationRequest ||
  model<IEvaluationRequest>("EvaluationRequest", EvaluationRequestSchema);
