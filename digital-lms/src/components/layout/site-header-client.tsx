"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearAuthTokens } from "@/lib/client-auth";

const nav = [
  { href: "/courses", label: "Courses" },
  { href: "/batches", label: "Batches" },
  { href: "/programs", label: "Programs" },
  { href: "/bulletin", label: "Bulletin" },
];

export function SiteHeaderClient({
  sessionName,
  staff,
}: {
  sessionName?: string;
  staff?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(sessionName);
  const [isStaffUser, setIsStaffUser] = useState(!!staff);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (cancelled) return;
        if (r.ok && data.user) {
          setName(data.user.name);
          setIsStaffUser(!!data.user.isStaff);
        } else {
          setName(undefined);
          setIsStaffUser(false);
        }
      })
      .catch(() => {
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
            {isStaffUser && (
              <Link href="/studio" className="font-medium text-blue-800 hover:text-blue-950">
                Studio
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
            {name ? (
              <Link
                href="/evaluations"
                className="hidden text-sm text-stone-600 hover:text-blue-800 sm:inline"
              >
                Evaluations
              </Link>
            ) : null}
            {name ? (
            <>
              <Link href="/profile" className="hidden sm:inline">
                <Button variant="ghost" size="sm">
                  {name}
                </Button>
              </Link>
              <a
                href="/api/auth/logout"
                onClick={onLogoutClick}
              >
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
            {name && (
              <Link
                href="/evaluations"
                className="rounded-lg px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
                onClick={() => setOpen(false)}
              >
                Evaluations
              </Link>
            )}
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
