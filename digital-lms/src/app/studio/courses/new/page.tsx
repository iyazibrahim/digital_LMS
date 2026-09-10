"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    shortIntroduction: "",
    description: "",
    category: "",
    paid: false,
    price: 0,
    published: false,
  });
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    router.push(`/studio/courses/${data._id}`);
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Create course</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Short introduction</Label>
            <Input
              value={form.shortIntroduction}
              onChange={(e) => setForm({ ...form, shortIntroduction: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.paid}
                onChange={(e) => setForm({ ...form, paid: e.target.checked })}
              />
              Paid
            </label>
            {form.paid && (
              <Input
                type="number"
                className="w-32"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Publish
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Create</Button>
        </form>
      </CardContent>
    </Card>
  );
}
