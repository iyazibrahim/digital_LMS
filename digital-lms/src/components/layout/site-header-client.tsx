"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAuthTokens } from "@/lib/client-auth";
import { NotificationBell } from "@/components/layout/notification-bell";

const publicNavBase = [
  { href: "/courses", label: "Courses" },
  { href: "/batches", label: "Batches" },
  { href: "/programs", label: "Programs" },
  { href: "/bulletin", label: "Bulletin" },
];

export function SiteHeaderClient({
  sessionName,
  staff,
  allowSignup = true,
  enableJobs = false,
}: {
  sessionName?: string;
  staff?: boolean;
  allowSignup?: boolean;
  enableJobs?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(sessionName);
  const [isStaffUser, setIsStaffUser] = useState(!!staff);
  const [jobsEnabled, setJobsEnabled] = useState(enableJobs);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetch("/api/auth/me", { credentials: "include", cache: "no-store" }).then(async (r) => {
        const data = await r.json();
        if (cancelled) return;
        if (r.ok && data.user) {
          setName(data.user.name);
          setIsStaffUser(!!data.user.isStaff);
        } else {
          setName(undefined);
          setIsStaffUser(false);
        }
      }),
      fetch("/api/settings", { credentials: "include", cache: "no-store" }).then(async (r) => {
        const data = await r.json();
        if (cancelled) return;
        if (r.ok && data.settings) {
          setJobsEnabled(data.settings.enableJobs === true);
        }
      }),
    ]).catch(() => {
      /* keep SSR values */
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function onLogoutClick(e: React.MouseEvent) {
    e.preventDefault();
    clearAuthTokens();
    setName(undefined);
    setIsStaffUser(false);
    // Hard navigation so logout Set-Cookie + redirect fully apply (Next Link soft-nav skips this)
    window.location.assign("/api/auth/logout");
  }

  const publicNav = jobsEnabled
    ? [
        ...publicNavBase.slice(0, 3),
        { href: "/jobs", label: "Jobs" },
        ...publicNavBase.slice(3),
      ]
    : publicNavBase;

  const nav = name
    ? [
        { href: "/dashboard", label: "My Learning" },
        ...publicNav,
        { href: "/calendar", label: "Calendar" },
        { href: "/evaluations", label: "Evaluations" },
      ]
    : publicNav;

  return (
    <header className="sticky top-0 z-40 border-b border-blue-100 bg-white/95 backdrop-blur">
      <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="rounded-md p-2 text-blue-900 hover:bg-stone-100 lg:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/" className="shrink-0 font-serif text-xl tracking-tight text-blue-900">
          Digital Penang <span className="text-blue-600">LMS</span>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center gap-6 text-sm text-stone-600 lg:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-blue-800">
              {item.label}
            </Link>
          ))}
          {isStaffUser && (
            <Link href="/studio" className="whitespace-nowrap font-medium text-blue-800 hover:text-blue-950">
              Studio
            </Link>
          )}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {name ? (
            <>
              <NotificationBell />
              <Link
                href="/profile"
                title={name}
                aria-label={`${name} profile`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-800 hover:bg-blue-100"
              >
                <User className="h-4 w-4" aria-hidden />
              </Link>
              <a href="/api/auth/logout" onClick={onLogoutClick}>
                <Button variant="outline" size="sm" type="button">
                  Log out
                </Button>
              </a>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              {allowSignup ? (
                <Link href="/register">
                  <Button size="sm">Get started</Button>
                </Link>
              ) : null}
            </>
          )}
        </div>
      </div>
      {open && (
        <nav className="border-t border-blue-50 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
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
            {name && (
              <Link
                href="/profile"
                className="rounded-lg px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
            )}
            {isStaffUser && (
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
