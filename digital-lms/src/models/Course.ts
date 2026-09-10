import { Schema, models, model, Types } from "mongoose";

export interface ILesson {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  content: Record<string, unknown> | null;
  contentHtml?: string;
  videoUrl?: string;
  pdfUrl?: string;
  quizId?: Types.ObjectId | null;
  assignmentId?: Types.ObjectId | null;
  programmingExerciseId?: Types.ObjectId | null;
  durationMinutes?: number;
  order: number;
  isPreview: boolean;
}

export interface IChapter {
  _id: Types.ObjectId;
  title: string;
  order: number;
  isScorm: boolean;
  scormPackageUrl?: string;
  scormLaunchPath?: string;
  lessons: ILesson[];
}

export interface ICourse {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  shortIntroduction?: string;
  description?: string;
  coverImage?: string;
  previewVideo?: string;
  category?: string;
  tags: string[];
  published: boolean;
  publishedAt?: Date;
  instructors: Types.ObjectId[];
  relatedCourseIds: Types.ObjectId[];
  chapters: IChapter[];
  enableCertification: boolean;
  paid: boolean;
  price: number;
  currency: string;
  createdBy: Types.ObjectId;
  enrolledCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    content: { type: Schema.Types.Mixed, default: null },
    contentHtml: String,
    videoUrl: String,
    pdfUrl: String,
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", default: null },
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", default: null },
    programmingExerciseId: {
      type: Schema.Types.ObjectId,
      ref: "ProgrammingExercise",
      default: null,
    },
    durationMinutes: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
  },
  { _id: true }
);

const ChapterSchema = new Schema<IChapter>(
  {
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    isScorm: { type: Boolean, default: false },
    scormPackageUrl: String,
    scormLaunchPath: String,
    lessons: { type: [LessonSchema], default: [] },
  },
  { _id: true }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortIntroduction: String,
    description: String,
    coverImage: String,
    previewVideo: String,
    category: String,
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: false },
    publishedAt: Date,
    instructors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    relatedCourseIds: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    chapters: { type: [ChapterSchema], default: [] },
    enableCertification: { type: Boolean, default: true },
    paid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "MYR" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    enrolledCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CourseSchema.index({ published: 1, category: 1 });
CourseSchema.index({ title: "text", description: "text", tags: "text" });

export const Course = models.Course || model<ICourse>("Course", CourseSchema);
