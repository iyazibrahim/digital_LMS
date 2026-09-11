import { getSession } from "@/lib/auth";
import { isStaff } from "@/lib/constants";
import { getAllowSignup } from "@/lib/public-access";
import { SiteHeaderClient } from "@/components/layout/site-header-client";

export async function SiteHeader() {
  const session = await getSession();
  const staff = isStaff(session?.roles);
  const allowSignup = await getAllowSignup();

  return (
    <SiteHeaderClient sessionName={session?.name} staff={staff} allowSignup={allowSignup} />
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Digital Penang LMS</p>
        <p>Courses · Live batches · Certificates · Careers</p>
      </div>
    </footer>
  );
}
