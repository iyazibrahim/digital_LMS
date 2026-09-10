import { Schema, models, model, Types } from "mongoose";

export interface ICoupon {
  _id: Types.ObjectId;
  code: string;
  percentOff: number;
  amountOff: number;
  currency: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date;
  active: boolean;
  applicableTo: "all" | "course" | "batch";
  itemIds: Types.ObjectId[];
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    percentOff: { type: Number, default: 0 },
    amountOff: { type: Number, default: 0 },
    currency: { type: String, default: "MYR" },
    maxUses: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    expiresAt: Date,
    active: { type: Boolean, default: true },
    applicableTo: {
      type: String,
      enum: ["all", "course", "batch"],
      default: "all",
    },
    itemIds: [{ type: Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

export const Coupon = models.Coupon || model<ICoupon>("Coupon", CouponSchema);

export interface IPayment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  provider: "stripe" | "manual";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  targetType: "course" | "batch" | "certificate";
  targetId: Types.ObjectId;
  couponCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "MYR" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    provider: { type: String, enum: ["stripe", "manual"], default: "stripe" },
    stripeSessionId: String,
    stripePaymentIntentId: String,
    targetType: {
      type: String,
      enum: ["course", "batch", "certificate"],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    couponCode: String,
  },
  { timestamps: true }
);

export const Payment = models.Payment || model<IPayment>("Payment", PaymentSchema);
