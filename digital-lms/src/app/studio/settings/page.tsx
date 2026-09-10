"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Settings = {
  siteName: string;
  tagline: string;
  logoUrl?: string;
  allowGuestAccess: boolean;
  allowSignup: boolean;
  primaryColor: string;
  enablePayments: boolean;
  enableJobBoard: boolean;
  enablePrograms: boolean;
  enableDiscussions: boolean;
  defaultCertificateHtml: string;
  zoomAccountId?: string;
  zoomClientId?: string;
  stripePublishableKey?: string;
};

export default function StudioSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Only admins can update settings");
      return;
    }
    setSettings(data.settings);
    setMessage("Settings saved.");
  }

  if (!settings) return <p className="text-stone-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-teal-950">Site settings</h1>
        <p className="text-stone-600">Brand, features, and certificate template.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">General</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>Site name</Label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={settings.logoUrl || ""}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Primary color</Label>
              <Input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              />
            </div>
            {(
              [
                ["allowGuestAccess", "Allow guest access"],
                ["allowSignup", "Allow signup"],
                ["enablePayments", "Enable payments"],
                ["enableJobBoard", "Enable job board"],
                ["enablePrograms", "Enable programs"],
                ["enableDiscussions", "Enable discussions"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(settings[key])}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                />
                {label}
              </label>
            ))}
            <div className="space-y-2">
              <Label>Default certificate HTML</Label>
              <Textarea
                className="min-h-[160px] font-mono text-xs"
                value={settings.defaultCertificateHtml}
                onChange={(e) =>
                  setSettings({ ...settings, defaultCertificateHtml: e.target.value })
                }
              />
            </div>
            {message && <p className="text-sm text-teal-800">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
