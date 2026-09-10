# Digital Penang LMS — Workflow

## Project

- **Name:** Digital Penang LMS
- **Domain:** `lms.iyazbrhm.cloud`
- **Stack:** Next.js App Router + TypeScript + Tailwind + MongoDB + JWT (lighter Frappe Learning clone)
- **Deploy:** Docker Compose (`app` + `mongo`) + Cloudflare Tunnel `:8090`
- **Git remote:** https://github.com/iyazibrahim/digital_LMS.git

## Decisions

- Abandoned heavy Frappe/bench/MariaDB/Redis stack in favor of a clean-room Next.js rebuild.
- Functional parity with Frappe Learning pillars: courses, content types (incl. SCORM), batches/live, certificates, job board + extras (programs, discussions, analytics, Stripe, exercises, proctoring, evaluations).
- Roles: `admin`, `instructor`, `evaluator`, `student`.
- JWT in httpOnly cookies.

## Completed

### 2026-09-10 — Switch to official LMS docker wrap (superseded)

- Earlier Frappe Docker wrap replaced by Next.js rewrite.

### 2026-09-10 — Next.js LMS foundation + full feature modules

- Scaffolded `digital-lms/` Next.js app with Mongo models and JWT auth.
- Implemented courses/chapters/lessons, quizzes, assignments, batches/live, certificates, jobs, programs, discussions, SCORM progress, analytics, Stripe checkout hooks, programming exercises, quiz proctoring logs, evaluator slots.
- Replaced root `docker-compose.yml` with `app` + `mongo`.
- Seed script + README/workflow updated.

### 2026-09-10 — Studio staff console + public learner pages

- Added `/studio` layout (staff gate + `StudioNav`) and pages: overview, courses (CRUD + chapters/lessons/SCORM), quizzes, assignments, exercises, batches, certificates, programs, jobs/applications, users, analytics (recharts), evaluations, settings.
- Supporting APIs: analytics, uploads (SCORM zip), exercises, programs, jobs apply/applications, users, settings, evaluations, certificates/issue, profile, batch enrollments.
- Public pages: programs, jobs (+ apply), printable certificates, profile (enrollments/certificates). Batches pages already present.
- Build: `npm run build` passed.

## Next steps

1. `docker compose up -d mongo` (or full stack) and `npm run seed` locally.
2. Confirm http://localhost:3000 and Studio at `/studio`.
3. Point Cloudflare Tunnel at host `:8090` when deploying compose `app`.
4. Add Stripe/Zoom credentials in Studio → Settings for paid courses and Zoom meetings.
