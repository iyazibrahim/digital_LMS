"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { ClientPagination } from "@/components/studio/pagination";
import { formatDateTime } from "@/lib/utils";

type Slot = {
  _id: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
  notes?: string;
  evaluatorId?: { name: string };
  courseId?: { title: string };
  bookedBy?: { name: string; email: string };
};

type RequestRow = {
  _id: string;
  status: string;
  notes?: string;
  userId?: { name: string; email: string };
  courseId?: { title: string };
  slotId?: { startAt: string; endAt: string };
};

type CourseOpt = { _id: string; title: string };

export default function StudioEvaluationsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [notes, setNotes] = useState("");
  const [courseId, setCourseId] = useState("");
  const [slotPage, setSlotPage] = useState(1);
  const [reqPage, setReqPage] = useState(1);
  const [slotTotal, setSlotTotal] = useState(0);
  const [reqTotal, setReqTotal] = useState(0);
  const [slotPages, setSlotPages] = useState(1);
  const [reqPages, setReqPages] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load(sp = slotPage, rp = reqPage) {
    const [s, r, c] = await Promise.all([
      fetch(`/api/evaluations?type=slots&page=${sp}&pageSize=10`).then((res) => res.json()),
      fetch(`/api/evaluations?type=requests&page=${rp}&pageSize=10`).then((res) => res.json()),
      fetch("/api/courses").then((res) => res.json()).catch(() => ({ courses: [] })),
    ]);
    if (s.slots) {
      setSlots(s.slots);
      setSlotTotal(s.total || 0);
      setSlotPages(s.totalPages || 1);
      setSlotPage(s.page || sp);
    }
    if (r.requests) {
      setRequests(r.requests);
      setReqTotal(r.total || 0);
      setReqPages(r.totalPages || 1);
      setReqPage(r.page || rp);
    }
    if (c.courses) setCourses(c.courses.map((x: CourseOpt) => ({ _id: x._id, title: x.title })));
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt, endAt, notes, courseId: courseId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setMessage("Slot published");
    setStartAt("");
    setEndAt("");
    setNotes("");
    setCourseId("");
    load(1, reqPage);
  }

  async function updateRequest(requestId: string, status: string) {
    setError("");
    const res = await fetch("/api/evaluations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    setMessage(`Marked ${status}`);
    load(slotPage, reqPage);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">Evaluations</h1>
        <p className="text-stone-600">Publish booking slots and grade learner evaluations.</p>
      </div>
      {message && <p className="text-sm text-blue-800">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Available slots</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              {slots.map((s) => (
                <li
                  key={s._id}
                  className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2"
                >
                  <div>
                    <p>
                      {formatDateTime(s.startAt)} – {formatDateTime(s.endAt)}
                    </p>
                    <p className="text-stone-500">
                      {s.evaluatorId?.name}
                      {s.courseId?.title ? ` · ${s.courseId.title}` : ""}
                      {s.bookedBy?.name ? ` · booked by ${s.bookedBy.name}` : ""}
                    </p>
                  </div>
                  <Badge variant={s.isBooked ? "warning" : "success"}>
                    {s.isBooked ? "Booked" : "Open"}
                  </Badge>
                </li>
              ))}
              {!slots.length && <p className="text-stone-500">No slots yet.</p>}
            </ul>
            <ClientPagination
              page={slotPage}
              totalPages={slotPages}
              total={slotTotal}
              onPage={(p) => load(p, reqPage)}
            />
            <form onSubmit={addSlot} className="space-y-2 border-t border-stone-100 pt-4">
              <div className="space-y-2">
                <Label>Start</Label>
                <Input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End</Label>
                <Input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Course (optional)</Label>
                <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  <option value="">General</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </Select>
              </div>
              <Textarea
                placeholder="Notes (meeting link, location…)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button type="submit" size="sm">
                Publish slot
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((r) => (
              <div key={r._id} className="rounded-lg border border-stone-100 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.userId?.name}</p>
                    <p className="text-stone-500">{r.courseId?.title || "General"}</p>
                    {r.slotId?.startAt && (
                      <p className="text-xs text-stone-400">{formatDateTime(r.slotId.startAt)}</p>
                    )}
                  </div>
                  <Badge>{r.status}</Badge>
                </div>
                {r.notes && <p className="mt-2 text-stone-600">{r.notes}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Select
                    defaultValue={r.status}
                    onChange={(e) => updateRequest(r._id, e.target.value)}
                  >
                    <option value="pending">pending</option>
                    <option value="scheduled">scheduled</option>
                    <option value="passed">passed</option>
                    <option value="failed">failed</option>
                    <option value="cancelled">cancelled</option>
                  </Select>
                </div>
              </div>
            ))}
            {!requests.length && <p className="text-stone-500">No bookings yet.</p>}
            <ClientPagination
              page={reqPage}
              totalPages={reqPages}
              total={reqTotal}
              onPage={(p) => load(slotPage, p)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
