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
  requireApplication?: boolean;
  liveClasses: {
    _id: string;
    title: string;
    startAt: string;
    meetingUrl?: string;
    attendance?: { userId: string; status: string }[];
  }[];
  announcements: { _id: string; title: string; body: string }[];
};

type Enrollment = {
  _id: string;
  status: string;
  userId: { _id: string; name: string; email: string };
};

type Application = {
  _id: string;
  status: string;
  motivation: string;
  startupName?: string;
  userId?: { name?: string; email?: string };
};

export default function ManageBatchPage() {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [inviteEmails, setInviteEmails] = useState("");
  const [live, setLive] = useState({
    title: "",
    startAt: "",
    durationMinutes: 60,
    meetingUrl: "",
    provider: "manual",
  });
  const [ann, setAnn] = useState({ title: "", body: "" });
  const [selectedLive, setSelectedLive] = useState("");
  const [attStatus, setAttStatus] = useState<Record<string, string>>({});
  const [noteForm, setNoteForm] = useState({ menteeId: "", body: "", title: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    const [bRes, eRes, aRes] = await Promise.all([
      fetch(`/api/batches/${id}`, { credentials: "same-origin" }),
      fetch(`/api/batches/${id}/enrollments`, { credentials: "same-origin" }),
      fetch(`/api/batches/${id}/applications`, { credentials: "same-origin" }),
    ]);
    const bData = await bRes.json();
    const eData = await eRes.json();
    const aData = await aRes.json();
    if (bRes.ok) setBatch(bData.batch || bData);
    else setError(bData.error || "Failed to load batch");
    if (eRes.ok) setEnrollments(eData.enrollments || []);
    if (aRes.ok) setApplications(aData.applications || []);
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
        requireApplication: !!batch.requireApplication,
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
    setMessage("Announcement posted and emailed to cohort.");
  }

  async function inviteRoster(e: React.FormEvent) {
    e.preventDefault();
    const emails = inviteEmails
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch(`/api/batches/${id}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails, createIfMissing: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Invite failed");
      return;
    }
    setMessage(
      `Added ${data.added?.length || 0}. Skipped ${data.skipped?.length || 0}. Created ${
        data.created?.length || 0
      }.`
    );
    if (data.created?.length) {
      console.info("New temp passwords", data.created);
      setMessage(
        (m) =>
          `${m} New accounts (copy passwords from server logs / response): ${data.created
            .map((c: { email: string; temporaryPassword?: string }) => `${c.email}=${c.temporaryPassword}`)
            .join(", ")}`
      );
    }
    setInviteEmails("");
    void load();
  }

  async function dropUser(userId: string) {
    await fetch(`/api/batches/${id}/roster`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: "dropped" }),
    });
    void load();
  }

  async function saveAttendance() {
    if (!selectedLive) return;
    const records = Object.entries(attStatus).map(([userId, status]) => ({
      userId,
      status: status as "present" | "absent" | "late" | "excused",
    }));
    const res = await fetch(`/api/batches/${id}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liveClassId: selectedLive, records }),
    });
    if (res.ok) setMessage("Attendance saved.");
  }

  async function reviewApp(applicationId: string, status: "accepted" | "waitlisted" | "rejected") {
    const res = await fetch(`/api/batches/${id}/applications`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });
    if (res.ok) {
      setMessage(`Application ${status}`);
      void load();
    }
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/mentor-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menteeId: noteForm.menteeId,
        body: noteForm.body,
        title: noteForm.title,
        batchId: id,
        visibility: "private",
      }),
    });
    if (res.ok) {
      setMessage("Mentor note saved.");
      setNoteForm({ menteeId: "", body: "", title: "" });
    }
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
        <p className="text-stone-600">Manage live classes, roster, attendance, and applications.</p>
      </div>
      {message && <p className="text-sm text-blue-800 whitespace-pre-wrap">{message}</p>}
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!batch.requireApplication}
              onChange={(e) => setBatch({ ...batch, requireApplication: e.target.checked })}
            />
            Require application before enroll
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
                  {lc.meetingUrl && (
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <a href={lc.meetingUrl} className="text-blue-700" target="_blank" rel="noreferrer">
                        Join link
                      </a>
                      <button
                        type="button"
                        className="text-blue-700"
                        onClick={() => {
                          void navigator.clipboard.writeText(lc.meetingUrl || "");
                          setMessage("Join link copied.");
                        }}
                      >
                        Copy link
                      </button>
                    </div>
                  )}
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
                Post + email cohort
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Roster ({enrollments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={inviteRoster} className="space-y-2">
            <Textarea
              placeholder="Invite emails (comma or newline separated)"
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              rows={3}
            />
            <Button type="submit" size="sm">
              Invite / bulk add
            </Button>
          </form>
          <ul className="divide-y divide-stone-100 text-sm">
            {enrollments.map((en) => (
              <li key={en._id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {en.userId?.name} · {en.userId?.email}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500">{en.status}</span>
                  {en.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => void dropUser(en.userId._id)}>
                      Drop
                    </Button>
                  )}
                </div>
              </li>
            ))}
            {!enrollments.length && <li className="py-4 text-stone-500">No enrollments yet.</li>}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedLive} onChange={(e) => setSelectedLive(e.target.value)}>
            <option value="">Select live class</option>
            {batch.liveClasses?.map((lc) => (
              <option key={lc._id} value={lc._id}>
                {lc.title}
              </option>
            ))}
          </Select>
          {selectedLive && (
            <>
              <ul className="space-y-2 text-sm">
                {enrollments
                  .filter((e) => e.status === "active")
                  .map((en) => (
                    <li key={en._id} className="flex items-center justify-between gap-2">
                      <span>{en.userId?.name}</span>
                      <Select
                        value={attStatus[en.userId._id] || "present"}
                        onChange={(e) =>
                          setAttStatus({ ...attStatus, [en.userId._id]: e.target.value })
                        }
                      >
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </Select>
                    </li>
                  ))}
              </ul>
              <Button size="sm" onClick={() => void saveAttendance()}>
                Save attendance
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {applications.map((app) => (
            <div key={app._id} className="rounded-lg border border-stone-100 p-3 text-sm">
              <p className="font-medium">
                {app.userId?.name} · {app.status}
                {app.startupName ? ` · ${app.startupName}` : ""}
              </p>
              <p className="mt-1 text-stone-600">{app.motivation}</p>
              {app.status === "pending" && (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => void reviewApp(app._id, "accepted")}>
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void reviewApp(app._id, "waitlisted")}
                  >
                    Waitlist
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void reviewApp(app._id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
          {!applications.length && <p className="text-stone-500">No applications.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Mentor notes</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addNote} className="space-y-2">
            <Select
              value={noteForm.menteeId}
              onChange={(e) => setNoteForm({ ...noteForm, menteeId: e.target.value })}
              required
            >
              <option value="">Select mentee</option>
              {enrollments.map((en) => (
                <option key={en._id} value={en.userId._id}>
                  {en.userId.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Title (optional)"
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
            />
            <Textarea
              placeholder="Notes"
              value={noteForm.body}
              onChange={(e) => setNoteForm({ ...noteForm, body: e.target.value })}
              required
            />
            <Button type="submit" size="sm">
              Save note
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
