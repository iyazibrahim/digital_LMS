"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useLessonEngagementOptional } from "@/components/course/lesson-engagement";

export function AssignmentSubmit({
  assignment,
  courseId,
  lessonId,
}: {
  assignment: { _id: string; title: string; description?: string };
  courseId: string;
  lessonId: string;
}) {
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const engagement = useLessonEngagementOptional();

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setFileUrl(data.url);
      setFileName(file.name);
    } else {
      setMessage(data.error || "Upload failed");
    }
  }

  async function submit() {
    setLoading(true);
    const res = await fetch(`/api/assignments/${assignment._id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileUrl, fileName, notes, courseId, lessonId }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage("Submitted for review");
      await engagement?.refreshGate();
    } else {
      setMessage(data.error || "Failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{assignment.title}</CardTitle>
        {assignment.description && (
          <p className="text-sm text-stone-500">{assignment.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Input type="file" onChange={onUpload} />
        {fileName && <p className="text-xs text-stone-500">Selected: {fileName}</p>}
        <Textarea
          placeholder="Notes for your instructor"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button onClick={submit} disabled={!fileUrl || loading}>
          {loading ? "Submitting…" : "Submit assignment"}
        </Button>
        {message && <p className="text-sm text-blue-800">{message}</p>}
      </CardContent>
    </Card>
  );
}
