import Link from "next/link";
import { getSession } from "@/lib/auth";
import { isStaff } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/courses", label: "Courses" },
  { href: "/batches", label: "Batches" },
  { href: "/programs", label: "Programs" },
  { href: "/jobs", label: "Jobs" },
];

export async function SiteHeader() {
  const session = await getSession();
  const staff = isStaff(session?.roles);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#F7F4EF]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-serif text-xl tracking-tight text-teal-900">
            Digital Penang <span className="text-teal-600">LMS</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-stone-600 md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-teal-800">
                {item.label}
              </Link>
            ))}
            {staff && (
              <Link href="/studio" className="font-medium text-teal-800 hover:text-teal-950">
                Studio
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  {session.name}
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
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Digital Penang LMS</p>
        <p>Structured learning · Live batches · Certificates · Careers</p>
      </div>
    </footer>
  );
}
