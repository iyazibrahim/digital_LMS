"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type ProfileData = {
  user: {
    name: string;
    email: string;
    bio?: string;
    headline?: string;
    phone?: string;
    skills?: string[];
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

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => {
        if (r.status === 401) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.user) setData(d);
      });
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
    setData({ ...data, user: { ...data.user, ...json.user } });
    setMessage("Profile updated.");
  }

  if (!data) return <p className="mx-auto max-w-3xl px-4 py-10 text-stone-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">Your profile</h1>
        <p className="text-stone-600">{data.user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Edit profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
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
          <CardTitle className="font-serif">My enrollments</CardTitle>
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
          <CardTitle className="font-serif">My certificates</CardTitle>
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
    </div>
  );
}
