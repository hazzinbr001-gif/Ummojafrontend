# WinMoja Campaign Management Platform

## Overview

Full-stack campaign management platform for any MP candidate. Works for any constituency — candidate details entered during first-time onboarding setup.

## Stack

- **Monorepo**: pnpm workspaces
- **Node.js**: 24
- **Frontend**: React + Vite + Tailwind (deep navy + green WinMoja theme), Shadcn UI, Wouter router
- **Backend**: Express 5, session-based auth (express-session + bcrypt)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **Build**: esbuild (API server), Vite (frontend)

## Artifacts

- `artifacts/winmoja` — React frontend, served at `/` (port from `PORT` env)
- `artifacts/api-server` — Express API server, served at `/api` (port 8080)
- `lib/db` — Drizzle schema + DB client
- `lib/api-client-react` — Hand-written React Query hooks for all API endpoints

## Features (10 Pages)

1. **Onboarding** — First-time setup wizard: candidate info, wards, admin account
2. **Dashboard** — Live ward intelligence map, support percentages, key stats
3. **Voters** — IEBC voter database with search/filter, support tracking
4. **Requests** — Constituent requests (bursaries, medical, business, school fees)
5. **Broadcasts** — Campaign broadcast channel (announcements, rallies, alerts)
6. **Referrals** — Viral sharing + supporter leaderboard with airtime rewards
7. **Volunteers** — Ward volunteers and polling agents management
8. **Finance** — Income/expenditure tracking with category breakdown
9. **Manifesto** — Policy pledges with fulfillment status tracking
10. **Election Day** — Real-time voter turnout + mobilization dashboard
11. **Users** — Admin-only user management (roles: admin, coordinator, viewer)

## Database Tables

`campaign_config`, `users`, `voters`, `constituent_requests`, `broadcasts`, `referrals`, `volunteers`, `finance_transactions`, `manifesto_items`, `activity_log`

## Auth Flow

- Session-based via `express-session` + `SESSION_SECRET` env var
- First visit: Onboarding wizard (no login required to set up)
- After setup: Login required for all pages
- Roles: `admin` (full access), `coordinator`, `viewer`

## Key Commands

- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/db run push-force` — force push (reset enums)

## Environment Secrets

- `SESSION_SECRET` — cookie signing secret
- `DATABASE_URL` — automatically provisioned PostgreSQL connection string
