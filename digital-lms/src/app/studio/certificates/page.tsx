"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type Cert = {
  _id: string;
  certificateNumber: string;
  recipientName: string;
  courseTitle: string;
  issuedAt: string;
};

type User = { _id: string; name: string; email: string };
type Course = { _id: string; title: string };

export default function StudioCertificatesPage() {
  const [certificates, setCertificates] = useState<Cert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
     
    Promise.all([
      fetch("/api/certificates").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/courses").then((r) => r.json()),
    ]).then(([c, u, coursesData]) => {
      if (c.certificates) setCertificates(c.certificates);
      if (u.users) setUsers(u.users);
      if (coursesData.courses) setCourses(coursesData.courses);
    });
  }, []);

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch("/api/certificates/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, courseId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setMessage(`Issued ${data.certificate.certificateNumber}`);
    const list = await fetch("/api/certificates").then((r) => r.json());
    setCertificates(list.certificates || []);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">Certificates</h1>
        <p className="text-stone-600">
          View issued certificates or issue one manually to a learner for a course.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Issue manually</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={issue} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Learner</Label>
              <Select value={userId} onChange={(e) => setUserId(e.target.value)} required>
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit">Issue certificate</Button>
            </div>
          </form>
          {message && <p className="mt-2 text-sm text-blue-800">{message}</p>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">Number</th>
              <th className="px-4 py-3 font-medium">Recipient</th>
              <th className="px-4 py-3 font-medium">Course</th>
              <th className="px-4 py-3 font-medium">Issued</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {certificates.map((c) => (
              <tr key={c._id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{c.certificateNumber}</td>
                <td className="px-4 py-3">{c.recipientName}</td>
                <td className="px-4 py-3">{c.courseTitle}</td>
                <td className="px-4 py-3 text-stone-500">{formatDate(c.issuedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/certificates/${c._id}`} className="text-blue-700 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!certificates.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                  No certificates yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
