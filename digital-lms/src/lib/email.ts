import { getSettings } from "@/models/Settings";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send email via Resend (if RESEND_API_KEY / settings) or SMTP-compatible webhook.
 * Falls back to console.log in development when no provider is configured.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; skipped?: boolean }> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { ok: false };

  const resendKey =
    process.env.RESEND_API_KEY ||
    (await getSettings().then((s) => (s as { resendApiKey?: string }).resendApiKey).catch(() => ""));
  const from =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM ||
    "Digital Penang LMS <onboarding@resend.dev>";

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: input.subject,
          html: input.html,
          text: input.text || stripHtml(input.html),
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("[email] Resend failed", res.status, err);
        return { ok: false };
      }
      return { ok: true };
    } catch (err) {
      console.error("[email] Resend error", err);
      return { ok: false };
    }
  }

  // Dev / no-provider fallback — still "succeeds" so flows aren't blocked
  console.info("[email:dev]", { to, subject: input.subject, text: input.text || stripHtml(input.html) });
  return { ok: true, skipped: true };
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
