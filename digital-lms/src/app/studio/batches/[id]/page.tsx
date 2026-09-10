"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

type Batch = {
  _id: string;
  title: string;
  description?: string;
  published: boolean;
  liveClasses: { _id: string; title: string; startAt: string; meetingUrl?: string }[];
  announcements: { _id: string; title: string; body: string }[];
};

type Enrollment = {
  _id: string;
  status: string;
  userId: { name: string; email: string };
};

export default function ManageBatchPage() {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [live, setLive] = useState({
    title: "",
    startAt: "",
    durationMinutes: 60,
    meetingUrl: "",
    provider: "manual",
  });
  const [ann, setAnn] = useState({ title: "", body: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const [bRes, eRes] = await Promise.all([
      fetch(`/api/batches/${id}`, { credentials: "same-origin" }),
      fetch(`/api/batches/${id}/enrollments`, { credentials: "same-origin" }),
    ]);
    const bData = await bRes.json();
    const eData = await eRes.json();
    if (bRes.ok) {
      setBatch(bData.batch || bData);
    } else {
      setError(bData.error || "Failed to load batch");
    }
    if (eRes.ok) setEnrollments(eData.enrollments || []);
    else if (!bRes.ok) {
      /* already set error */
    } else if (eRes.status === 401 || eRes.status === 403) {
      setError(eData.error || "Not authorized to view enrollments");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveMeta() {
    if (!batch) return;
    const res = await fetch(`/api/batches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        title: batch.title,
        description: batch.description,
        published: batch.published,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Save failed");
      return;
    }
    setBatch(data.batch || data);
    setMessage("Batch saved.");
  }

  async function addLive(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/batches/${id}/live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(live),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setBatch(data.batch || data);
    setLive({ title: "", startAt: "", durationMinutes: 60, meetingUrl: "", provider: "manual" });
  }

  async function addAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/batches/${id}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ann),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setBatch(data.batch || data);
    setAnn({ title: "", body: "" });
  }

  if (!batch) {
    return (
      <div className="space-y-2">
        <p className="text-stone-500">{error ? "Could not load batch" : "Loading…"}</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">{batch.title}</h1>
        <p className="text-stone-600">Manage live classes, announcements, and learners.</p>
      </div>
      {message && <p className="text-sm text-blue-800">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Batch settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={batch.title}
            onChange={(e) => setBatch({ ...batch, title: e.target.value })}
          />
          <Textarea
            value={batch.description || ""}
            onChange={(e) => setBatch({ ...batch, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={batch.published}
              onChange={(e) => setBatch({ ...batch, published: e.target.checked })}
            />
            Published
          </label>
          <Button onClick={saveMeta}>Save</Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Live classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {batch.liveClasses?.map((lc) => (
                <li key={lc._id} className="rounded-lg bg-stone-50 px-3 py-2">
                  <p className="font-medium">{lc.title}</p>
                  <p className="text-stone-500">{formatDateTime(lc.startAt)}</p>
                </li>
              ))}
            </ul>
            <form onSubmit={addLive} className="space-y-2 border-t border-stone-100 pt-4">
              <Input
                placeholder="Title"
                value={live.title}
                onChange={(e) => setLive({ ...live, title: e.target.value })}
                required
              />
              <Input
                type="datetime-local"
                value={live.startAt}
                onChange={(e) => setLive({ ...live, startAt: e.target.value })}
                required
              />
              <Input
                placeholder="Meeting URL"
                value={live.meetingUrl}
                onChange={(e) => setLive({ ...live, meetingUrl: e.target.value })}
              />
              <Select
                value={live.provider}
                onChange={(e) => setLive({ ...live, provider: e.target.value })}
              >
                <option value="manual">Manual</option>
                <option value="zoom">Zoom</option>
                <option value="google_meet">Google Meet</option>
              </Select>
              <Button type="submit" size="sm">
                Add live class
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {batch.announcements?.map((a) => (
                <li key={a._id}>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-stone-600">{a.body}</p>
                </li>
              ))}
            </ul>
            <form onSubmit={addAnnouncement} className="space-y-2 border-t border-stone-100 pt-4">
              <Input
                placeholder="Title"
                value={ann.title}
                onChange={(e) => setAnn({ ...ann, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Body"
                value={ann.body}
                onChange={(e) => setAnn({ ...ann, body: e.target.value })}
                required
              />
              <Button type="submit" size="sm">
                Post announcement
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Enrollments ({enrollments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-stone-100 text-sm">
            {enrollments.map((en) => (
              <li key={en._id} className="flex justify-between py-2">
                <span>
                  {en.userId?.name} · {en.userId?.email}
                </span>
                <span className="text-stone-500">{en.status}</span>
              </li>
            ))}
            {!enrollments.length && <li className="py-4 text-stone-500">No enrollments yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
