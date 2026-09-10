"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";

type Slot = {
  _id: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
  notes?: string;
  evaluatorId?: { name: string };
};

type RequestRow = {
  _id: string;
  status: string;
  notes?: string;
  userId?: { name: string; email: string };
  courseId?: { title: string };
};

export default function StudioEvaluationsPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [s, r] = await Promise.all([
      fetch("/api/evaluations?type=slots").then((res) => res.json()),
      fetch("/api/evaluations?type=requests").then((res) => res.json()),
    ]);
    if (s.slots) setSlots(s.slots);
    if (r.requests) setRequests(r.requests);
  }

  useEffect(() => {
    void load();
     
  }, []);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch("/api/evaluations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt, endAt, notes }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setMessage("Slot created");
    setStartAt("");
    setEndAt("");
    setNotes("");
    load();
  }

  async function updateRequest(requestId: string, status: string) {
    const res = await fetch("/api/evaluations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status }),
    });
    if (res.ok) load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">Evaluations</h1>
        <p className="text-stone-600">Evaluator slots and learner requests.</p>
      </div>
      {message && <p className="text-sm text-blue-800">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Slots</CardTitle>
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
                    <p className="text-stone-500">{s.evaluatorId?.name}</p>
                  </div>
                  <Badge variant={s.isBooked ? "warning" : "success"}>
                    {s.isBooked ? "Booked" : "Open"}
                  </Badge>
                </li>
              ))}
            </ul>
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
              <Textarea
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button type="submit" size="sm">
                Add slot
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((r) => (
              <div key={r._id} className="rounded-lg border border-stone-100 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{r.userId?.name}</p>
                    <p className="text-stone-500">{r.courseId?.title || "General"}</p>
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
                  </Select>
                </div>
              </div>
            ))}
            {!requests.length && <p className="text-stone-500">No requests yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
