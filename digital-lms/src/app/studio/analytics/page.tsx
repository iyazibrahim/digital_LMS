"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Point = { date: string; label?: string; count: number };
type Analytics = {
  counts: Record<string, number>;
  series: {
    signups: Point[];
    enrollments: Point[];
    completions: Point[];
  };
};

function normalizeAnalytics(raw: Record<string, unknown>): Analytics | null {
  if (raw.counts && raw.series) {
    return raw as unknown as Analytics;
  }
  // Current API shape: { totals, signupsByDay }
  const totals = (raw.totals || {}) as Record<string, number>;
  const signupsByDay = (raw.signupsByDay || []) as Point[];
  if (!Object.keys(totals).length && !signupsByDay.length) return null;
  const signups = signupsByDay.map((p) => ({
    date: p.date,
    label: p.date.slice(5),
    count: p.count,
  }));
  return {
    counts: {
      users: totals.users || 0,
      courses: totals.courses || 0,
      enrollments: totals.enrollments || 0,
      completions: totals.completions || 0,
      batches: totals.batches || 0,
      certificates: totals.certificates || 0,
      applications: totals.applications || 0,
      quizSubs: totals.quizSubs || 0,
    },
    series: {
      signups,
      enrollments: signups.map((s) => ({ ...s, count: 0 })),
      completions: signups.map((s) => ({ ...s, count: 0 })),
    },
  };
}

export default function StudioAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/analytics", { credentials: "same-origin" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
        return d;
      })
      .then((d) => {
        if (cancelled) return;
        const normalized = normalizeAnalytics(d);
        if (!normalized) throw new Error("Unexpected analytics response");
        setData(normalized);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load analytics");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="space-y-2">
        <h1 className="font-serif text-3xl text-blue-950">Analytics</h1>
        <p className="text-sm text-red-600">{error}</p>
        <p className="text-sm text-stone-500">
          If you see Unauthorized, log out and sign in again as admin, then reopen Studio.
        </p>
      </div>
    );
  }

  if (!data) return <p className="text-stone-500">Loading analytics…</p>;

  const chartData = data.series.signups.map((s, i) => ({
    label: s.label || s.date,
    signups: s.count,
    enrollments: data.series.enrollments[i]?.count || 0,
    completions: data.series.completions[i]?.count || 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">Analytics</h1>
        <p className="text-stone-600">Platform totals and recent signup activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(data.counts).map(([k, v]) => (
          <Card key={k}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium capitalize text-stone-500">
                {k.replace(/([A-Z])/g, " $1")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-serif text-3xl text-blue-900">{v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Signups (last 7 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="signups" fill="#1D4ED8" name="Signups" />
              <Bar dataKey="enrollments" fill="#b45309" name="Enrollments" />
              <Bar dataKey="completions" fill="#44403c" name="Completions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
