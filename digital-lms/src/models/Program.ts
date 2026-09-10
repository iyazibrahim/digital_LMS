import { Schema, models, model, Types } from "mongoose";

export interface IProgram {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  courseIds: Types.ObjectId[];
  enforceOrder: boolean;
  published: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    coverImage: String,
    courseIds: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    enforceOrder: { type: Boolean, default: true },
    published: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Program = models.Program || model<IProgram>("Program", ProgramSchema);

export interface IProgramMember {
  _id: Types.ObjectId;
  programId: Types.ObjectId;
  userId: Types.ObjectId;
  progressPercent: number;
  createdAt: Date;
}

const ProgramMemberSchema = new Schema<IProgramMember>(
  {
    programId: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    progressPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProgramMemberSchema.index({ programId: 1, userId: 1 }, { unique: true });

export const ProgramMember =
  models.ProgramMember || model<IProgramMember>("ProgramMember", ProgramMemberSchema);
