"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function safeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        return { ok: r.ok, data };
      })
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && data.user) {
          if (next.startsWith("/studio") && data.user.isStaff) {
            router.replace(next);
            router.refresh();
            return;
          }
          if (!next.startsWith("/studio")) {
            router.replace(next === "/login" ? "/" : next);
            router.refresh();
            return;
          }
        }
        setChecking(false);
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "same-origin",
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Login failed");
      return;
    }

    // Confirm cookies stuck before navigating
    const me = await fetch("/api/auth/me", {
      credentials: "same-origin",
      cache: "no-store",
    });
    setLoading(false);
    if (!me.ok) {
      const meData = await me.json().catch(() => ({}));
      setError(
        meData.hint ||
          "Signed in on the server, but the browser did not keep the session cookie. In Dokploy set COOKIE_SECURE=1, stable JWT_* secrets, NEXT_PUBLIC_APP_URL=https://lms.iyazbrhm.cloud, then clear cookies and try again."
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-stone-500">
        Checking session…
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md px-4 py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Welcome back</CardTitle>
          <CardDescription>Log in to continue learning</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-600">
            <p className="font-medium text-blue-900">Demo accounts (auto-seeded)</p>
            <p className="mt-1">Admin: admin@digitalpenang.my / admin123</p>
            <p>Student: student@digitalpenang.my / student123</p>
          </div>
          <p className="mt-4 text-center text-sm text-stone-500">
            No account?{" "}
            <Link href="/register" className="text-blue-700 hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
