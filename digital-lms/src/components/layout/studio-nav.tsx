import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/courses", label: "Courses" },
  { href: "/studio/quizzes", label: "Quizzes" },
  { href: "/studio/assignments", label: "Assignments" },
  { href: "/studio/exercises", label: "Exercises" },
  { href: "/studio/batches", label: "Batches" },
  { href: "/studio/gradebook", label: "Gradebook" },
  { href: "/studio/certificates", label: "Certificates" },
  { href: "/studio/programs", label: "Programs" },
  { href: "/studio/bulletin", label: "Bulletin" },
  { href: "/studio/jobs", label: "Jobs" },
  { href: "/studio/coupons", label: "Coupons" },
  { href: "/studio/users", label: "Users" },
  { href: "/studio/analytics", label: "Analytics" },
  { href: "/studio/evaluations", label: "Evaluations" },
  { href: "/studio/settings", label: "Settings" },
];

export function StudioNav({ pathname }: { pathname?: string }) {
  return (
    <aside className="w-56 shrink-0 border-r border-stone-200 bg-white">
      <div className="p-4">
        <Link href="/" className="font-serif text-lg text-blue-900">
          Studio
        </Link>
        <p className="text-xs text-stone-500">Instructor & admin console</p>
      </div>
      <nav className="flex flex-col gap-0.5 px-2 pb-6">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 hover:text-blue-900",
              (pathname === l.href ||
                (l.href !== "/studio" && pathname?.startsWith(l.href))) &&
                "bg-blue-50 font-medium text-blue-900"
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
