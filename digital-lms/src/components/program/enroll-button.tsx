"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ProgramEnrollButton({ programId }: { programId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function enroll() {
    const res = await fetch(`/api/programs/${programId}/enroll`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <Button onClick={enroll}>Enroll in program</Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
