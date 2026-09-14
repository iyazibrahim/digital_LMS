import { Schema, models, model, Types } from "mongoose";

export interface IBatchForumReply {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  body: string;
  createdAt: Date;
}

export interface IBatchForumThread {
  _id: Types.ObjectId;
  batchId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  body: string;
  replies: IBatchForumReply[];
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IBatchForumReply>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const BatchForumThreadSchema = new Schema<IBatchForumThread>(
  {
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    replies: { type: [ReplySchema], default: [] },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BatchForumThread =
  models.BatchForumThread ||
  model<IBatchForumThread>("BatchForumThread", BatchForumThreadSchema);
