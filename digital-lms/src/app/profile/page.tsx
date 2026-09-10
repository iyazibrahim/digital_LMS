"use client";

import { Suspense } from "react";
import ProfilePageInner from "./profile-inner";

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-4xl px-4 py-10 text-stone-500">Loading…</p>}>
      <ProfilePageInner />
    </Suspense>
  );
}
