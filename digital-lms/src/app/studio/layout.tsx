import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isStaff } from "@/lib/constants";
import { StudioShell } from "@/components/layout/studio-shell";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/studio");
  }

  if (!isStaff(session.roles)) {
    redirect("/");
  }

  return <StudioShell userName={session.name}>{children}</StudioShell>;
}
