"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { clearAuthTokens } from "@/lib/client-auth";

const links = [
  { href: "/studio", label: "Overview", exact: true },
  { href: "/studio/courses", label: "Courses" },
  { href: "/studio/quizzes", label: "Quizzes" },
  { href: "/studio/assignments", label: "Assignments" },
  { href: "/studio/exercises", label: "Exercises" },
  { href: "/studio/batches", label: "Batches" },
  { href: "/studio/gradebook", label: "Gradebook" },
  { href: "/studio/certificates", label: "Certificates" },
  { href: "/studio/programs", label: "Programs" },
  { href: "/studio/bulletin", label: "Bulletin" },
  { href: "/studio/users", label: "Users" },
  { href: "/studio/analytics", label: "Analytics" },
  { href: "/studio/evaluations", label: "Evaluations" },
  { href: "/studio/settings", label: "Settings" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 px-3 pb-6">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={onNavigate}
          className={cn(
            "rounded-lg px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-100 hover:text-blue-900",
            isActive(pathname, l.href, l.exact) && "bg-blue-50 font-medium text-blue-900"
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function StudioShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname() || "/studio";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const original = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
      original(input, {
        ...init,
        credentials: init?.credentials || "include",
      });
    return () => {
      window.fetch = original;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:h-screen lg:overflow-hidden">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-blue-100 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md p-2 text-blue-900 hover:bg-stone-100"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/studio" className="font-serif text-lg text-blue-900">
            Studio
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[10rem] truncate text-sm text-stone-600 sm:inline">
            {userName}
          </span>
          <a
            href="/api/auth/logout"
            onClick={(e) => {
              e.preventDefault();
              clearAuthTokens();
              window.location.assign("/api/auth/logout");
            }}
          >
            <Button variant="outline" size="sm">
              Log out
            </Button>
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-stone-200 bg-white lg:flex">
          <div className="shrink-0 border-b border-blue-100 px-4 py-4">
            <Link href="/" className="font-serif text-lg tracking-tight text-blue-900">
              Digital Penang <span className="text-blue-600">LMS</span>
            </Link>
            <p className="mt-0.5 text-xs text-stone-500">Studio · Instructor & admin</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pt-2">
            <NavLinks pathname={pathname} />
          </div>
          <div className="shrink-0 border-t border-stone-200 px-4 py-3">
            <p className="truncate text-sm font-medium text-stone-800">{userName}</p>
            <div className="mt-2 flex gap-2">
              <Link href="/" className="text-xs text-blue-700 hover:underline">
                View site
              </Link>
              <span className="text-stone-300">·</span>
              <a
                href="/api/auth/logout"
                className="text-xs text-stone-500 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  clearAuthTokens();
                  window.location.assign("/api/auth/logout");
                }}
              >
                Log out
              </a>
            </div>
          </div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-blue-100 px-4 py-4">
                <Link
                  href="/"
                  className="font-serif text-lg tracking-tight text-blue-900"
                  onClick={() => setOpen(false)}
                >
                  Digital Penang <span className="text-blue-600">LMS</span>
                </Link>
                <button
                  type="button"
                  className="rounded-md p-2 hover:bg-stone-100"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pt-2">
                <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
              </div>
            </aside>
          </div>
        )}

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
