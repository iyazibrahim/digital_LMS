"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

type Slot = {
  _id: string;
  startAt: string;
  endAt: string;
  notes?: string;
  evaluatorId?: { name: string };
  courseId?: { _id: string; title: string };
};

type Booking = {
  _id: string;
  status: string;
  courseId?: { title: string };
  slotId?: { startAt: string; endAt: string; notes?: string };
};

type CourseOpt = { _id: string; title: string };

export default function LearnerEvaluationsPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [courseId, setCourseId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const [s, r, profile] = await Promise.all([
      fetch("/api/evaluations?type=slots&open=1&pageSize=50", { credentials: "same-origin" }),
      fetch("/api/evaluations?type=requests&mine=1&pageSize=50", { credentials: "same-origin" }),
      fetch("/api/profile", { credentials: "same-origin" }),
    ]);
    if (s.status === 401 || r.status === 401 || profile.status === 401) {
      router.push("/login?next=/evaluations");
      return;
    }
    const sd = await s.json();
    const rd = await r.json();
    const pd = await profile.json();
    setSlots(sd.slots || []);
    setBookings(rd.requests || []);
    const enrolled = (pd.enrollments || [])
      .map((e: { courseId?: { _id: string; title: string } }) => e.courseId)
      .filter(Boolean);
    setCourses(enrolled);
  }

  useEffect(() => {
    void load();
  }, [router]);

  async function book(slotId: string) {
    setBusy(slotId);
    setError("");
    setMessage("");
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ kind: "book", slotId, courseId: courseId || undefined }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error || "Booking failed");
      return;
    }
    setMessage("Slot booked");
    load();
  }

  async function cancel(requestId: string) {
    if (!confirm("Cancel this booking?")) return;
    setBusy(requestId);
    setError("");
    const res = await fetch("/api/evaluations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancelRequestId: requestId }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError(data.error || "Cancel failed");
      return;
    }
    setMessage("Booking cancelled");
    load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div>
        <h1 className="font-serif text-3xl text-stone-900">Evaluation booking</h1>
        <p className="text-stone-600">Book an open slot with an evaluator.</p>
      </div>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">My bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b._id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-100 p-3 text-sm"
            >
              <div>
                <p className="font-medium">{b.courseId?.title || "General evaluation"}</p>
                {b.slotId?.startAt && (
                  <p className="text-stone-500">{formatDateTime(b.slotId.startAt)}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge>{b.status}</Badge>
                {["pending", "scheduled"].includes(b.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === b._id}
                    onClick={() => cancel(b._id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!bookings.length && <p className="text-stone-500">No bookings yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Open slots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.length > 0 && (
            <div className="max-w-sm">
              <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">Course (optional)</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
          )}
          {slots.map((s) => (
            <div
              key={s._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-stone-50 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {formatDateTime(s.startAt)} – {formatDateTime(s.endAt)}
                </p>
                <p className="text-stone-500">
                  {s.evaluatorId?.name || "Evaluator"}
                  {s.courseId?.title ? ` · ${s.courseId.title}` : ""}
                </p>
                {s.notes && <p className="mt-1 text-xs text-stone-400">{s.notes}</p>}
              </div>
              <Button size="sm" disabled={busy === s._id} onClick={() => book(s._id)}>
                {busy === s._id ? "Booking…" : "Book"}
              </Button>
            </div>
          ))}
          {!slots.length && <p className="text-stone-500">No open slots right now.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
