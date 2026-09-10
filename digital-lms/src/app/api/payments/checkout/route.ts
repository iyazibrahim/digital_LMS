import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { Batch } from "@/models/Batch";
import { Payment, Coupon } from "@/models/Payment";
import { getSettings } from "@/models/Settings";
import { requireSession, jsonError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    await connectDB();
    const body = await req.json();
    const settings = await getSettings();
    const secret =
      process.env.STRIPE_SECRET_KEY || settings.stripeSecretKey || "";
    if (!secret) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured. Set STRIPE_SECRET_KEY or add it in Studio → Settings. For free enrollments, disable paid on the course/batch.",
        },
        { status: 503 }
      );
    }

    let amount = 0;
    let currency = "myr";
    let name = "LMS purchase";

    if (body.targetType === "course") {
      const course = await Course.findById(body.targetId);
      if (!course?.paid) {
        return NextResponse.json({ error: "Course is free" }, { status: 400 });
      }
      amount = Math.round(course.price * 100);
      currency = (course.currency || "MYR").toLowerCase();
      name = course.title;
    } else if (body.targetType === "batch") {
      const batch = await Batch.findById(body.targetId);
      if (!batch?.paid) {
        return NextResponse.json({ error: "Batch is free" }, { status: 400 });
      }
      amount = Math.round(batch.price * 100);
      currency = (batch.currency || "MYR").toLowerCase();
      name = batch.title;
    } else {
      return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    if (body.couponCode) {
      const coupon = await Coupon.findOne({
        code: String(body.couponCode).toUpperCase(),
        active: true,
      });
      if (coupon) {
        if (coupon.percentOff) amount = Math.round(amount * (1 - coupon.percentOff / 100));
        if (coupon.amountOff) amount = Math.max(0, amount - Math.round(coupon.amountOff * 100));
      }
    }

    const stripe = new Stripe(secret);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const payment = await Payment.create({
      userId: session.sub,
      amount: amount / 100,
      currency: currency.toUpperCase(),
      status: "pending",
      provider: "stripe",
      targetType: body.targetType,
      targetId: body.targetId,
      couponCode: body.couponCode,
    });

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: { name },
          },
        },
      ],
      success_url: `${appUrl}/profile?paid=1`,
      cancel_url: `${appUrl}/profile?paid=0`,
      metadata: {
        paymentId: String(payment._id),
        userId: session.sub,
        targetType: body.targetType,
        targetId: String(body.targetId),
      },
    });

    payment.stripeSessionId = checkout.id;
    await payment.save();

    return NextResponse.json({ url: checkout.url, paymentId: payment._id });
  } catch (err) {
    return jsonError(err);
  }
}
