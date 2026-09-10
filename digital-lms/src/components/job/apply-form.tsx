"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function JobApplyForm({ jobId }: { jobId: string }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/jobs/${jobId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter, resumeUrl }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Application failed");
      return;
    }
    setMessage(data.alreadyApplied ? "You already applied." : "Application submitted.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Apply</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Cover letter</Label>
            <Textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Resume URL</Label>
            <Input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} />
          </div>
          {message && <p className="text-sm text-blue-800">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
