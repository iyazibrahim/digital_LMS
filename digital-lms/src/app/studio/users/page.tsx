"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientPagination } from "@/components/studio/pagination";
import { StudioModal } from "@/components/studio/modal";
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
  const [resetCopied, setResetCopied] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [creating, setCreating] = useState(false);
  const [allowSignup, setAllowSignup] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [created, setCreated] = useState<{ name: string; email?: string; password: string } | null>(
    null
  );
  const [createdCopied, setCreatedCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const canCloseCreate = !created || createdCopied;

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

  useEffect(() => {
    if (!created) return;
    document.getElementById("copy-created-password")?.focus();
  }, [created]);

  function openCreate() {
    setCreateForm(emptyCreate);
    setCreated(null);
    setCreatedCopied(false);
    setCopyFailed(false);
    setCreateError("");
    setCreateOpen(true);
  }

  function closeCreate() {
    if (!canCloseCreate) return;
    setCreateOpen(false);
    setCreated(null);
    setCreateForm(emptyCreate);
    setCreatedCopied(false);
    setCopyFailed(false);
    setCreateError("");
  }

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
    setCreateError("");
    setError("");
    setMessage("");
    if (!createForm.roles.length) {
      setCreateError("Choose at least one role");
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
      setCreateError(data.error || "Could not create user");
      return;
    }
    setCreated({
      name: data.user?.name || createForm.name,
      email: data.user?.email,
      password: data.temporaryPassword,
    });
    setCreatedCopied(false);
    setCopyFailed(false);
    setMessage(`Created ${data.user?.name || "user"}`);
    setQ("");
    await load("", 1);
  }

  async function copyCreatedPassword() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.password);
      setCreatedCopied(true);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
      const el = document.getElementById("created-temp-password");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
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
    setResetCopied(false);
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

  async function copyResetTemp() {
    if (!tempPass) return;
    try {
      await navigator.clipboard.writeText(tempPass.password);
      setResetCopied(true);
    } catch {
      setError("Could not copy — select and copy manually");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-blue-950">Users</h1>
          <p className="text-stone-600">
            Create accounts, search learners, change roles, reset passwords, and activate accounts.
          </p>
        </div>
        {isAdmin && (
          <Button type="button" onClick={openCreate}>
            Create user
          </Button>
        )}
      </div>

      {!allowSignup && isAdmin && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Public sign-up is disabled in Settings. New accounts can only be created here.
        </p>
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
            <Button type="button" size="sm" onClick={copyResetTemp}>
              {resetCopied ? "Copied" : "Copy"}
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

      <StudioModal
        open={createOpen}
        title={created ? "Account created" : "Create user"}
        description={
          created
            ? "Copy the temporary password before closing. It will not be shown again."
            : "Add a learner or staff account. A temporary password is generated after you create."
        }
        onClose={closeCreate}
        canClose={canCloseCreate}
        closeBlockedHint="Copy the temporary password before closing"
      >
        {created ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="font-medium text-amber-950">{created.name}</p>
              {created.email && <p className="text-sm text-amber-900">{created.email}</p>}
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-amber-800">
                Temporary password
              </p>
              <code
                id="created-temp-password"
                className="mt-1 block select-all rounded-xl bg-white px-3 py-3 font-mono text-lg tracking-wide text-stone-900"
              >
                {created.password}
              </code>
            </div>
            {!createdCopied && (
              <p className="text-sm text-amber-900">
                You must copy this password before you can close this window.
              </p>
            )}
            {copyFailed && (
              <label className="flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={createdCopied}
                  onChange={(e) => setCreatedCopied(e.target.checked)}
                />
                Clipboard was blocked. I have copied this password myself.
              </label>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" id="copy-created-password" onClick={copyCreatedPassword}>
                {createdCopied && !copyFailed ? "Copied" : "Copy password"}
              </Button>
              <Button type="button" variant="outline" disabled={!createdCopied} onClick={closeCreate}>
                {createdCopied ? "Done" : "Copy to close"}
              </Button>
            </div>
            <p className="text-xs text-stone-500">The user must change this password on first login.</p>
          </div>
        ) : (
          <form onSubmit={createUser} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="create-name">Full name</Label>
              <Input
                id="create-name"
                required
                minLength={2}
                autoComplete="name"
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
                autoComplete="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => {
                  const on = createForm.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleCreateRole(role)}
                      className={
                        on
                          ? "rounded-full border border-blue-700 bg-blue-700 px-3 py-1.5 text-xs font-medium text-white"
                          : "rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-blue-300"
                      }
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={closeCreate}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create user"}
              </Button>
            </div>
          </form>
        )}
      </StudioModal>
    </div>
  );
}
