import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession, safeNextPath } from "@/lib/auth";
import { isStaff } from "@/lib/constants";
import { getAllowSignup } from "@/lib/public-access";
import LoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next, "/");
  const session = await getSession();
  const allowSignup = await getAllowSignup();

  // Already signed in — never show the login form
  if (session) {
    if (next.startsWith("/studio")) {
      redirect(isStaff(session.roles) ? next : "/");
    }
    redirect(next === "/login" ? "/" : next);
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center text-stone-500">Loading…</div>
      }
    >
      <LoginForm defaultNext={next} allowSignup={allowSignup} />
    </Suspense>
  );
}
