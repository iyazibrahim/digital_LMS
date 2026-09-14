"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

type Note = {
  _id: string;
  title: string;
  body: string;
  href?: string;
  readAt?: string;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotes(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ markAllRead: true }),
    });
    void load();
  }

  async function markOne(id: string, href?: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    if (href) window.location.href = href;
    else void load();
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="relative px-2"
        aria-label="Notifications"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void load();
        }}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-stone-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2">
              <p className="text-sm font-medium text-stone-800">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  className="text-xs text-blue-700 hover:underline"
                  onClick={() => void markAll()}
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notes.map((n) => (
                <li key={n._id}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2.5 text-left hover:bg-stone-50 ${
                      !n.readAt ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => {
                      setOpen(false);
                      void markOne(n._id, n.href);
                    }}
                  >
                    <p className="text-sm font-medium text-stone-900">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-stone-500">{n.body}</p>
                  </button>
                </li>
              ))}
              {!notes.length && (
                <li className="px-3 py-6 text-center text-sm text-stone-400">No notifications yet</li>
              )}
            </ul>
            <div className="border-t border-stone-100 px-3 py-2">
              <Link
                href="/dashboard"
                className="text-xs text-blue-700 hover:underline"
                onClick={() => setOpen(false)}
              >
                Open My Learning
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
