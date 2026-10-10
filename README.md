# Ping Admin — Admin Dashboard

Web panel for moderating the Ping dating app: users, reports, audit log, support
inbox, and live stats. Built with React 19 + TypeScript + MUI v9, themed to the
Ping design system (magenta/coral, pill buttons, Fredoka + Inter).

## Quick start

```bash
# 1 — backend (pingbckd/)
cd ../pingbckd && npm run dev          # serves /api/v1 on :5000

# 2 — admin panel (this folder)
npm install
cp .env.example .env                   # REACT_APP_API_BASE=http://localhost:5000
npm start                              # http://localhost:3000
```

Sign in with an admin created via the backend CLI:

```bash
cd ../pingbckd
npm run admin:create -- --email admin@yourdomain.com --password '<strong-password>'
# → prints otpauth:// URI + recovery codes ONCE — store them
```

## What's inside

| Route | Screen | Notes |
|---|---|---|
| `/login` | Credentials → MFA | Two-step per the backend contract; locked-account + recovery-code aware |
| `/` | Dashboard | KPI cards (60s cache), signups/matches line charts, reports donut — IST bucketing |
| `/users` | User directory | Search/filter/sort/paginate; ban (reason + silent-ban notice), unban, verify, soft-delete; detail drawer with photos, report counts, ban history |
| `/reports` | Moderation queue | Status/reason filters; review + patch; **Action report** (ban + close in one server-side tx); audit-logged conversation viewer with chat bubbles + "load older" |
| `/audit` | Audit log | Action/target/UUID/date filters; append-only |
| `/support` | Complaints & feedback | Status/type chips, acknowledge + resolve with admin response — **backend endpoints pending** (page detects 404 and says so) |
| `/settings` | Session & security | Session facts, security model, admin lifecycle CLI reference |

## Architecture

```
src/
  services/api.ts        Axios client: envelope unwrap, 401 → refresh-once → retry,
                         auth-failure hook → global logout. All endpoints typed.
  store/slices/authSlice  'loading' | 'unauthenticated' | 'mfa_pending' | 'authenticated'
  hooks/useAuth.ts        login / verifyMfa / logout / restoreSession
  theme/muiTheme.ts       Ping palette → MUI theme
  components/
    layout/               Sidebar · TopBar · ProtectedRoute · MainLayout
    ui/                   DataTable · StatusChip · ConfirmModal · StatCard ·
                          StateViews (loading/empty/error) · PageHeader
  pages/                  auth · dashboard · users · reports · audit · support · settings
```

Conventions:
- **Every screen** handles loading / empty / error states (PRD Phase 5).
- **Every mutation** shows a confirm modal, disables its CTA while pending, and
  surfaces the server's `message` from the error envelope inline.
- **No direct axios in pages** — everything goes through `services/api.ts`.
- Tokens live in `localStorage` (`ping_admin_access` / `ping_admin_refresh`);
  the access token auto-refreshes transparently.

## Backend contract

Mirrors `pingbckd/ADMIN.md` exactly:
`POST /admin/auth/{login,mfa/verify,refresh,logout}`, `GET|POST|PATCH|DELETE
/admin/users*`, `GET|PATCH|POST /admin/reports*` (+ `/conversation`),
`GET /admin/audit-log`, `GET /admin/stats/{overview,signups,matches}`.

CORS: set `CORS_ORIGIN=http://localhost:3000` in `pingbckd/.env` for local dev.

## Build

```bash
npm run build    # → build/ (static, deployable behind Cloudflare Access)
```
