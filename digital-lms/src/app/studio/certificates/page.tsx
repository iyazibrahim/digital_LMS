"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropzone } from "@/components/studio/file-dropzone";
import { formatDate } from "@/lib/utils";
import { DEFAULT_CERT_CSS, DEFAULT_CERT_HTML } from "@/lib/certificate-defaults";

type Cert = {
  _id: string;
  certificateNumber: string;
  recipientName: string;
  courseTitle: string;
  issuedAt: string;
};

type Template = {
  _id: string;
  name: string;
  html: string;
  css?: string;
  backgroundImageUrl?: string;
  isDefault?: boolean;
  widthPx?: number;
  heightPx?: number;
};

type Badge = {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  courseId?: { _id: string; title: string } | string;
  autoAwardOnCourseComplete?: boolean;
};

type User = { _id: string; name: string; email: string };
type Course = { _id: string; title: string };

export default function StudioCertificatesPage() {
  const [tab, setTab] = useState<"issued" | "templates" | "badges">("issued");
  const [certificates, setCertificates] = useState<Cert[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [tplName, setTplName] = useState("Default certificate");
  const [tplHtml, setTplHtml] = useState(DEFAULT_CERT_HTML);
  const [tplCss, setTplCss] = useState(DEFAULT_CERT_CSS);
  const [tplBg, setTplBg] = useState("");
  const [tplDefault, setTplDefault] = useState(true);
  const [editingTplId, setEditingTplId] = useState<string | null>(null);

  const [badgeName, setBadgeName] = useState("");
  const [badgeDesc, setBadgeDesc] = useState("");
  const [badgeImage, setBadgeImage] = useState("");
  const [badgeCourseId, setBadgeCourseId] = useState("");

  const previewHtml = useMemo(() => {
    const sample = tplHtml
      .replaceAll("{{recipientName}}", "Amina Learner")
      .replaceAll("{{name}}", "Amina Learner")
      .replaceAll("{{courseTitle}}", "Digital Skills 101")
      .replaceAll("{{course}}", "Digital Skills 101")
      .replaceAll("{{issuedAt}}", "10 Sep 2026")
      .replaceAll("{{date}}", "10 Sep 2026")
      .replaceAll("{{certificateNumber}}", "DP-DEMO-0001")
      .replaceAll("{{number}}", "DP-DEMO-0001");
    const bg = tplBg
      ? `background-image:url('${tplBg}');background-size:cover;background-position:center;`
      : "";
    return `<!DOCTYPE html><html><head><style>body{margin:0;padding:16px;font-family:Georgia,serif;${bg}}${tplCss}</style></head><body>${sample}</body></html>`;
  }, [tplHtml, tplCss, tplBg]);

  async function reload() {
    const [c, u, coursesData, t, b] = await Promise.all([
      fetch("/api/certificates", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/users", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/courses", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/certificates/templates", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/badges", { credentials: "same-origin" }).then((r) => r.json()),
    ]);
    if (c.certificates) setCertificates(c.certificates);
    if (u.users) setUsers(u.users);
    if (coursesData.courses) setCourses(coursesData.courses);
    if (t.templates) setTemplates(t.templates);
    if (b.badges) setBadges(b.badges);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch("/api/certificates/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ userId, courseId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setMessage(`Issued ${data.certificate?.certificateNumber || "certificate"}`);
    reload();
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const payload = {
      name: tplName,
      html: tplHtml,
      css: tplCss,
      backgroundImageUrl: tplBg,
      isDefault: tplDefault,
    };
    const res = await fetch(
      editingTplId ? `/api/certificates/templates/${editingTplId}` : "/api/certificates/templates",
      {
        method: editingTplId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Template save failed");
      return;
    }
    setMessage("Template saved");
    setEditingTplId(null);
    reload();
  }

  function editTemplate(t: Template) {
    setEditingTplId(t._id);
    setTplName(t.name);
    setTplHtml(t.html);
    setTplCss(t.css || "");
    setTplBg(t.backgroundImageUrl || "");
    setTplDefault(!!t.isDefault);
    setTab("templates");
  }

  async function uploadBg(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/uploads", { method: "POST", body: fd, credentials: "same-origin" });
    const data = await up.json();
    if (!up.ok) throw new Error(data.error || "Upload failed");
    setTplBg(data.url);
  }

  async function createBadge(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        name: badgeName,
        description: badgeDesc,
        imageUrl: badgeImage,
        courseId: badgeCourseId || undefined,
        autoAwardOnCourseComplete: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Badge create failed");
      return;
    }
    setBadgeName("");
    setBadgeDesc("");
    setBadgeImage("");
    setBadgeCourseId("");
    setMessage("Badge created — awarded automatically when learners complete that course");
    reload();
  }

  async function uploadBadgeImage(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const up = await fetch("/api/uploads", { method: "POST", body: fd, credentials: "same-origin" });
    const data = await up.json();
    if (!up.ok) throw new Error(data.error || "Upload failed");
    setBadgeImage(data.url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">Certificates & badges</h1>
        <p className="text-stone-600">
          Design HTML/CSS templates with placeholders, auto-issue on course completion, and award
          badges.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["issued", "Issued"],
            ["templates", "Templates"],
            ["badges", "Badges"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            type="button"
            variant={tab === id ? "default" : "outline"}
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {message && <p className="text-sm text-blue-800">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {tab === "issued" && (
        <div className="space-y-6">
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
              <p className="mt-3 text-xs text-stone-500">
                Certificates also auto-issue when a learner completes a course that has certification
                enabled (uses the default template).
              </p>
            </CardContent>
          </Card>

          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
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
                  <tr key={c._id} className="border-b border-stone-100">
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
                      No certificates issued yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "templates" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">
                {editingTplId ? "Edit template" : "Create template"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveTemplate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={tplName} onChange={(e) => setTplName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>HTML (placeholders)</Label>
                  <Textarea
                    className="min-h-[180px] font-mono text-xs"
                    value={tplHtml}
                    onChange={(e) => setTplHtml(e.target.value)}
                    required
                  />
                  <p className="text-xs text-stone-500">
                    Use {"{{recipientName}}"}, {"{{courseTitle}}"}, {"{{issuedAt}}"},{" "}
                    {"{{certificateNumber}}"} (also {"{{name}}"}, {"{{course}}"}, {"{{date}}"}).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>CSS</Label>
                  <Textarea
                    className="min-h-[120px] font-mono text-xs"
                    value={tplCss}
                    onChange={(e) => setTplCss(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Background image (PNG/JPG)</Label>
                  <FileDropzone
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    label="Upload background"
                    onFile={uploadBg}
                  />
                  {tplBg && <p className="truncate text-xs text-green-700">{tplBg}</p>}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tplDefault}
                    onChange={(e) => setTplDefault(e.target.checked)}
                  />
                  Use as default for auto-issue
                </label>
                <div className="flex gap-2">
                  <Button type="submit">{editingTplId ? "Update" : "Create"}</Button>
                  {editingTplId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingTplId(null);
                        setTplHtml(DEFAULT_CERT_HTML);
                        setTplCss(DEFAULT_CERT_CSS);
                        setTplBg("");
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Live preview</CardTitle>
              </CardHeader>
              <CardContent>
                <iframe title="Preview" className="h-[420px] w-full rounded-lg border" srcDoc={previewHtml} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Saved templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{t.name}</p>
                      {t.isDefault && <p className="text-xs text-blue-700">Default</p>}
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => editTemplate(t)}>
                      Edit
                    </Button>
                  </div>
                ))}
                {!templates.length && <p className="text-sm text-stone-500">No templates yet.</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === "badges" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Create badge</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createBadge} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={badgeName} onChange={(e) => setBadgeName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={badgeDesc} onChange={(e) => setBadgeDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Course (auto-award on complete)</Label>
                  <Select value={badgeCourseId} onChange={(e) => setBadgeCourseId(e.target.value)}>
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Badge image</Label>
                  <FileDropzone accept="image/*" label="Upload badge PNG" onFile={uploadBadgeImage} />
                  {badgeImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={badgeImage} alt="" className="h-16 w-16 rounded-full object-cover" />
                  )}
                </div>
                <Button type="submit">Create badge</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {badges.map((b) => (
                <div key={b._id} className="flex items-center gap-3 rounded-lg border border-stone-100 p-3">
                  {b.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.imageUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                      ★
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-stone-500">
                      {typeof b.courseId === "object" && b.courseId
                        ? b.courseId.title
                        : "No course link"}
                    </p>
                  </div>
                </div>
              ))}
              {!badges.length && <p className="text-sm text-stone-500">No badges yet.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
