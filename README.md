# Digital Penang LMS

Clean-room, lighter clone of **Frappe Learning** for **https://lms.iyazbrhm.cloud**.

Stack: **Next.js (App Router) + TypeScript + Tailwind + MongoDB + JWT** — no Frappe Framework, MariaDB, Redis, or bench.

## Features

- Courses → chapters → lessons (video, PDF, rich text)
- Quizzes (single / multi / open) + proctoring violations
- Assignments with file upload + grading
- Programming exercises
- SCORM chapters
- Live batches, timetable, announcements, Zoom/Meet live classes
- Certificates (auto on completion)
- Programs, discussions, analytics
- Job board + applications
- Stripe checkout (optional) + coupons
- Evaluator slot booking

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

Accounts are **auto-created on first DB connect** (manual `npm run seed` is optional).

### Seed accounts (ENV)

| Role | Email | Password | ENV |
|------|-------|----------|-----|
| Admin | admin@digitalpenang.my | admin123 | `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` |
| Instructor | instructor@digitalpenang.my | instructor123 | `SEED_INSTRUCTOR_*` |
| Student | student@digitalpenang.my | student123 | `SEED_STUDENT_*` |

Set `SEED_RESET_ADMIN_PASSWORD=1` to force-reset the admin password from ENV on next boot.

## Production (Docker)

From repo root:

```bash
cp .env.example .env
docker compose up -d --build
```

App publishes on **8090** for Cloudflare Tunnel → `lms.iyazbrhm.cloud`.

## Project layout

| Path | Role |
|------|------|
| `digital-lms/` | Next.js application |
| `docker-compose.yml` | `app` + `mongo` |
| `workflow.md` | Project status log |

## Notes

- Behavior-compatible with Frappe LMS; not a source copy (AGPL).
- Do not commit real `.env` secrets.
