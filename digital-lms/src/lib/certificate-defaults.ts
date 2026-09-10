export const DEFAULT_CERT_HTML = `<div class="cert">
  <p class="eyebrow">Digital Penang LMS</p>
  <h1>Certificate of Completion</h1>
  <p>This certifies that</p>
  <h2>{{recipientName}}</h2>
  <p>has successfully completed</p>
  <h3>{{courseTitle}}</h3>
  <p class="meta">Issued on {{issuedAt}} · No. {{certificateNumber}}</p>
</div>`;

export const DEFAULT_CERT_CSS = `.cert{max-width:900px;margin:40px auto;padding:48px;border:8px solid #1D4ED8;text-align:center;background:#fff}
.eyebrow{letter-spacing:.2em;text-transform:uppercase;color:#1D4ED8;font-size:12px}
h1{font-size:36px;color:#0f172a;margin:16px 0}
h2{font-size:28px;color:#1D4ED8;margin:12px 0}
h3{font-size:22px;color:#334155}
.meta{margin-top:28px;color:#64748b;font-size:14px}`;
