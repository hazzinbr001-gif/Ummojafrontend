# WinMoja — Frontend

React + Vite web application for the WinMoja Campaign Management Platform. A full-featured campaign dashboard for MP candidates covering voters, constituent requests, finance, volunteers, manifesto, broadcasts, referrals, and election-day monitoring.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Shadcn UI (Radix primitives) |
| Router | Wouter |
| Data Fetching | React Query (TanStack) |
| API Hooks | `lib/api-client-react` (auto-generated) |
| Package Manager | pnpm workspaces |

## Project Structure

```
├── artifacts/winmoja/        # React + Vite app
│   ├── src/
│   │   ├── pages/            # One file per page/route
│   │   │   ├── Onboarding.tsx    # First-time setup wizard
│   │   │   ├── Dashboard.tsx     # Live ward intelligence map
│   │   │   ├── Voters.tsx        # IEBC voter database + CSV import
│   │   │   ├── Requests.tsx      # Constituent requests
│   │   │   ├── Broadcasts.tsx    # Campaign broadcasts
│   │   │   ├── Referrals.tsx     # Viral sharing + leaderboard
│   │   │   ├── Volunteers.tsx    # Volunteers & polling agents
│   │   │   ├── Finance.tsx       # Income / expenditure
│   │   │   ├── Manifesto.tsx     # Policy pledges
│   │   │   ├── ElectionDay.tsx   # Real-time turnout dashboard
│   │   │   └── Users.tsx         # User management (admin)
│   │   ├── components/
│   │   │   ├── Layout.tsx        # Sidebar + nav shell
│   │   │   └── ui/               # Shadcn UI components
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Session / login state
│   │   │   └── CampaignConfigContext.tsx  # Global campaign config
│   │   ├── App.tsx               # Router & auth guard
│   │   └── main.tsx              # Entry point
│   └── vite.config.ts
└── lib/api-client-react/     # React Query hooks for all API endpoints
    └── src/generated/api.ts
```

## Pages

| Page | Route | Description |
|------|-------|-------------|
| Onboarding | /onboarding | First-time setup — candidate info, wards, admin account |
| Dashboard | / | Live ward map, support %, key stats |
| Voters | /voters | IEBC voter database with search, filter, CSV import |
| Requests | /requests | Bursaries, medical, business, school fee requests |
| Broadcasts | /broadcasts | Announcements, rally alerts, campaign updates |
| Referrals | /referrals | Viral sharing + supporter leaderboard with airtime rewards |
| Volunteers | /volunteers | Ward volunteers and polling agents |
| Finance | /finance | Income/expenditure with category breakdown |
| Manifesto | /manifesto | Policy pledges with fulfillment status |
| Election Day | /election-day | Real-time voter turnout + mobilization |
| Users | /users | Admin-only user management |

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 9+
- WinMoja API server running (see backend repo)

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm --filter @workspace/winmoja run dev
```

The app starts on port 3000 (or the `PORT` env variable) and expects the API server at `/api`.

## Design

- **Theme**: Deep navy (`#0f2352`) + green (`#16a34a`) WinMoja brand colours
- **Layout**: Fixed sidebar with collapsible nav, responsive mobile support
- **Auth guard**: Redirects unauthenticated users to login; first-time visitors to onboarding

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Dev server port (default: 3000) |
| `VITE_API_BASE` | No | API base URL (defaults to `/api` via proxy) |
