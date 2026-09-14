"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId?: { name?: string };
  replies?: { body: string; userId?: { name?: string } }[];
};

export function BatchForum({ batchId, canPost }: { batchId: string; canPost: boolean }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/batches/${batchId}/forum`, { credentials: "include" });
    const data = await res.json();
    if (res.ok) setThreads(data.threads || []);
    else setError(data.error || "Forum unavailable");
  }

  useEffect(() => {
    if (canPost) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, canPost]);

  async function createThread(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/batches/${batchId}/forum`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    if (res.ok) {
      setTitle("");
      setBody("");
      void load();
    }
  }

  async function postReply(threadId: string) {
    const text = reply[threadId];
    if (!text?.trim()) return;
    await fetch(`/api/batches/${batchId}/forum/${threadId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    setReply({ ...reply, [threadId]: "" });
    void load();
  }

  if (!canPost) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cohort forum</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-500">Enroll to join the cohort discussion.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort forum</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <form onSubmit={createThread} className="space-y-2 rounded-lg border border-stone-100 p-3">
          <Input
            placeholder="Thread title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            placeholder="Start a discussion"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <Button type="submit" size="sm">
            Post
          </Button>
        </form>
        {threads.map((t) => (
          <div key={t._id} className="rounded-lg border border-stone-100 p-3 text-sm">
            <p className="font-medium">{t.title}</p>
            <p className="text-xs text-stone-400">{t.userId?.name}</p>
            <p className="mt-1 text-stone-600">{t.body}</p>
            <ul className="mt-2 space-y-1 border-l-2 border-stone-100 pl-3">
              {(t.replies || []).map((r, i) => (
                <li key={i}>
                  <span className="text-xs text-stone-400">{r.userId?.name}: </span>
                  {r.body}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Reply"
                value={reply[t._id] || ""}
                onChange={(e) => setReply({ ...reply, [t._id]: e.target.value })}
              />
              <Button size="sm" variant="outline" onClick={() => void postReply(t._id)}>
                Reply
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
