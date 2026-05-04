# Hyva Transport — Feature Documentation

> **Last Updated:** 2026-05-04  
> This document tracks all implemented features, pending improvements, and future roadmap items.

---

## ✅ Implemented Features

### Authentication & Access Control
- [x] Email + password login via NextAuth v5
- [x] JWT-based sessions with role data (`SUPER_ADMIN`, `ORG_ADMIN`, `OWNER`)
- [x] Edge middleware (proxy) guards all routes — no server-component redirects
- [x] Role-based routing: Admins → `/dashboard`, Super Admins → `/platform`, Owners → `/owner`
- [x] Forced password change on first login (`mustChangePassword` flag)
- [x] Owner portal with read-only trip/expense view + sign-out

### Platform Admin (`/platform`)
- [x] Super Admin dashboard for managing transporter organisations
- [x] Onboard new transporters with admin user creation
- [x] View all transporters with trip/revenue stats

### Dashboard Analytics (`/dashboard`)
- [x] Server-side SSR initial load for instant render
- [x] Period filter: All Time / 7d / 30d / 90d / This Month / This Year / Custom Range
- [x] Entity filters: by Project, Owner, Vehicle (cascaded)
- [x] 6-tab layout: Overview · Revenue · Expenses · Vehicles · Projects · Owners
- [x] Pure CSS charts: Area, Bar, Donut, Horizontal Bar (no external chart library)
- [x] KPI cards: Revenue, Expenses, Net Profit, Trips, Weight, Margin, Vehicles, Owners, Projects
- [x] Trend analysis with switchable metrics (revenue/trips/expenses/weight)
- [x] Weekly aggregation for time-series when >30 data points
- [x] Sortable tables in all tabs
- [x] Recent trips and recent expenses activity feed

### Vehicle Owners (`/dashboard/owners`)
- [x] Owner profile cards with avatar, contact info, and status badge
- [x] Per-owner financial summary: Revenue, Expenses, Advances, Net Payable
- [x] Payout progress bar (advances + settlements vs total revenue)
- [x] Revenue share bar across all owners
- [x] Vehicle breakdown per owner (trips, revenue, profit per plate)
- [x] Login credentials display with password change status
- [x] Search by name or phone
- [x] Aggregated stat cards across all owners
- [x] Owner analytics modal (per-project and per-vehicle breakdown)
- [x] Edit / Delete owners
- [x] Owner advance management (add, edit, delete) inside analytics modal

### Trips (`/dashboard/trips`)
- [x] Log trips with vehicle, project, date, weight, party rate, owner rate
- [x] Invoice No and LR No fields
- [x] Filter by vehicle, project, date range
- [x] Edit and delete trips
- [x] Bulk view with sortable table

### Expenses (`/dashboard/expenses`)
- [x] Log vehicle expenses by category (Fuel, Maintenance, Toll, Driver Advance, Cash Payment, Other)
- [x] Filter by type, vehicle, project, date range
- [x] Edit and delete expenses
- [x] CSV export

### Vehicles (`/dashboard/vehicles`)
- [x] Register vehicles with plate number, owner assignment, and active project
- [x] Search by plate number or owner
- [x] Edit vehicle (plate, owner, project assignment)
- [x] Delete vehicle (with guard if trips exist)
- [x] Duplicate plate number check

### Projects (`/dashboard/projects`)
- [x] Create projects with name and rate configuration
- [x] View all projects with trip/revenue stats
- [x] Delete project (with guard)

### Settlements (`/dashboard/settlements`)
- [x] Generate owner settlements (calculates net payable after advances)
- [x] Mark settlements as SETTLED / PENDING
- [x] CSV export for settlements

---

## 🔧 Recent Improvements (2026-05-04)

### Auth & Routing
- Migrated all auth redirect logic from Server Components into the Edge proxy (`src/proxy.ts` via `auth.config.ts`)
- Eliminated `NEXT_REDIRECT` digest errors (the 500-like errors in the browser)
- Dashboard layout no longer calls `redirect()`, preventing RSC boundary crashes

