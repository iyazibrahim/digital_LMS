"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditBulletinPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch(`/api/bulletin/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d.post;
        if (!p) {
          setError(d.error || "Not found");
          return;
        }
        setTitle(p.title || "");
        setExcerpt(p.excerpt || "");
        setBody(p.body || "");
        setCoverImageUrl(p.coverImageUrl || "");
        setStatus(p.status || "draft");
        setReady(true);
      });
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch(`/api/bulletin/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, excerpt, body, coverImageUrl, status }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  if (!ready && !error) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl text-blue-950">Edit bulletin</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Content</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cover image URL</Label>
              <Input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-emerald-700">{message}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
