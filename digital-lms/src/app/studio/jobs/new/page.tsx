"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewJobPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    companyName: "",
    location: "",
    country: "Malaysia",
    type: "full_time",
    description: "",
    requirements: "",
    salaryRange: "",
    applicationUrl: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    router.push(`/studio/jobs/${data.job._id}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-serif text-3xl text-teal-950">Post a job</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="full_time">Full time</option>
                  <option value="part_time">Part time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea
                value={form.requirements}
                onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Salary range</Label>
              <Input
                value={form.salaryRange}
                onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Posting…" : "Post job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
