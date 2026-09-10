import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import { Payment } from "@/models/Payment";
import { Course } from "@/models/Course";
import { Batch, BatchEnrollment } from "@/models/Batch";
import { Enrollment } from "@/models/Enrollment";
import { getSettings } from "@/models/Settings";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  await connectDB();
  const settings = await getSettings();
  const secret = process.env.STRIPE_SECRET_KEY || settings.stripeSecretKey || "";
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET || settings.stripeWebhookSecret || "";

  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.paymentId;
    if (paymentId) {
      const payment = await Payment.findById(paymentId);
      if (payment && payment.status !== "paid") {
        payment.status = "paid";
        payment.stripePaymentIntentId = String(session.payment_intent || "");
        await payment.save();

        if (payment.targetType === "course") {
          const exists = await Enrollment.findOne({
            userId: payment.userId,
            courseId: payment.targetId,
          });
          if (!exists) {
            await Enrollment.create({
              userId: payment.userId,
              courseId: payment.targetId,
              source: "payment",
            });
            await Course.findByIdAndUpdate(payment.targetId, {
              $inc: { enrolledCount: 1 },
            });
          }
        } else if (payment.targetType === "batch") {
          const batch = await Batch.findById(payment.targetId);
          if (batch) {
            const exists = await BatchEnrollment.findOne({
              batchId: batch._id,
              userId: payment.userId,
            });
            if (!exists) {
              await BatchEnrollment.create({
                batchId: batch._id,
                userId: payment.userId,
              });
              batch.enrolledCount += 1;
              await batch.save();
              for (const courseId of batch.courseIds) {
                const e = await Enrollment.findOne({
                  userId: payment.userId,
                  courseId,
                });
                if (!e) {
                  await Enrollment.create({
                    userId: payment.userId,
                    courseId,
                    source: "payment",
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
