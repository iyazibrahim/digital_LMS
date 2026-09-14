import { Schema, models, model, Types } from "mongoose";

export interface IAssignment {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  dueAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    description: String,
    allowedFileTypes: {
      type: [String],
      default: [".pdf", ".doc", ".docx", ".zip", ".png", ".jpg"],
    },
    maxFileSizeMb: { type: Number, default: 20 },
    dueAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Assignment =
  models.Assignment || model<IAssignment>("Assignment", AssignmentSchema);

export interface IAssignmentSubmission {
  _id: Types.ObjectId;
  assignmentId: Types.ObjectId;
  userId: Types.ObjectId;
  courseId?: Types.ObjectId;
  lessonId?: Types.ObjectId;
  fileUrl: string;
  fileName: string;
  notes?: string;
  status: "submitted" | "passed" | "failed" | "revision";
  grade?: number;
  feedback?: string;
  gradedBy?: Types.ObjectId;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    lessonId: Schema.Types.ObjectId,
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    notes: String,
    status: {
      type: String,
      enum: ["submitted", "passed", "failed", "revision"],
      default: "submitted",
    },
    grade: Number,
    feedback: String,
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
    gradedAt: Date,
  },
  { timestamps: true }
);

export const AssignmentSubmission =
  models.AssignmentSubmission ||
  model<IAssignmentSubmission>("AssignmentSubmission", AssignmentSubmissionSchema);
