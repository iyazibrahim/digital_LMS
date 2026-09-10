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
  enableBulletin: boolean;
  enablePrograms: boolean;
  enableDiscussions: boolean;
  minWatchPercent: number;
  minReadSeconds: number;
  minScormSeconds: number;
  defaultCertificateHtml: string;
  zoomAccountId?: string;
  zoomClientId?: string;
  zoomClientSecret?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
};

const defaults: Settings = {
  siteName: "Digital Penang LMS",
  tagline: "",
  logoUrl: "",
  allowGuestAccess: true,
  allowSignup: true,
  primaryColor: "#1D4ED8",
  enablePayments: false,
  enableBulletin: true,
  enablePrograms: true,
  enableDiscussions: true,
  minWatchPercent: 80,
  minReadSeconds: 20,
  minScormSeconds: 30,
  defaultCertificateHtml: "",
  zoomAccountId: "",
  zoomClientId: "",
  zoomClientSecret: "",
  stripePublishableKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
};

export default function StudioSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const s = d.settings || d;
        if (s?.siteName != null) {
          setSettings({
            ...defaults,
            ...s,
            enableBulletin: s.enableBulletin ?? s.enableJobBoard !== false,
            minWatchPercent: s.minWatchPercent ?? 80,
            minReadSeconds: s.minReadSeconds ?? 20,
            minScormSeconds: s.minScormSeconds ?? 30,
          });
        } else {
          setError(d.error || "Failed to load settings");
          setSettings({ ...defaults });
        }
      })
      .catch(() => {
        setError("Failed to load settings");
        setSettings({ ...defaults });
      });
  }, []);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setLoading(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Only admins can update settings");
      return;
    }
    const s = data.settings || data;
    setSettings({ ...defaults, ...s });
    setMessage("Settings saved.");
  }

  if (!settings) {
    return <p className="text-stone-500">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-blue-950">Site settings</h1>
        <p className="text-stone-600">Brand, access, learning rules, and integrations.</p>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:row-span-2">
            <CardHeader>
              <CardTitle className="font-serif">Brand</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Site name</Label>
                <Input value={settings.siteName} onChange={(e) => set("siteName", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Tagline</Label>
                <Input value={settings.tagline} onChange={(e) => set("tagline", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Logo URL</Label>
                <Input value={settings.logoUrl || ""} onChange={(e) => set("logoUrl", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Primary color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    className="h-10 w-14 p-1"
                    value={settings.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)}
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  ["allowGuestAccess", "Allow guest browsing"],
                  ["allowSignup", "Allow public sign-up"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!settings[key]}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  ["enablePayments", "Enable payments"],
                  ["enableBulletin", "Enable bulletin"],
                  ["enablePrograms", "Enable programs"],
                  ["enableDiscussions", "Enable discussions"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!settings[key]}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Learning rules</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Min watch %</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.minWatchPercent}
                  onChange={(e) => set("minWatchPercent", Number(e.target.value) || 80)}
                />
              </div>
              <div className="space-y-1">
                <Label>Min read seconds</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.minReadSeconds}
                  onChange={(e) => set("minReadSeconds", Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label>Min SCORM seconds</Label>
                <Input
                  type="number"
                  min={0}
                  value={settings.minScormSeconds}
                  onChange={(e) => set("minScormSeconds", Number(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif">Integrations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Zoom</p>
                <div className="space-y-1">
                  <Label>Account ID</Label>
                  <Input
                    value={settings.zoomAccountId || ""}
                    onChange={(e) => set("zoomAccountId", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Client ID</Label>
                  <Input
                    value={settings.zoomClientId || ""}
                    onChange={(e) => set("zoomClientId", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Client secret</Label>
                  <Input
                    type="password"
                    placeholder="Leave blank to keep"
                    value={settings.zoomClientSecret || ""}
                    onChange={(e) => set("zoomClientSecret", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Stripe</p>
                <div className="space-y-1">
                  <Label>Publishable key</Label>
                  <Input
                    value={settings.stripePublishableKey || ""}
                    onChange={(e) => set("stripePublishableKey", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Secret key</Label>
                  <Input
                    type="password"
                    placeholder="Leave blank to keep"
                    value={settings.stripeSecretKey || ""}
                    onChange={(e) => set("stripeSecretKey", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Webhook secret</Label>
                  <Input
                    type="password"
                    placeholder="Leave blank to keep"
                    value={settings.stripeWebhookSecret || ""}
                    onChange={(e) => set("stripeWebhookSecret", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="font-serif">Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Default certificate HTML</Label>
              <Textarea
                className="mt-1 font-mono text-xs"
                rows={8}
                value={settings.defaultCertificateHtml}
                onChange={(e) => set("defaultCertificateHtml", e.target.value)}
              />
              <p className="mt-1 text-xs text-stone-500">
                Placeholders: {"{{recipientName}}"}, {"{{courseTitle}}"}, {"{{issuedAt}}"},{" "}
                {"{{certificateNumber}}"}
              </p>
            </CardContent>
          </Card>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
