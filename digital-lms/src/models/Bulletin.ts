import { Schema, models, model, Types } from "mongoose";

export interface IBulletin {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  coverImageUrl?: string;
  status: "draft" | "published";
  authorId: Types.ObjectId;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BulletinSchema = new Schema<IBulletin>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: String,
    body: { type: String, required: true },
    coverImageUrl: String,
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: Date,
  },
  { timestamps: true }
);

BulletinSchema.index({ status: 1, publishedAt: -1 });

export const Bulletin = models.Bulletin || model<IBulletin>("Bulletin", BulletinSchema);
