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
3. Set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in ENV, then log in with those values.
4. Point Cloudflare Tunnel at host `:8090` when deploying.
5. Add Stripe/Zoom credentials in Studio → Settings if needed.

### 2026-09-10 — Logout soft-nav + backup sign-in

- **Root cause (runtime):** Next.js `<Link href="/api/auth/logout">` soft-navigates; logout API never hard-loads. Tokens clear (`ssAccess:false`) but header stays Admin/Studio/Log out; URL stays `/`.
- **Fix:** `preventDefault` + `window.location.assign('/api/auth/logout')` in site header + studio; remove backup Sign in button from login form.
- **Evidence:** Chrome DevTools on `lms.iyazbrhm.cloud` after Log out click.
- Debug instrumentation removed after user confirmed fix.

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

### 2026-09-10 — Student session 401 fix

- Longer JWT cookie TTL (7d / 30d); `COOKIE_SECURE` from env + `x-forwarded-proto`.
- Login verifies `/api/auth/me` before navigate; `/api/auth/me` re-issues cookies.
- Profile / enroll buttons: `credentials: same-origin` + redirect `/login?next=...` on 401.

### 2026-09-10 — Admin Studio bugfixes + certificates

- Studio re-login: hydrate roles from DB; login auto-continues if session exists; staff vs unauth redirects split.
- Marketing chrome uses client `usePathname` (fixes missing header after “View site”).
- Quiz/Batch edit: parse API payloads correctly (was stuck on Loading).
- Analytics: return `counts`/`series`, show errors instead of infinite loading.
- Certificates: HTML/CSS/PNG templates with placeholders, badges auto-award on course complete.

### 2026-09-10 — LMS Core + Admin alignment

- **Lesson gating:** Heartbeat progress API; Next/Mark complete locked until video ~80%, reading scroll+dwell, quiz pass, assignment/exercise submit, or SCORM dwell. Course sidebar sequentially locked; sticky sidebars on learn + Studio (main content scrolls).
- **Settings:** Fixed `{ settings }` API shape; bento UI (brand, access, features, learning rules, Zoom/Stripe, certificates); allowlist PATCH; `allowSignup` enforced; `enableBulletin`.
- **Pagination:** Shared Studio pager on courses/quizzes/assignments/exercises/batches/programs/bulletin/users/evaluations; users search wired.
- **Password reset:** Admin generates temp password with copy modal; `mustChangePassword` forced on login/profile.
- **Evaluations:** Booking flow — staff publish slots (overlap check), learners book/cancel at `/evaluations`, staff pass/fail (cert on pass when enabled).
- **Exercises:** Kinds coding / short_answer / written / file.
- **Jobs → Bulletin:** Public `/bulletin`, Studio CRUD, `/jobs` redirects; nav + home copy updated.
- **Profile:** Role-aware layouts (student stats/learning vs staff Studio snapshot) + password change.
- Build: `npm run build` passed.

### 2026-09-11 — Basic security checklist hardening

- **Auth cookies only:** Removed JWT from `sessionStorage` / readable `document.cookie`; login/`/api/auth/me` no longer return tokens; `authFetch` uses `credentials: "include"`.
- **Inactive users:** `hydratePayload` rejects `isActive === false`.
- **XSS:** `sanitizeHtml` (isomorphic-dompurify) on lesson/bulletin store + render.
- **Headers:** HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in `next.config.ts`.
- **Rate limit:** In-memory limiter on login (10/min) and register (5/min).
- **Uploads:** MIME/size allowlist; store under `storage/uploads` (not `public/`); serve via authenticated `/uploads/[...path]`; SCORM zip-slip safe extract.
- **IDOR:** Certificates API requires owner/staff; exercise answers stripped for students; `/api/health` returns ok/status only.
- **Ops:** Production rejects weak JWT secrets; Compose defaults `COOKIE_SECURE=1`, `SHOW_ERROR_DETAILS=0`, required JWT secrets; Dependabot + `npm audit` workflow.
- Build: `npm run build` passed.

### 2026-09-11 — Admin-only signup + create users

- Studio Settings Access: clearer **Allow public sign-up** toggle with helper text linking to Users; amber notice when off.
- Public CTAs hidden when `allowSignup` is false (home, header Get started, login Register). `/register` shows a closed message; API still returns 403.
- Studio Users: admin **Create user** form (name, email, roles). Generates a temporary password (`mustChangePassword`) with copy banner. POST `/api/users` is admin-only.
- Build: `npm run build` passed.
### 2026-09-11 — Create user modal with copy-before-close

- Studio Users: **Create user** opens a modal form instead of an inline card.
- After create, the generated password is shown in the same modal. Overlay, Escape, X, and Done stay locked until the admin copies it (clipboard fallback checkbox if copy is blocked).

### 2026-09-14 — Remove hardcoded seed credentials

- Login page no longer shows demo emails/passwords.
- Seed users are created only from `SEED_*_EMAIL` / `SEED_*_PASSWORD` env vars (no hardcoded fallbacks). Compose and `.env.example` leave those blank.
- README/workflow document env var names instead of real credentials.

### 2026-09-14 — Competitive roadmap implementation (Phases 1–4)

Incubator + academic ops parity against Frappe Learning / Classroom / TalentLMS gaps:

**Phase 1 — Daily use**
- Forgot / reset password (`/forgot-password`, `/reset-password`, token model + email)
- In-app notification bell + email via Resend (or console fallback)
- My Learning dashboard (`/dashboard`); logged-in `/` redirects there
- Course catalog search / category / tag filters
- Restored public Jobs board (Bulletin stays news); Settings `enableJobs`

**Phase 2 — Cohort ops**
- Studio Gradebook (assignment inbox + open-quiz review + course roster CSV)
- Due dates on quizzes/assignments; learner `/calendar` + ICS download
- Batch roster invite/bulk-add/drop; real attendance present/absent/late/excused
- Program `enforceOrder` hard gating on enroll + learn player
- Batch announcements email the cohort

**Phase 3 — Incubator**
- Cohort applications (requireApplication → staff accept/waitlist/reject)
- Mentor notes API + Studio batch UI
- Batch cohort forum
- Studio Coupons UI; certificate `/verify/[code]`; analytics at-risk + per-course

**Phase 4 — Polish**
- Google / Microsoft SSO (env or Settings credentials)
- AI quiz draft endpoint + New Quiz UI (OpenAI or editable templates)
- Honest copy for tab-switch monitoring and coding “practice checks”
- Learn player mobile order (content first)

Validation: `npm run build` passed.

