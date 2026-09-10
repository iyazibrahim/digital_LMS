import { getSettings } from "@/models/Settings";

export async function createZoomMeeting(opts: {
  topic: string;
  startAt: Date;
  durationMinutes: number;
}): Promise<{ id: string; joinUrl: string } | null> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  let aid = accountId;
  let cid = clientId;
  let secret = clientSecret;

  if (!aid || !cid || !secret) {
    try {
      const settings = await getSettings();
      aid = aid || settings.zoomAccountId;
      cid = cid || settings.zoomClientId;
      secret = secret || settings.zoomClientSecret;
    } catch {
      /* ignore */
    }
  }

  if (!aid || !cid || !secret) return null;

  const basic = Buffer.from(`${cid}:${secret}`).toString("base64");
  const tokenRes = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${aid}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${basic}` },
    }
  );
  if (!tokenRes.ok) return null;
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string;

  const meetingRes = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: opts.topic,
      type: 2,
      start_time: opts.startAt.toISOString(),
      duration: opts.durationMinutes,
      settings: { join_before_host: true },
    }),
  });
  if (!meetingRes.ok) return null;
  const meeting = await meetingRes.json();
  return { id: String(meeting.id), joinUrl: meeting.join_url };
}
