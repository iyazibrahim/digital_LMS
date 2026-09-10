import { Schema, models, model, Types } from "mongoose";

export interface ILessonProgress {
  lessonId: Types.ObjectId;
  chapterId: Types.ObjectId;
  completed: boolean;
  completedAt?: Date;
  videoWatchSeconds: number;
  scormData?: Record<string, unknown>;
}

export interface IEnrollment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  progressPercent: number;
  completedLessonIds: Types.ObjectId[];
  lessonProgress: ILessonProgress[];
  completed: boolean;
  completedAt?: Date;
  certificateId?: Types.ObjectId | null;
  source: "self" | "batch" | "admin" | "payment";
  createdAt: Date;
  updatedAt: Date;
}

const LessonProgressSchema = new Schema<ILessonProgress>(
  {
    lessonId: { type: Schema.Types.ObjectId, required: true },
    chapterId: { type: Schema.Types.ObjectId, required: true },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    videoWatchSeconds: { type: Number, default: 0 },
    scormData: Schema.Types.Mixed,
  },
  { _id: false }
);

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    progressPercent: { type: Number, default: 0 },
    completedLessonIds: [{ type: Schema.Types.ObjectId }],
    lessonProgress: { type: [LessonProgressSchema], default: [] },
    completed: { type: Boolean, default: false },
    completedAt: Date,
    certificateId: { type: Schema.Types.ObjectId, ref: "Certificate", default: null },
    source: {
      type: String,
      enum: ["self", "batch", "admin", "payment"],
      default: "self",
    },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment =
  models.Enrollment || model<IEnrollment>("Enrollment", EnrollmentSchema);

export interface ICourseReview {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const CourseReviewSchema = new Schema<ICourseReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

CourseReviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CourseReview =
  models.CourseReview || model<ICourseReview>("CourseReview", CourseReviewSchema);
