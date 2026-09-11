"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginForm({
  defaultNext = "/",
  allowSignup = true,
}: {
  defaultNext?: string;
  allowSignup?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, next: defaultNext }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      if (data.mustChangePassword || data.user?.mustChangePassword) {
        window.location.href = `/profile?forcePassword=1&next=${encodeURIComponent(defaultNext || "/")}`;
        return;
      }
      // Hard navigation so RSC picks up httpOnly session cookies
      window.location.href = defaultNext || "/";
    } catch {
      setError("Network error — try again");
      setLoading(false);
    }
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
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
          {allowSignup ? (
            <p className="mt-4 text-center text-sm text-stone-500">
              No account?{" "}
              <Link href="/register" className="text-blue-700 hover:underline">
                Register
              </Link>
            </p>
          ) : (
            <p className="mt-4 text-center text-sm text-stone-500">
              Accounts are created by an administrator.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
