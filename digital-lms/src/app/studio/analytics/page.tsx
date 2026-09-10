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

type Point = { date: string; label: string; count: number };
type Analytics = {
  counts: Record<string, number>;
  series: {
    signups: Point[];
    enrollments: Point[];
    completions: Point[];
  };
};

export default function StudioAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.counts) setData(d);
      });
  }, []);

  if (!data) return <p className="text-stone-500">Loading analytics…</p>;

  const chartData = data.series.signups.map((s, i) => ({
    label: s.label,
    signups: s.count,
    enrollments: data.series.enrollments[i]?.count || 0,
    completions: data.series.completions[i]?.count || 0,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-teal-950">Analytics</h1>
        <p className="text-stone-600">Signups, enrollments, and completions (14 days).</p>
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
              <p className="font-serif text-3xl text-teal-900">{v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Activity (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="signups" fill="#0f766e" name="Signups" />
              <Bar dataKey="enrollments" fill="#b45309" name="Enrollments" />
              <Bar dataKey="completions" fill="#44403c" name="Completions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
