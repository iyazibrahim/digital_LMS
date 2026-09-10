import { headers } from "next/headers";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";

/** Server chrome — Studio pages render without marketing header/footer. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  const isStudio = pathname.startsWith("/studio");

  if (isStudio) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
