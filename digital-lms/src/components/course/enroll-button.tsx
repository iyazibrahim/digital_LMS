"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function EnrollButton({
  courseId,
  paid,
  price,
  currency,
}: {
  courseId: string;
  paid: boolean;
  price: number;
  currency: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function goLogin() {
    router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
  }

  async function enroll() {
    setLoading(true);
    setError("");
    if (paid) {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "course", targetId: courseId }),
        credentials: "same-origin",
      });
      const data = await res.json();
      setLoading(false);
      if (res.status === 401) {
        goLogin();
        return;
      }
      if (!res.ok) {
        setError(data.error || "Payment unavailable");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    }

    const res = await fetch(`/api/courses/${courseId}/enroll`, {
      method: "POST",
      credentials: "same-origin",
    });
    const data = await res.json();
    setLoading(false);
    if (res.status === 401) {
      goLogin();
      return;
    }
    if (!res.ok) {
      setError(data.error || "Could not enroll");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={enroll} disabled={loading}>
        {loading ? "Please wait…" : paid ? `Enroll · ${currency} ${price}` : "Enroll for free"}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
