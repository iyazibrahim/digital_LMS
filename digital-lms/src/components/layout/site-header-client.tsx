"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/courses", label: "Courses" },
  { href: "/batches", label: "Batches" },
  { href: "/programs", label: "Programs" },
  { href: "/jobs", label: "Jobs" },
];

export function SiteHeaderClient({
  sessionName,
  staff,
}: {
  sessionName?: string;
  staff?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-blue-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3 md:gap-8">
          <button
            type="button"
            className="rounded-md p-2 text-blue-900 hover:bg-stone-100 md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/" className="font-serif text-xl tracking-tight text-blue-900">
            Digital Penang <span className="text-blue-600">LMS</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-stone-600 md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-blue-800">
                {item.label}
              </Link>
            ))}
            {staff && (
              <Link href="/studio" className="font-medium text-blue-800 hover:text-blue-950">
                Studio
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {sessionName ? (
            <>
              <Link href="/profile" className="hidden sm:inline">
                <Button variant="ghost" size="sm">
                  {sessionName}
                </Button>
              </Link>
              <Link href="/api/auth/logout">
                <Button variant="outline" size="sm" type="button">
                  Log out
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
      {open && (
        <nav className="border-t border-blue-50 bg-white px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {staff && (
              <Link
                href="/studio"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-blue-800 hover:bg-blue-50"
                onClick={() => setOpen(false)}
              >
                Studio
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
