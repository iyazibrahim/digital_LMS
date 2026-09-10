"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BatchEnrollButton({ batchId, paid }: { batchId: string; paid: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function enroll() {
    setLoading(true);
    setError("");
    if (paid) {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "batch", targetId: batchId }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error || "Payment unavailable");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    }
    const res = await fetch(`/api/batches/${batchId}/enroll`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not enroll");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <Button onClick={enroll} disabled={loading}>
        {loading ? "Enrolling…" : "Join this batch"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
