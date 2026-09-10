import { Schema, models, model, Types } from "mongoose";

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface IProgrammingExercise {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  language: string;
  starterCode?: string;
  testCases: ITestCase[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema<ITestCase>(
  {
    input: { type: String, default: "" },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const ProgrammingExerciseSchema = new Schema<IProgrammingExercise>(
  {
    title: { type: String, required: true },
    description: String,
    language: { type: String, default: "python" },
    starterCode: String,
    testCases: { type: [TestCaseSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const ProgrammingExercise =
  models.ProgrammingExercise ||
  model<IProgrammingExercise>("ProgrammingExercise", ProgrammingExerciseSchema);

export interface IProgrammingSubmission {
  _id: Types.ObjectId;
  exerciseId: Types.ObjectId;
  userId: Types.ObjectId;
  code: string;
  language: string;
  passed: boolean;
  results: { input: string; expected: string; actual: string; passed: boolean }[];
  createdAt: Date;
}

const ProgrammingSubmissionSchema = new Schema<IProgrammingSubmission>(
  {
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "ProgrammingExercise",
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    passed: { type: Boolean, default: false },
    results: {
      type: [
        {
          input: String,
          expected: String,
          actual: String,
          passed: Boolean,
        },
      ],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ProgrammingSubmission =
  models.ProgrammingSubmission ||
  model<IProgrammingSubmission>("ProgrammingSubmission", ProgrammingSubmissionSchema);
