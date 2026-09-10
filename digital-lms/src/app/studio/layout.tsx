import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isStaff } from "@/lib/constants";
import { StudioShell } from "@/components/layout/studio-shell";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const h = await headers();
  const path = h.get("x-pathname") || "/studio";
  const nextPath = path.startsWith("/studio") ? path : "/studio";

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!isStaff(session.roles)) {
    redirect("/?error=studio-forbidden");
  }

  return <StudioShell userName={session.name}>{children}</StudioShell>;
}
