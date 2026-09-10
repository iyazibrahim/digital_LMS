"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils";

type ProfileData = {
  user: {
    name: string;
    email: string;
    bio?: string;
    headline?: string;
    phone?: string;
    skills?: string[];
    roles?: string[];
    avatarUrl?: string;
    mustChangePassword?: boolean;
    lastLoginAt?: string;
  };
  certificates: {
    _id: string;
    certificateNumber: string;
    courseTitle: string;
    issuedAt: string;
  }[];
  enrollments: {
    _id: string;
    progressPercent: number;
    completed: boolean;
    courseId?: { title: string; slug: string };
  }[];
};

export default function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forcePassword = searchParams.get("forcePassword") === "1";
  const nextAfter = searchParams.get("next") || "/";

  const [data, setData] = useState<ProfileData | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  useEffect(() => {
    fetch("/api/profile", { credentials: "same-origin", cache: "no-store" })
      .then(async (r) => {
        if (r.status === 401) {
          router.push(`/login?next=${encodeURIComponent("/profile")}`);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.user) setData(d);
      });
  }, [router]);

  const isStaff = useMemo(() => {
    const roles = data?.user?.roles || [];
    return roles.some((r) => ["admin", "instructor", "evaluator"].includes(r));
  }, [data]);

  const stats = useMemo(() => {
    const enrollments = data?.enrollments || [];
    return {
      inProgress: enrollments.filter((e) => !e.completed).length,
      completed: enrollments.filter((e) => e.completed).length,
      certificates: data?.certificates?.length || 0,
    };
  }, [data]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        name: data.user.name,
        bio: data.user.bio,
        headline: data.user.headline,
        phone: data.user.phone,
        skills: data.user.skills,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Save failed");
      return;
    }
    setData({ ...data, user: { ...data.user, ...(json.user || {}) } });
    setMessage("Profile updated.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Password change failed");
      return;
    }
    setPassword("");
    setPassword2("");
    setMessage("Password updated.");
    if (data) {
      setData({
        ...data,
        user: { ...data.user, ...(json.user || {}), mustChangePassword: false },
      });
    }
    if (forcePassword) {
      window.location.href = nextAfter;
    }
  }

  if (!data) return <p className="mx-auto max-w-4xl px-4 py-10 text-stone-500">Loading…</p>;

  const mustChange = forcePassword || data.user.mustChangePassword;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-2xl font-serif text-white">
              {(data.user.name || "?").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="font-serif text-3xl text-blue-950">{data.user.name}</h1>
              <p className="text-stone-600">{data.user.headline || data.user.email}</p>
              <p className="text-sm text-stone-400">{data.user.email}</p>
            </div>
          </div>
          {isStaff && (
            <div className="flex flex-wrap gap-2">
              {(data.user.roles || []).map((r) => (
                <Badge key={r}>{r}</Badge>
              ))}
              <Link href="/studio">
                <Button size="sm">Open Studio</Button>
              </Link>
            </div>
          )}
        </div>
        {isStaff && data.user.lastLoginAt && (
          <p className="mt-4 text-xs text-stone-500">
            Last login {formatDateTime(data.user.lastLoginAt)}
          </p>
        )}
      </div>

      {mustChange && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Change temporary password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-3">
              <p className="text-sm text-amber-900">
                You must set a new password before continuing.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>New password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Confirm</Label>
                  <Input
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!isStaff && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-stone-400">In progress</p>
              <p className="mt-1 font-serif text-3xl text-blue-950">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-stone-400">Completed</p>
              <p className="mt-1 font-serif text-3xl text-blue-950">{stats.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-stone-400">Certificates</p>
              <p className="mt-1 font-serif text-3xl text-blue-950">{stats.certificates}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!mustChange && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={data.user.name}
                    onChange={(e) =>
                      setData({ ...data, user: { ...data.user, name: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Headline</Label>
                  <Input
                    value={data.user.headline || ""}
                    onChange={(e) =>
                      setData({ ...data, user: { ...data.user, headline: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={data.user.phone || ""}
                    onChange={(e) =>
                      setData({ ...data, user: { ...data.user, phone: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={data.user.bio || ""}
                    onChange={(e) =>
                      setData({ ...data, user: { ...data.user, bio: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Skills (comma separated)</Label>
                  <Input
                    value={(data.user.skills || []).join(", ")}
                    onChange={(e) =>
                      setData({
                        ...data,
                        user: {
                          ...data.user,
                          skills: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                </div>
                {message && <p className="text-sm text-blue-800">{message}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={changePassword} className="space-y-3">
                <div className="space-y-1">
                  <Label>New password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Confirm</Label>
                  <Input
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="secondary" disabled={loading}>
                  Change password
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {!isStaff && !mustChange && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Continue learning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.enrollments.map((en) => (
                <div key={en._id} className="flex justify-between border-b border-stone-100 py-2">
                  <Link
                    href={en.courseId?.slug ? `/courses/${en.courseId.slug}` : "#"}
                    className="text-blue-800 hover:underline"
                  >
                    {en.courseId?.title || "Course"}
                  </Link>
                  <span className="text-stone-500">
                    {en.completed ? "Completed" : `${en.progressPercent}%`}
                  </span>
                </div>
              ))}
              {!data.enrollments.length && <p className="text-stone-500">No enrollments yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Certificates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {data.certificates.map((c) => (
                <div key={c._id} className="flex justify-between border-b border-stone-100 py-2">
                  <div>
                    <Link href={`/certificates/${c._id}`} className="text-blue-800 hover:underline">
                      {c.courseTitle}
                    </Link>
                    <p className="text-xs text-stone-400">{c.certificateNumber}</p>
                  </div>
                  <span className="text-stone-500">{formatDate(c.issuedAt)}</span>
                </div>
              ))}
              {!data.certificates.length && <p className="text-stone-500">No certificates yet.</p>}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
