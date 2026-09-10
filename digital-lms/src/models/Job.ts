import { Schema, models, model, Types } from "mongoose";

export interface IJob {
  _id: Types.ObjectId;
  title: string;
  companyName: string;
  location?: string;
  country?: string;
  type: "full_time" | "part_time" | "contract" | "internship" | "remote";
  description: string;
  requirements?: string;
  salaryRange?: string;
  applicationUrl?: string;
  status: "open" | "closed";
  postedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    companyName: { type: String, required: true },
    location: String,
    country: String,
    type: {
      type: String,
      enum: ["full_time", "part_time", "contract", "internship", "remote"],
      default: "full_time",
    },
    description: { type: String, required: true },
    requirements: String,
    salaryRange: String,
    applicationUrl: String,
    status: { type: String, enum: ["open", "closed"], default: "open" },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Job = models.Job || model<IJob>("Job", JobSchema);

export interface IJobApplication {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  userId: Types.ObjectId;
  resumeUrl?: string;
  coverLetter?: string;
  status: "applied" | "reviewed" | "shortlisted" | "rejected" | "hired";
  createdAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resumeUrl: String,
    coverLetter: String,
    status: {
      type: String,
      enum: ["applied", "reviewed", "shortlisted", "rejected", "hired"],
      default: "applied",
    },
  },
  { timestamps: true }
);

JobApplicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

export const JobApplication =
  models.JobApplication || model<IJobApplication>("JobApplication", JobApplicationSchema);
