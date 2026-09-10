"use client";

import { usePathname } from "next/navigation";
import { StudioNav } from "@/components/layout/studio-nav";

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <StudioNav pathname={pathname} />
      <div className="flex-1 overflow-auto bg-[#F7F4EF] p-6 md:p-8">{children}</div>
    </div>
  );
}
