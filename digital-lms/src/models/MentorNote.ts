import { Schema, models, model, Types } from "mongoose";

export interface IMentorNote {
  _id: Types.ObjectId;
  mentorId: Types.ObjectId;
  menteeId: Types.ObjectId;
  batchId?: Types.ObjectId;
  courseId?: Types.ObjectId;
  title?: string;
  body: string;
  visibility: "private" | "shared";
  createdAt: Date;
  updatedAt: Date;
}

const MentorNoteSchema = new Schema<IMentorNote>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    menteeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch" },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    title: String,
    body: { type: String, required: true },
    visibility: { type: String, enum: ["private", "shared"], default: "private" },
  },
  { timestamps: true }
);

MentorNoteSchema.index({ mentorId: 1, menteeId: 1, createdAt: -1 });

export const MentorNote =
  models.MentorNote || model<IMentorNote>("MentorNote", MentorNoteSchema);
