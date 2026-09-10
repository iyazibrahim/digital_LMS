"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeleteResourceButton({
  endpoint,
  confirmMessage = "Delete this item?",
  label = "Delete",
}: {
  endpoint: string;
  confirmMessage?: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!confirm(confirmMessage)) return;
    setBusy(true);
    const res = await fetch(endpoint, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Delete failed");
      return;
    }
    router.refresh();
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="text-red-700"
      disabled={busy}
      onClick={onClick}
    >
      {busy ? "…" : label}
    </Button>
  );
}
