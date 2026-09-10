import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Award, Briefcase, Video, Layers } from "lucide-react";

const pillars = [
  {
    icon: Layers,
    title: "One-stop learning platform",
    body: "Create courses, manage users, run assessments, and host live sessions all in one place.",
  },
  {
    icon: BookOpen,
    title: "Structured learning journeys",
    body: "Organize content into chapters and lessons for a clean, step-by-step experience.",
  },
  {
    icon: Video,
    title: "Support for all content types",
    body: "Use videos, PDFs, quizzes, SCORM packages, and assignments to create rich courses.",
  },
  {
    icon: Users,
    title: "Live batches and sessions",
    body: "Schedule instructor-led live sessions with batch-wise access and learner tracking.",
  },
  {
    icon: Award,
    title: "Certifications",
    body: "Award certificates automatically when learners complete courses or evaluations.",
  },
  {
    icon: Briefcase,
    title: "Job board",
    body: "Help learners turn skills into career opportunities with a built-in opportunities board.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-stone-200">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(29,78,216,0.12),_transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Digital Penang
            </p>
            <h1 className="font-serif text-4xl leading-tight text-stone-900 md:text-5xl">
              Learn, teach, and grow on Digital Penang LMS.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-stone-600">
              Courses, live batches, quizzes, SCORM packages, certificates, and a job board — in one
              modern learning platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses">
                <Button size="lg">Browse courses</Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline">
                  Create free account
                </Button>
              </Link>
            </div>
          </div>
          <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/40">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Built for Penang learners</CardTitle>
              <CardDescription>
                Self-paced courses and instructor-led cohorts in one clean experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-stone-600">
              <p>✓ Course → Chapter → Lesson hierarchy</p>
              <p>✓ Quizzes, assignments, and programming exercises</p>
              <p>✓ Zoom / Meet live classes with attendance</p>
              <p>✓ Auto certificates + career opportunities</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-serif text-3xl text-stone-900">What you can do</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => (
            <Card key={p.title}>
              <CardHeader>
                <p.icon className="mb-2 h-6 w-6 text-blue-700" />
                <CardTitle className="text-base">{p.title}</CardTitle>
                <CardDescription>{p.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
