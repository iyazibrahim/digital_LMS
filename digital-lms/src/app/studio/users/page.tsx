"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function StudioUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tempPass, setTempPass] = useState<{ name: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setTempPass({ name: user.name, password: data.temporaryPassword });
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
          Search learners, change roles, reset passwords, and activate accounts.
        </p>
      </div>
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
