import { Schema, models, model, Types } from "mongoose";

export interface IDiscussionReply {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  body: string;
  createdAt: Date;
}

export interface IDiscussionThread {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  body: string;
  replies: IDiscussionReply[];
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IDiscussionReply>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const DiscussionThreadSchema = new Schema<IDiscussionThread>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lessonId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    replies: { type: [ReplySchema], default: [] },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

DiscussionThreadSchema.index({ courseId: 1, lessonId: 1 });

export const DiscussionThread =
  models.DiscussionThread ||
  model<IDiscussionThread>("DiscussionThread", DiscussionThreadSchema);
