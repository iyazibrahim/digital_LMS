import { Schema, models, model, Types } from "mongoose";

export type QuestionType = "single" | "multiple" | "open";

export interface IQuizQuestion {
  _id: Types.ObjectId;
  type: QuestionType;
  prompt: string;
  options: { text: string; isCorrect: boolean }[];
  points: number;
  explanation?: string;
}

export interface IQuiz {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  questions: IQuizQuestion[];
  passingScore: number;
  maxAttempts: number;
  timeLimitMinutes?: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  enableProctoring: boolean;
  maxViolations: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuizQuestion>(
  {
    type: { type: String, enum: ["single", "multiple", "open"], required: true },
    prompt: { type: String, required: true },
    options: {
      type: [{ text: String, isCorrect: { type: Boolean, default: false } }],
      default: [],
    },
    points: { type: Number, default: 1 },
    explanation: String,
  },
  { _id: true }
);

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    description: String,
    questions: { type: [QuestionSchema], default: [] },
    passingScore: { type: Number, default: 70 },
    maxAttempts: { type: Number, default: 0 },
    timeLimitMinutes: Number,
    shuffleQuestions: { type: Boolean, default: false },
    showCorrectAnswers: { type: Boolean, default: true },
    enableProctoring: { type: Boolean, default: false },
    maxViolations: { type: Number, default: 3 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Quiz = models.Quiz || model<IQuiz>("Quiz", QuizSchema);

export interface IQuizAnswer {
  questionId: Types.ObjectId;
  selectedOptionIndexes: number[];
  openAnswer?: string;
  isCorrect?: boolean;
  pointsAwarded: number;
}

export interface IQuizSubmission {
  _id: Types.ObjectId;
  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  courseId?: Types.ObjectId;
  lessonId?: Types.ObjectId;
  answers: IQuizAnswer[];
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  violationCount: number;
  startedAt: Date;
  submittedAt: Date;
  autoSubmitted: boolean;
}

const QuizAnswerSchema = new Schema<IQuizAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    selectedOptionIndexes: { type: [Number], default: [] },
    openAnswer: String,
    isCorrect: Boolean,
    pointsAwarded: { type: Number, default: 0 },
  },
  { _id: false }
);

const QuizSubmissionSchema = new Schema<IQuizSubmission>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    lessonId: Schema.Types.ObjectId,
    answers: { type: [QuizAnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percent: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    violationCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: Date.now },
    autoSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const QuizSubmission =
  models.QuizSubmission || model<IQuizSubmission>("QuizSubmission", QuizSubmissionSchema);

export interface IQuizViolation {
  _id: Types.ObjectId;
  submissionId?: Types.ObjectId;
  quizId: Types.ObjectId;
  userId: Types.ObjectId;
  type: "tab_switch" | "webcam" | "fullscreen_exit" | "other";
  note?: string;
  snapshotUrl?: string;
  createdAt: Date;
}

const QuizViolationSchema = new Schema<IQuizViolation>(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: "QuizSubmission" },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["tab_switch", "webcam", "fullscreen_exit", "other"],
      required: true,
    },
    note: String,
    snapshotUrl: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const QuizViolation =
  models.QuizViolation || model<IQuizViolation>("QuizViolation", QuizViolationSchema);
