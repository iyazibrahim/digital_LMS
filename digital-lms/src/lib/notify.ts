import { connectDB } from "@/lib/db";
import { Notification, type NotificationType } from "@/models/Notification";
import { User } from "@/models/User";
import { sendEmail, appBaseUrl } from "@/lib/email";
import { Types } from "mongoose";

export async function notifyUser(opts: {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  email?: boolean;
  meta?: Record<string, unknown>;
}) {
  await connectDB();
  const userId = String(opts.userId);
  const note = await Notification.create({
    userId,
    type: opts.type,
    title: opts.title,
    body: opts.body,
    href: opts.href,
    meta: opts.meta,
    emailSent: false,
  });

  if (opts.email !== false) {
    const user = await User.findById(userId).select("email name").lean();
    if (user?.email) {
      const link = opts.href ? `${appBaseUrl()}${opts.href}` : appBaseUrl();
      const result = await sendEmail({
        to: user.email,
        subject: opts.title,
        html: `<p>Hi ${user.name || "there"},</p><p>${opts.body}</p>${
          opts.href ? `<p><a href="${link}">Open in LMS</a></p>` : ""
        }<p>— Digital Penang LMS</p>`,
      });
      if (result.ok) {
        note.emailSent = true;
        await note.save();
      }
    }
  }

  return note;
}

export async function notifyMany(
  userIds: Array<string | Types.ObjectId>,
  opts: Omit<Parameters<typeof notifyUser>[0], "userId">
) {
  const unique = [...new Set(userIds.map(String))];
  const results: Awaited<ReturnType<typeof notifyUser>>[] = [];
  for (const id of unique) {
    results.push(await notifyUser({ ...opts, userId: id }));
  }
  return results;
}
