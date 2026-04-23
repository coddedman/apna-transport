# 🚀 Hyva Transport — Improvement Roadmap

> **Last Updated:** 23 April 2026  
> **Platform:** Apna Transport (Hyva Transport Management System)  
> **Stack:** Next.js 16 · Prisma 6 · PostgreSQL (Neon) · NextAuth v5

---

## Table of Contents

1. [Critical Fixes](#-critical-fixes)
2. [Quick Wins](#-quick-wins)
3. [UX & UI Improvements](#-ux--ui-improvements)
4. [Code Quality & Architecture](#-code-quality--architecture)
5. [Performance Optimizations](#-performance-optimizations)
6. [Security Hardening](#-security-hardening)
7. [New Feature Ideas](#-new-feature-ideas)
8. [Priority Matrix](#-priority-matrix)

---

## 🚨 Critical Fixes

### 1. Settlement Calculation Bug — Owner Advances Not Included

**Status:** 🔴 Bug  
**Impact:** Financial accuracy  
**File:** `src/lib/actions/settlements.ts`

The settlement generation logic only pulls deductions from `vehicle.expenses` (Fuel, Driver Advance, Maintenance, Toll, Cash Payment). However, dedicated **Owner Advances** are stored in a separate `OwnerAdvance` table and are **completely ignored** during settlement computation.

**Current behavior:**
```
Final Payout = Σ(Trip Revenue) − Σ(Vehicle Expenses only)
```

**Expected behavior:**
```
Final Payout = Σ(Trip Revenue) − Σ(Vehicle Expenses) − Σ(Owner Advances)
```

**Fix:** Query `OwnerAdvance` records for the same owner and date range, then subtract them from the final payout.

---

### 2. Security: `markSettled` Missing Ownership Verification

**Status:** 🔴 Vulnerability  
**Impact:** Any authenticated user can mark any settlement as settled  
**File:** `src/lib/actions/settlements.ts`

```typescript
// CURRENT — only checks if user is logged in
export async function markSettled(settlementId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  // ← No check that this settlement belongs to the user's transporter!
}
```

**Fix:** Add transporter ownership verification before allowing the status change.

---

## ⚡ Quick Wins

### 3. Non-Functional Filter Buttons on Trips Page

**Status:** 🟡 Placeholder  
**File:** `src/app/dashboard/trips/page.tsx` (Lines 106–108)

Three filter buttons exist but do nothing:
- "Filter by Range"
- "All Vehicles"
- "All Projects"

**Fix:** Replicate the server-side `searchParams` filter pattern already used in `expenses/page.tsx`.

---

### 4. Non-Functional Export CSV Button

**Status:** 🟡 Placeholder  
**File:** `src/app/dashboard/trips/page.tsx` (Line 117)

The "📥 Export CSV" button is non-functional.

**Fix:** Create a client-side CSV generator or a server-side API route at `/api/export/trips` that streams a CSV download.

---

### 5. Non-Functional Search Button on Owners Page

**Status:** 🟡 Placeholder  
**File:** `src/app/dashboard/owners/page.tsx` (Line 131)

The "🔍 Search" button does nothing.

**Fix:** Add client-side instant filtering by owner name/phone, or server-side search via `searchParams`.

---

### 6. Hardcoded Sidebar User Info

**Status:** 🟡 Bug  
**File:** `src/components/Sidebar.tsx` (Lines 87–90)

```tsx
<span className="sidebar-user-name">Raja Singh</span>
<span className="sidebar-user-role">Transporter Admin</span>
```

Username and role are hardcoded. Should pull from the session (e.g., via `useSession()` from `next-auth/react`).

---

### 7. Hardcoded Sidebar Brand

**Status:** 🟡 Bug  
**File:** `src/components/Sidebar.tsx` (Line 58)

```tsx
<div className="sidebar-brand-icon">HT</div>
```

Should derive initials from the transporter's name dynamically.

---

### 8. Delete Trip Functionality Missing

**Status:** 🟡 Missing feature  
**Files:** `src/lib/actions/trips.ts`, `src/app/dashboard/trips/page.tsx`

Trips can be created and edited, but **not deleted**. Add a `deleteTrip` server action with a confirmation dialog.

---

## 🎨 UX & UI Improvements

### 9. Owners Page Has No Mobile Responsive View

**Status:** 🟠 Responsive issue  
**File:** `src/app/dashboard/owners/page.tsx`

Vehicles, Trips, and Expenses pages all have `mobile-only-cards` views. The Owners page only has a desktop `data-table`, which will be unusable on phones.

**Fix:** Add a `mobile-only-cards` section matching the pattern from other pages.

---

### 10. Vehicle Status is Always "Active"

**Status:** 🟠 Misleading  
**File:** `src/app/dashboard/vehicles/page.tsx` (Line 86)

Every vehicle shows `● Active` regardless of actual state. No `status` field exists in the schema.

**Options:**
- Add a `status` enum to the `Vehicle` model (`ACTIVE`, `INACTIVE`, `UNDER_MAINTENANCE`)
- Or derive status from recent trip activity (e.g., no trips in 30 days = Idle)

---

### 11. Project Status is Always "Active"

**Status:** 🟠 Misleading  
**File:** `src/app/dashboard/projects/page.tsx` (Line 27)

Same issue as vehicles — `status: 'active'` is hardcoded for every project.

**Fix:** Add an `isActive` boolean field to the `Project` model.

---

### 12. "Upcoming Renewals" Stat Hardcoded to 0

**Status:** 🟠 Misleading  
**File:** `src/app/dashboard/vehicles/page.tsx` (Line 16)

```tsx
const upcomingRenewals = 0
```

This stat card is always zero. Either implement document tracking (Insurance, PUC, Fitness Certificate expiry dates) or remove the stat.

---

### 13. No Per-Route Loading States

**Status:** 🟡 UX gap  
**Location:** Only `src/app/dashboard/loading.tsx` exists

Each route segment (trips, expenses, owners, etc.) should have its own `loading.tsx` with skeleton screens matching the page layout for smoother perceived performance.

---

### 14. No Sub-Page SEO Metadata

**Status:** 🟡 SEO  
**Location:** Trips, Expenses, Owners, Vehicles, Projects, Settlements

None of the dashboard sub-pages export `metadata`. Add descriptive `title` and `description` for each.

Example:
```tsx
export const metadata = {
  title: 'Trip Logger — Hyva Transport',
  description: 'Daily trip entries with automated freight calculation',
}
```

---

## 🛠️ Code Quality & Architecture

### 15. TypeScript `any` Type Proliferation

**Status:** 🟡 Tech debt  
**Location:** Every page file, auth config, server actions

Almost every file casts session data as `any`:
```tsx
const transporterId = (session?.user as any)?.transporterId
```

**Fix:** Create proper NextAuth type extensions:
```typescript
// src/types/next-auth.d.ts
import { Role } from '@prisma/client'

declare module "next-auth" {
  interface User {
    role: Role
    transporterId?: string
    transporterName?: string
    mustChangePassword?: boolean
    ownerId?: string
  }
  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    transporterId?: string
    transporterName?: string
    mustChangePassword?: boolean
    ownerId?: string
  }
}
```

---

### 16. Unused Import in Dashboard Layout

**Status:** ⚪ Cleanup  
**File:** `src/app/dashboard/layout.tsx` (Line 1)

```tsx
import Sidebar from '@/components/Sidebar' // ← imported but never used
```

`Sidebar` is rendered inside `DashboardClientLayout`, not directly in the layout.

---

### 17. Excessive Inline Styles

**Status:** 🟡 Maintainability  
**Location:** All page files (especially settlements, expenses, owners)

Heavy use of inline `style={{}}` objects instead of CSS classes. This makes the codebase harder to maintain and prevents style reuse.

**Fix:** Extract repeated patterns into `globals.css` as utility classes.

---

### 18. No Form Validation Library

**Status:** 🟡 Robustness  
**Location:** All form components in `src/components/forms/`

All forms use manual `if` checks for validation. Consider adopting `zod` for consistent schema validation on both client and server.

---

### 19. No Error Boundaries

**Status:** 🟡 Reliability  
**Location:** No `error.tsx` files exist

If a server component throws an error, users see a raw crash screen. Add:
- `error.tsx` per route segment (dashboard, trips, expenses, etc.)
- Global `not-found.tsx` for 404 handling

---

## ⚡ Performance Optimizations

### 20. No Pagination — All Records Load at Once

**Status:** 🟠 Scalability  
**Files:** `trips/page.tsx`, `expenses/page.tsx`, `owners/page.tsx`

All queries fetch every record without `skip`/`take` limits. With thousands of trips, this will severely impact page load times.

**Fix:**
- Add `page` and `limit` to `searchParams`
- Use Prisma `skip`/`take` for server-side pagination
- Render pagination controls at the bottom

---

### 21. Expenses Page Makes Two Separate Queries

**Status:** 🟡 Optimization  
**File:** `src/app/dashboard/expenses/page.tsx` (Lines 41–73)

The page runs a filtered query for the table AND a separate unfiltered query for stats. This could be optimized into a single `groupBy` aggregation.

---

### 22. Owners Page Deep N+1-Adjacent Includes

**Status:** 🟡 Optimization  
**File:** `src/app/dashboard/owners/page.tsx` (Lines 17–29)

The owners query includes `vehicles → trips → project` and `vehicles → expenses → project` for every owner. With many owners and vehicles, this becomes a massive join.

**Fix:** Use dedicated aggregation queries or Prisma `$queryRaw` for financial summaries instead of loading entire relations.

---

## 🔒 Security Hardening

### 23. No Rate Limiting on Server Actions

**Status:** 🟡 Risk  
**Location:** All server actions in `src/lib/actions/`

A compromised session could rapidly create thousands of trips/expenses. Consider:
- Adding rate limiting middleware
- Using `next-safe-action` for built-in rate limiting + validation

---

### 24. Default Passwords Visible in UI

**Status:** 🟠 Risk  
**File:** `src/app/dashboard/owners/page.tsx` (Lines 166–172)

Owner default passwords are displayed in plain text in the admin table. While useful for initial setup, consider:
- A "Show/Hide" toggle instead of always visible
- Auto-hiding after the owner changes their password
- Removing the `defaultPassword` field entirely after password change

---

### 25. No CSRF or Input Sanitization

**Status:** 🟡 Risk  
**Location:** All `FormData` parsing in server actions

Text inputs (remarks, project names, etc.) are passed directly to the database without sanitization. While Prisma parameterizes queries (preventing SQL injection), consider sanitizing for XSS in rendered content.

---

## 🔵 New Feature Ideas

### 26. Driver Management Module

The comment `driver: 'Unknown'` in `trips/page.tsx` suggests this is planned.

**Schema additions:**
```prisma
model Driver {
  id        String   @id @default(cuid())
  name      String
  phone     String
  licenseNo String?
  vehicleId String?
  vehicle   Vehicle? @relation(fields: [vehicleId], references: [id])
  trips     Trip[]
}
```

**Features:**
- Driver registry with contact info and license tracking
- Assign drivers to vehicles
- Per-driver trip and performance analytics

---

### 27. Document & Image Upload

- Attach trip receipts, fuel slips, toll receipts to expenses
- Upload vehicle documents (registration, insurance, PUC) with expiry dates
- Powers the "Upcoming Renewals" stat card on vehicles page

**Tech:** Vercel Blob, AWS S3, or Cloudinary for storage.

---

### 28. Settlement PDF Export

Generate downloadable, printable PDF settlement statements for owners. Include:
- Trip-by-trip breakdown
- Expense deductions itemized
- Final payout amount
- Period covered

**Tech:** `@react-pdf/renderer` or `jspdf` + `html2canvas`.

---

### 29. WhatsApp / SMS Notifications

- Notify owners when a settlement is generated
- Send daily trip summary to admin
- Alert on upcoming vehicle document expiry

**Tech:** Twilio API, WhatsApp Business API, or MSG91 (popular in India).

---

### 30. Bulk Trip Import via UI

A Google Sheets import script exists in `/scripts/`. Build a UI version:
- CSV/Excel file upload in the dashboard
- Preview table with validation
- Conflict detection for duplicate invoice numbers
- Commit or reject

---

### 31. Owner Portal Build-out

The `OWNER` role and `/owner` route exist but appear minimal. Full build-out:
- Read-only dashboard with their vehicles, trips, and earnings
- Settlement history with PDF download
- Advance history and ledger view
- Mobile-first design (owners likely on phones)

---

### 32. GST & Compliance Support

For the Indian transport market:
- GST calculations on freight (5% on transport services)
- E-way bill number tracking per trip
- TDS deduction tracking (2% u/s 194C)
- GSTIN field on Transporter and Project models

---

### 33. Fuel Price Tracker Widget

- Manual input or API-based daily diesel price tracking
- Correlate fuel expense trends with price changes
- Dashboard widget showing cost per km/trip trends

---

## 📊 Priority Matrix

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| **P0** | #1 Settlement calculation bug | Low | 🔴 Critical |
| **P0** | #2 `markSettled` security hole | Low | 🔴 Critical |
| **P1** | #3 Trip filters (wire up) | Medium | High |
| **P1** | #4 Export CSV | Medium | High |
| **P1** | #5 Owner search | Low | Medium |
| **P1** | #6 Dynamic sidebar user | Low | Medium |
| **P1** | #8 Delete trip | Low | High |
| **P2** | #9 Owners mobile view | Medium | High |
| **P2** | #10–11 Vehicle/Project status | Medium | Medium |
| **P2** | #15 TypeScript types | Medium | Medium |
| **P2** | #20 Pagination | High | High |
| **P3** | #18 Zod validation | Medium | Medium |
| **P3** | #19 Error boundaries | Medium | Medium |
| **P3** | #26 Driver management | High | High |
| **P3** | #28 Settlement PDF | Medium | High |
| **P4** | #27 Document uploads | High | Medium |
| **P4** | #29 WhatsApp notifications | High | Medium |
| **P4** | #31 Owner portal | High | High |
| **P4** | #32 GST support | High | Medium |

---

> **Recommended starting order:**  
> Fix #1 and #2 (critical bugs) → Wire up #3, #4, #5, #6, #8 (quick UI wins) →  
> #9 and #20 (mobile + pagination) → #26 and #28 (new features)

---

*Document generated by code review on 23 April 2026.*
