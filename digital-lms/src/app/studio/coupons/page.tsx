"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Coupon = {
  _id: string;
  code: string;
  percentOff: number;
  amountOff: number;
  currency: string;
  maxUses: number;
  usedCount: number;
  active: boolean;
  applicableTo: string;
  expiresAt?: string;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({
    code: "",
    percentOff: "10",
    amountOff: "0",
    maxUses: "0",
    applicableTo: "all",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/coupons", { credentials: "include" });
    const data = await res.json();
    if (res.ok) setCoupons(data.coupons || []);
    else setError(data.error || "Failed to load (admin only)");
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        percentOff: Number(form.percentOff) || 0,
        amountOff: Number(form.amountOff) || 0,
        maxUses: Number(form.maxUses) || 0,
        applicableTo: form.applicableTo,
        active: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Create failed");
      return;
    }
    setMessage(`Created ${data.code}`);
    setForm({ code: "", percentOff: "10", amountOff: "0", maxUses: "0", applicableTo: "all" });
    void load();
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">Coupons</h1>
        <p className="text-stone-600">Discount codes for paid courses and batches.</p>
      </div>
      {message && <p className="text-sm text-blue-800">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Create coupon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div>
              <Label>Percent off</Label>
              <Input
                type="number"
                value={form.percentOff}
                onChange={(e) => setForm({ ...form, percentOff: e.target.value })}
              />
            </div>
            <div>
              <Label>Amount off</Label>
              <Input
                type="number"
                value={form.amountOff}
                onChange={(e) => setForm({ ...form, amountOff: e.target.value })}
              />
            </div>
            <div>
              <Label>Max uses (0 = unlimited)</Label>
              <Input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              />
            </div>
            <div>
              <Label>Applies to</Label>
              <select
                className="h-10 w-full rounded-lg border border-stone-200 px-3 text-sm"
                value={form.applicableTo}
                onChange={(e) => setForm({ ...form, applicableTo: e.target.value })}
              >
                <option value="all">All</option>
                <option value="course">Courses</option>
                <option value="batch">Batches</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit">Create</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-stone-100 text-sm">
            {coupons.map((c) => (
              <li key={c._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-mono font-semibold">{c.code}</p>
                  <p className="text-stone-500">
                    {c.percentOff ? `${c.percentOff}%` : ""}
                    {c.amountOff ? ` ${c.currency} ${c.amountOff}` : ""} · used {c.usedCount}
                    {c.maxUses ? `/${c.maxUses}` : ""} · {c.applicableTo}
                    {!c.active ? " · inactive" : ""}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => void toggle(c._id, c.active)}>
                  {c.active ? "Disable" : "Enable"}
                </Button>
              </li>
            ))}
            {!coupons.length && <li className="py-4 text-stone-500">No coupons yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
