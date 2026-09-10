import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isStaff } from "@/lib/constants";
import { StudioNav } from "@/components/layout/studio-nav";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !isStaff(session.roles)) {
    redirect("/login");
  }

  return (
    <div className="-mt-0 flex min-h-[calc(100vh-8rem)] border-t border-blue-100 bg-slate-50">
      <StudioNav />
      <div className="flex-1 overflow-auto p-6 bg-white">{children}</div>
    </div>
  );
}
