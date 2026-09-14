"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";

export function BatchEnrollButton({
  batchId,
  paid,
  requireApplication,
}: {
  batchId: string;
  paid: boolean;
  requireApplication?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [apply, setApply] = useState({
    motivation: "",
    startupName: "",
    startupStage: "",
    teamSize: "",
  });
  const [applyMsg, setApplyMsg] = useState("");

  async function enroll() {
    setLoading(true);
    setError("");
    if (requireApplication) {
      setShowApply(true);
      setLoading(false);
      return;
    }
    if (paid) {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "batch", targetId: batchId }),
        credentials: "same-origin",
      });
      const data = await res.json();
      setLoading(false);
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
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
    const res = await fetch(`/api/batches/${batchId}/enroll`, {
      method: "POST",
      credentials: "same-origin",
    });
    const data = await res.json();
    setLoading(false);
    if (res.status === 401) {
      router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }
    if (!res.ok) {
      if (data.requireApplication) setShowApply(true);
      setError(data.error || "Could not enroll");
      return;
    }
    router.refresh();
  }

  async function submitApply(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setApplyMsg("");
    const res = await fetch(`/api/batches/${batchId}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        motivation: apply.motivation,
        startupName: apply.startupName,
        startupStage: apply.startupStage,
        teamSize: apply.teamSize ? Number(apply.teamSize) : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.status === 401) {
      router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
      return;
    }
    if (!res.ok) {
      setError(data.error || "Application failed");
      return;
    }
    setApplyMsg("Application submitted. Staff will review it.");
    setShowApply(false);
  }

  return (
    <div className="space-y-3">
      <Button onClick={enroll} disabled={loading}>
        {loading
          ? "Working…"
          : requireApplication
            ? "Apply to this cohort"
            : "Join this batch"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {applyMsg && <p className="text-sm text-blue-800">{applyMsg}</p>}
      {showApply && (
        <form onSubmit={submitApply} className="max-w-md space-y-2 rounded-xl border border-stone-200 p-4">
          <Label>Why do you want to join? (min 20 chars)</Label>
          <Textarea
            value={apply.motivation}
            onChange={(e) => setApply({ ...apply, motivation: e.target.value })}
            required
            minLength={20}
          />
          <Input
            placeholder="Startup name"
            value={apply.startupName}
            onChange={(e) => setApply({ ...apply, startupName: e.target.value })}
          />
          <Input
            placeholder="Stage (idea / MVP / growth)"
            value={apply.startupStage}
            onChange={(e) => setApply({ ...apply, startupStage: e.target.value })}
          />
          <Input
            placeholder="Team size"
            type="number"
            value={apply.teamSize}
            onChange={(e) => setApply({ ...apply, teamSize: e.target.value })}
          />
          <Button type="submit" size="sm" disabled={loading}>
            Submit application
          </Button>
        </form>
      )}
    </div>
  );
}
