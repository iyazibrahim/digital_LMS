"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientPagination } from "@/components/studio/pagination";
import { ROLES, Role } from "@/lib/constants";

type UserRow = {
  _id: string;
  name: string;
  email: string;
  roles: Role[];
  isActive: boolean;
};

const emptyCreate = { name: "", email: "", roles: ["student"] as Role[] };

export default function StudioUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tempPass, setTempPass] = useState<{ name: string; email?: string; password: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [creating, setCreating] = useState(false);
  const [allowSignup, setAllowSignup] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function load(query = q, p = page) {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    sp.set("page", String(p));
    sp.set("pageSize", "20");
    const res = await fetch(`/api/users?${sp}`, { credentials: "same-origin" });
    const data = await res.json();
    if (res.ok) {
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || p);
    } else setError(data.error || "Failed to load users");
  }

  useEffect(() => {
    void load("", 1);
    void fetch("/api/settings", { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings || d;
        if (typeof s?.allowSignup === "boolean") setAllowSignup(s.allowSignup);
      })
      .catch(() => {
        /* keep default */
      });
    void fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!d.user?.roles?.includes("admin")))
      .catch(() => setIsAdmin(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCreateRole(role: Role) {
    setCreateForm((prev) => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles: roles.length ? roles : prev.roles };
    });
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setCopied(false);
    if (!createForm.roles.length) {
      setError("Choose at least one role");
      return;
    }
    setCreating(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) {
      setError(data.error || "Could not create user");
      return;
    }
    setCreateForm(emptyCreate);
    setTempPass({
      name: data.user?.name || createForm.name,
      email: data.user?.email,
      password: data.temporaryPassword,
    });
    setMessage(`Created ${data.user?.name || "user"}`);
    setQ("");
    await load("", 1);
  }

  async function toggleRole(user: UserRow, role: Role) {
    setError("");
    setMessage("");
    const roles = user.roles.includes(role)
      ? user.roles.filter((r) => r !== role)
      : [...user.roles, role];
    if (!roles.length) {
      setError("User must keep at least one role");
      return;
    }
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ userId: user._id, roles }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Only admins can change roles");
      return;
    }
    setMessage(`Updated ${data.name || user.name}`);
    load(q, page);
  }

  async function toggleActive(user: UserRow) {
    setError("");
    setMessage("");
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        userId: user._id,
        roles: user.roles,
        isActive: !user.isActive,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Only admins can deactivate users");
      return;
    }
    setMessage(`${data.name || user.name} is now ${!user.isActive ? "active" : "inactive"}`);
    load(q, page);
  }

  async function resetPassword(user: UserRow) {
    if (!confirm(`Reset password for ${user.name}?`)) return;
    setError("");
    setMessage("");
    setCopied(false);
    const res = await fetch(`/api/users/${user._id}/reset-password`, {
      method: "POST",
      credentials: "same-origin",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Reset failed");
      return;
    }
    setTempPass({ name: user.name, email: user.email, password: data.temporaryPassword });
    setMessage(`Temporary password created for ${user.name}`);
  }

  async function copyTemp() {
    if (!tempPass) return;
    try {
      await navigator.clipboard.writeText(tempPass.password);
      setCopied(true);
    } catch {
      setError("Could not copy — select and copy manually");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">Users</h1>
        <p className="text-stone-600">
          Create accounts, search learners, change roles, reset passwords, and activate accounts.
        </p>
      </div>

      {!allowSignup && isAdmin && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Public sign-up is disabled in Settings. New accounts can only be created here.
        </p>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Create user</CardTitle>
          </CardHeader>
        <CardContent>
          <form onSubmit={createUser} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="create-name">Full name</Label>
              <Input
                id="create-name"
                required
                minLength={2}
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-3">
                {ROLES.map((role) => (
                  <label key={role} className="inline-flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={createForm.roles.includes(role)}
                      onChange={() => toggleCreateRole(role)}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create user"}
              </Button>
              <p className="mt-2 text-xs text-stone-500">
                A temporary password is generated. The user must change it on first login.
              </p>
            </div>
          </form>
        </CardContent>
        </Card>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load(q, 1);
        }}
      >
        <Input
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      {message && <p className="text-sm text-blue-800">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {tempPass && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base">Temporary password for {tempPass.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            {tempPass.email && <p className="w-full text-sm text-amber-900">{tempPass.email}</p>}
            <code className="rounded-lg bg-white px-3 py-2 font-mono text-sm tracking-wide">
              {tempPass.password}
            </code>
            <Button type="button" size="sm" onClick={copyTemp}>
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setTempPass(null)}>
              Dismiss
            </Button>
            <p className="w-full text-xs text-amber-800">
              Copy this now — it will not be shown again. The user must change it on next login.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Roles</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-stone-500">{u.email}</p>
                  {!u.isActive && <p className="text-xs text-red-600">Inactive</p>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                      <label key={role} className="inline-flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={u.roles.includes(role)}
                          onChange={() => toggleRole(u, role)}
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => toggleActive(u)}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => resetPassword(u)}
                    >
                      Reset password
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-stone-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ClientPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPage={(p) => {
          setPage(p);
          load(q, p);
        }}
      />
    </div>
  );
}
