import { Schema, models, model, Types } from "mongoose";

export interface ITimetableItem {
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  legend?: string;
  description?: string;
}

export interface ILiveClass {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  startAt: Date;
  durationMinutes: number;
  meetingUrl?: string;
  zoomMeetingId?: string;
  provider: "zoom" | "google_meet" | "manual";
  /** @deprecated use attendance */
  attendees: Types.ObjectId[];
  attendance: {
    userId: Types.ObjectId;
    status: "present" | "absent" | "late" | "excused";
    markedAt: Date;
    markedBy?: Types.ObjectId;
  }[];
  createdBy: Types.ObjectId;
}

export interface IAnnouncement {
  _id: Types.ObjectId;
  title: string;
  body: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface IBatch {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description?: string;
  courseIds: Types.ObjectId[];
  startDate?: Date;
  endDate?: Date;
  seatCount: number;
  enrolledCount: number;
  published: boolean;
  paid: boolean;
  price: number;
  currency: string;
  requireApplication: boolean;
  timetable: ITimetableItem[];
  liveClasses: ILiveClass[];
  announcements: IAnnouncement[];
  instructors: Types.ObjectId[];
  evaluators: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSchema = new Schema<ITimetableItem>(
  {
    title: String,
    date: Date,
    startTime: String,
    endTime: String,
    legend: String,
    description: String,
  },
  { _id: false }
);

const LiveClassSchema = new Schema<ILiveClass>(
  {
    title: { type: String, required: true },
    description: String,
    startAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    meetingUrl: String,
    zoomMeetingId: String,
    provider: {
      type: String,
      enum: ["zoom", "google_meet", "manual"],
      default: "manual",
    },
    attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    attendance: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
          status: {
            type: String,
            enum: ["present", "absent", "late", "excused"],
            default: "present",
          },
          markedAt: { type: Date, default: Date.now },
          markedBy: { type: Schema.Types.ObjectId, ref: "User" },
        },
      ],
      default: [],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: true, timestamps: true }
);

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const BatchSchema = new Schema<IBatch>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    courseIds: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    startDate: Date,
    endDate: Date,
    seatCount: { type: Number, default: 30 },
    enrolledCount: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "MYR" },
    requireApplication: { type: Boolean, default: false },
    timetable: { type: [TimetableSchema], default: [] },
    liveClasses: { type: [LiveClassSchema], default: [] },
    announcements: { type: [AnnouncementSchema], default: [] },
    instructors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    evaluators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Batch = models.Batch || model<IBatch>("Batch", BatchSchema);

export interface IBatchEnrollment {
  _id: Types.ObjectId;
  batchId: Types.ObjectId;
  userId: Types.ObjectId;
  status: "active" | "completed" | "dropped";
  createdAt: Date;
}

const BatchEnrollmentSchema = new Schema<IBatchEnrollment>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

BatchEnrollmentSchema.index({ batchId: 1, userId: 1 }, { unique: true });

export const BatchEnrollment =
  models.BatchEnrollment || model<IBatchEnrollment>("BatchEnrollment", BatchEnrollmentSchema);
