import Link from "next/link";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Batch } from "@/models/Batch";
import { Certificate } from "@/models/Certificate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function StudioHomePage() {
  await connectDB();
  const [users, courses, enrollments, completions, batches, certificates] =
    await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ completed: true }),
      Batch.countDocuments(),
      Certificate.countDocuments(),
    ]);

  const stats = [
    { label: "Users", value: users, href: "/studio/users" },
    { label: "Courses", value: courses, href: "/studio/courses" },
    { label: "Enrollments", value: enrollments, href: "/studio/analytics" },
    { label: "Completions", value: completions, href: "/studio/analytics" },
    { label: "Batches", value: batches, href: "/studio/batches" },
    { label: "Certificates", value: certificates, href: "/studio/certificates" },
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl">Studio overview</h1>
      <p className="mt-1 text-stone-600">Manage learning across Digital Penang LMS.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:border-blue-300">
              <CardHeader>
                <CardTitle className="text-sm text-stone-500">{s.label}</CardTitle>
              </CardHeader>
              <CardContent className="font-serif text-3xl">{s.value}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
