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

1. Start MongoDB (`docker compose up -d mongo` or full stack).
2. Open the app — admin/student accounts auto-seed from ENV on first DB connect.
3. Log in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (defaults: admin@digitalpenang.my / admin123).
4. Point Cloudflare Tunnel at host `:8090` when deploying.
5. Add Stripe/Zoom credentials in Studio → Settings if needed.

### 2026-09-10 — Blue/white theme + auto-seed

- Replaced teal/green palette with Digital Penang blue + white.
- `ensureSeed()` runs on every DB connect; creates admin/demo users from ENV.
- Login returns 503 (not 500) when MongoDB is unreachable.

### 2026-09-10 — Fix production login 500 (Dokploy)

- Hardened `/api/auth/login` + `/api/health`.

### 2026-09-10 — Real login 500 + port 8090

- Root cause of 500: `DataCloneError` — Mongoose `roles` array passed into jose/`NextResponse.json`. Fixed with plain `Array.from` + string ids.
- App now listens on **8090** (Dockerfile `PORT=8090`) so Dokploy domain + Cloudflare Tunnel stay on 8090; avoid conflict with Dokploy’s own 3000.
- Mongo logs show healthy; auth was the app bug.

### 2026-09-10 — Studio CMS complete

- Fixed Studio re-login (`?next=` + secure cookies from `NEXT_PUBLIC_APP_URL`).
- Dedicated Studio shell (aligned brand/sidebar, mobile drawer); marketing chrome hidden on `/studio`.
- Course builder: outline CMS + TipTap + YouTube/PDF + quiz/assignment/exercise links.
- SCORM: drag-drop upload, unzip via `adm-zip`, imsmanifest launch path (`/api/scorm/packages`).
- Studio CRUD: edit/delete for assignments, exercises, quizzes, batches, programs, jobs; user activate/deactivate.
- Removed Frappe marketing copy; LMS product wording on home + README.