### Analytics UI (2026-05-04)
- [UI IMPROVED] Dashboard Analytics — Owners tab: replaced bar chart with two side-by-side **HorizontalBar** charts (Revenue Share + Net Payable), added **Profit Margin %** column to table, avatar initials, pill-style trip count, arrow indicators (▲/▼) on net payable
- [UI IMPROVED] Dashboard Analytics — Owners tab: table header now shows owner count and total trips at a glance
- [UI IMPROVED] Owners Page — added **Total Trips** stat card (6 cards total); section header shows vehicles + trips + revenue summary inline
- [UI IMPROVED] Owners Page — section subheading replaced with a 3-item summary row (vehicles / trips / revenue)
- [BUG FIXED] `OwnerAnalyticsButton` vehicle breakdown was using `ownerFreightAmount` instead of `partyFreightAmount` — amounts now correct
- [UI IMPROVED] Owner Analytics modal — KPI cards now show a sub-label (trip count, formula), plus a **settlement progress bar**

---

## 🚧 Pending / In Progress

### High Priority
- [ ] **CSV Export: Trips** — export filtered trip records to CSV (similar to expenses)
- [ ] **Dashboard Analytics: Date axis labels** — show month/day labels on area chart x-axis
- [x] **Owners tab in Analytics** — ✅ HorizontalBar charts for revenue share + net payable added
- [ ] **Dashboard Overview** — add "Net Profit trend" as a secondary line on area chart

### Medium Priority
- [ ] **Expense ownership security** — validate authenticated user owns vehicle before allowing expense edit/delete
- [ ] **Vehicle Analytics modal** — per-vehicle trip/expense/profit breakdown (similar to Owner Analytics modal)
- [ ] **Mobile navigation** — hamburger menu fully functional on small screens
- [ ] **Project deletion** — confirmation guard showing how many trips would be affected

### Low Priority
- [ ] **Dark/light mode toggle** — theme switcher in sidebar
- [ ] **Pagination** — large datasets on trips/expenses/owners pages should paginate
- [ ] **Print/PDF settlements** — generate printable settlement sheet per owner
- [ ] **Push notifications** — alert when owner advance is >80% of pending payout

---

## 📐 Architecture Notes

### Tech Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Auth | NextAuth v5 (beta) — JWT sessions |
| Database | PostgreSQL (Neon in prod, Docker local) |
| ORM | Prisma 6 |
| Styling | Vanilla CSS (custom design system in `globals.css`) |
| Charts | Pure CSS + inline SVG (no chart library) |
| Toasts | react-hot-toast |
| Deployment | Docker (standalone Next.js + Postgres container) |

### Key Directories
```
src/
├── app/
│   ├── dashboard/       # Main transporter dashboard (protected)
│   ├── platform/        # Super Admin console (SUPER_ADMIN only)
│   ├── owner/           # Owner read-only portal (OWNER role)
│   ├── login/           # Auth page
│   └── change-password/ # Forced password change
├── components/
│   ├── analytics/       # DashboardAnalytics, OwnerAnalyticsButton, VehicleAnalyticsButton
│   └── ...              # Buttons, Modals, PageHeader, Sidebar, etc.
├── lib/
│   ├── actions/         # Server actions (analytics, trips, expenses, owners, etc.)
│   ├── auth.ts          # NextAuth full config (Prisma adapter + credentials)
│   ├── auth.config.ts   # Edge-safe auth config (used by proxy middleware)
│   └── db.ts            # Prisma client singleton
└── proxy.ts             # Edge middleware — auth guards & role-based redirects
```

### Data Model (Key Relations)
```
Transporter
  └── Owner (many)
       └── Vehicle (many)
            ├── Trip (many)  ← links to Project
            └── Expense (many) ← links to Project
  └── Project (many)
  └── OwnerAdvance (many) ← links to Owner + Project
  └── Settlement (many) ← links to Owner
```

---

## 🐛 Known Issues / Bugs

| Issue | Status | Notes |
|---|---|---|
| `NEXT_REDIRECT` digest shown as 500 in browser devtools | **Fixed 2026-05-04** | Moved redirects to Edge proxy |
| Owner Analytics modal: vehicle revenue uses `ownerFreightAmount` instead of `partyFreightAmount` | **Known** | Line 131 in `OwnerAnalyticsButton.tsx` — amounts are swapped |
| `version` attribute in `docker-compose.yml` is obsolete | Low priority | Just a warning, no functional impact |
