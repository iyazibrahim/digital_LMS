import { Schema, models, model, Types } from "mongoose";

export interface IBatchApplication {
  _id: Types.ObjectId;
  batchId: Types.ObjectId;
  userId: Types.ObjectId;
  motivation: string;
  startupName?: string;
  startupStage?: string;
  teamSize?: number;
  status: "pending" | "accepted" | "waitlisted" | "rejected";
  staffNotes?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BatchApplicationSchema = new Schema<IBatchApplication>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    motivation: { type: String, required: true },
    startupName: String,
    startupStage: String,
    teamSize: Number,
    status: {
      type: String,
      enum: ["pending", "accepted", "waitlisted", "rejected"],
      default: "pending",
    },
    staffNotes: String,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  { timestamps: true }
);

BatchApplicationSchema.index({ batchId: 1, userId: 1 }, { unique: true });

export const BatchApplication =
  models.BatchApplication ||
  model<IBatchApplication>("BatchApplication", BatchApplicationSchema);
