# Digital Penang LMS

Modern learning platform for **https://lms.iyazbrhm.cloud**.

Stack: **Next.js (App Router) + TypeScript + Tailwind + MongoDB + JWT**.

## Features

- Courses → chapters → lessons (text, YouTube/video, PDF)
- Quizzes (single / multi / open) + tab-switch logging; open answers need instructor review
- Assignments with file upload + grading + due dates
- Programming exercises (practice checks — not a full sandbox)
- SCORM package upload (unzip + launch)
- Live batches, timetable, announcements (emailed), Zoom/Meet live classes, roster, attendance
- Cohort applications, mentor notes, batch forums
- Certificates (auto on completion) + public `/verify/[code]`
- Programs with enforced course order, discussions, analytics (at-risk + per-course)
- Job board + applications (separate from Bulletin)
- Stripe checkout (optional) + coupons Studio UI
- Evaluator slot booking
- My Learning dashboard, calendar, notifications, forgot password
- Google / Microsoft SSO (optional), AI quiz drafts (optional OpenAI)
- Studio CMS for instructors and admins (incl. Gradebook)

## Local development

```bash
# start MongoDB (Docker)
docker compose up -d mongo

cd digital-lms
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

Accounts are **auto-created on first DB connect** when seed env vars are set (manual `npm run seed` is optional).

### Seed accounts (ENV)

Set these in `.env.local` (local) or Dokploy / Compose `.env` (production). Leave a role blank to skip it.

| Role | Email env | Password env | Name env |
|------|-----------|--------------|----------|
| Admin | `SEED_ADMIN_EMAIL` | `SEED_ADMIN_PASSWORD` | `SEED_ADMIN_NAME` |
| Instructor | `SEED_INSTRUCTOR_EMAIL` | `SEED_INSTRUCTOR_PASSWORD` | `SEED_INSTRUCTOR_NAME` |
| Student | `SEED_STUDENT_EMAIL` | `SEED_STUDENT_PASSWORD` | `SEED_STUDENT_NAME` |

Do not commit real emails or passwords. Set `SEED_RESET_ADMIN_PASSWORD=1` to force-reset the admin password from ENV on next boot, then set it back to `0`.

## Production (Docker / Dokploy)

From repo root:

```bash
cp .env.example .env
docker compose up -d --build
```

App listens on **8090** (same as Cloudflare Tunnel). Local `npm run dev` still uses **3000**.

### Dokploy domain settings

| Field | Value |
|--------|--------|
| Domain | `lms.iyazbrhm.cloud` |
| Port | **8090** |
| Path | `/` |

Do **not** use port 3000 for this app — Dokploy often uses 3000 itself.

Environment must include:

```
MONGODB_URI=mongodb://mongo:27017/digital-lms
SEED_ADMIN_EMAIL=<your-admin-email>
SEED_ADMIN_PASSWORD=<strong-password>
SHOW_ERROR_DETAILS=0
NEXT_PUBLIC_APP_URL=https://lms.iyazbrhm.cloud
```

After a successful login, keep `SEED_RESET_ADMIN_PASSWORD=0` unless you intend to reset the admin password from ENV.

Health check: `https://lms.iyazbrhm.cloud/api/health`
