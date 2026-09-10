"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

type Thread = {
  _id: string;
  title: string;
  body: string;
  userId?: { name?: string } | string;
  replies?: { body: string; userId?: { name?: string } | string }[];
};

export function DiscussionPanel({
  courseId,
  lessonId,
  threads: initial,
}: {
  courseId: string;
  lessonId: string;
  threads: Thread[];
}) {
  const [threads, setThreads] = useState(initial);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [replyBody, setReplyBody] = useState<Record<string, string>>({});

  async function createThread() {
    const res = await fetch("/api/discussions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, lessonId, title, body }),
    });
    const data = await res.json();
    if (res.ok) {
      setThreads((t) => [data, ...t]);
      setTitle("");
      setBody("");
    }
  }

  async function reply(id: string) {
    const res = await fetch(`/api/discussions/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyBody[id] }),
    });
    const data = await res.json();
    if (res.ok) {
      setThreads((list) => list.map((t) => (t._id === id ? data : t)));
      setReplyBody((r) => ({ ...r, [id]: "" }));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lesson discussion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-xl border border-dashed border-stone-300 p-3">
          <Input placeholder="Question title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Details" value={body} onChange={(e) => setBody(e.target.value)} />
          <Button size="sm" onClick={createThread} disabled={!title || !body}>
            Post
          </Button>
        </div>
        {threads.map((t) => (
          <div key={t._id} className="rounded-xl border border-stone-200 p-3">
            <p className="font-medium">{t.title}</p>
            <p className="text-sm text-stone-600">{t.body}</p>
            <p className="mt-1 text-xs text-stone-400">
              by {typeof t.userId === "object" ? t.userId?.name : "Learner"}
            </p>
            <div className="mt-2 space-y-2 border-t border-stone-100 pt-2">
              {(t.replies || []).map((r, i) => (
                <p key={i} className="text-sm text-stone-600">
                  <span className="font-medium">
                    {typeof r.userId === "object" ? r.userId?.name : "User"}:
                  </span>{" "}
                  {r.body}
                </p>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Reply"
                  value={replyBody[t._id] || ""}
                  onChange={(e) => setReplyBody((r) => ({ ...r, [t._id]: e.target.value }))}
                />
                <Button size="sm" variant="outline" onClick={() => reply(t._id)}>
                  Reply
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
