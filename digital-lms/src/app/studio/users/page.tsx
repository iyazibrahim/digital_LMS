"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load(query = q) {
    const res = await fetch(`/api/users${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    if (res.ok) setUsers(data.users || []);
    else setError(data.error || "Failed to load users");
  }

  useEffect(() => {
    void load();
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
    setMessage(`Updated ${data.user.name}`);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-teal-950">Users</h1>
        <p className="text-stone-600">Search learners and change roles (admin).</p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load();
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
      {message && <p className="text-sm text-teal-800">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Roles</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
