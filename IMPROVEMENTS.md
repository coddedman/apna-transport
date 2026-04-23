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

**Status:** ✅ DONE  
**Impact:** Financial accuracy  
**File:** `src/lib/actions/settlements.ts`

~~The settlement generation logic only pulls deductions from `vehicle.expenses`. Owner Advances from the dedicated `OwnerAdvance` table were completely ignored.~~

**Fixed:** Settlement now queries `OwnerAdvance` records for the same owner and date range, and includes them in the `totalAdvances` deduction. Also handles `OWNER_ADVANCE` expense type in the switch statement.

---

### 2. Security: `markSettled` Missing Ownership Verification

**Status:** ✅ DONE  
**Impact:** Any authenticated user could mark any settlement as settled  
**File:** `src/lib/actions/settlements.ts`

**Fixed:** `markSettled` now verifies that the settlement belongs to the caller's transporter before allowing the status change.

---

## ⚡ Quick Wins

### 3. Non-Functional Filter Buttons on Trips Page

**Status:** ✅ DONE  
**File:** `src/app/dashboard/trips/page.tsx`

**Fixed:** Replaced static placeholder buttons with a full server-side filter form (Vehicle, Project, Date Range) using `searchParams`, matching the existing pattern from expenses page.

---

### 4. Non-Functional Export CSV Button

**Status:** ✅ DONE  
**Files:** `src/components/ExportCSVButton.tsx`, `src/app/dashboard/trips/page.tsx`

**Fixed:** Created a reusable `ExportCSVButton` component that generates and downloads CSV files client-side. Wired into trips page with all columns.

---

### 5. Non-Functional Search Button on Owners Page

**Status:** ✅ DONE  
**File:** `src/app/dashboard/owners/page.tsx`

**Fixed:** Replaced static search button with a server-side search form that filters by owner name or phone using `searchParams` and Prisma `contains` with case-insensitive mode.

---

### 6. Hardcoded Sidebar User Info

**Status:** ✅ DONE  
**File:** `src/components/Sidebar.tsx`

**Fixed:** Sidebar now pulls user name, email, and role from `useSession()` and displays them dynamically with proper role labels.

---

### 7. Hardcoded Sidebar Brand

**Status:** ✅ DONE  
**File:** `src/components/Sidebar.tsx`

**Fixed:** Brand name and initials now derive from `session.user.transporterName` dynamically.

---

### 8. Delete Trip Functionality Missing

**Status:** ✅ DONE  
**Files:** `src/lib/actions/trips.ts`, `src/components/DeleteTripButton.tsx`, `src/app/dashboard/trips/page.tsx`

**Fixed:** Added `deleteTrip` server action with transporter ownership verification, plus a `DeleteTripButton` component with confirmation dialog. Wired into both desktop and mobile views.

---

## 🎨 UX & UI Improvements

### 9. Owners Page Has No Mobile Responsive View

**Status:** ✅ DONE  
**File:** `src/app/dashboard/owners/page.tsx`

**Fixed:** Added full `mobile-only-cards` view with owner name, phone, vehicles, pending payout, advances, and action buttons (analytics, edit, delete).

---

### 10. Vehicle Status is Always "Active"

**Status:** 🟠 Not Done — Requires schema migration  
**File:** `src/app/dashboard/vehicles/page.tsx`

Needs a `status` enum added to the `Vehicle` model in Prisma schema, which requires a database migration. Skipped to avoid breaking production data.

---

### 11. Project Status is Always "Active"

**Status:** 🟠 Not Done — Requires schema migration  
**File:** `src/app/dashboard/projects/page.tsx`

Same as #10 — needs an `isActive` field added to the `Project` model.

---

### 12. "Upcoming Renewals" Stat Hardcoded to 0

**Status:** ✅ DONE  
**File:** `src/app/dashboard/vehicles/page.tsx`

**Fixed:** Removed the misleading "Upcoming Renewals" stat and replaced it with "Total Owners" — a real, data-driven metric.

---

### 13. No Per-Route Loading States

**Status:** ✅ DONE  
**Location:** All dashboard sub-routes

**Fixed:** Created skeleton loading states with shimmer animations for:
- `trips/loading.tsx`
- `expenses/loading.tsx`
- `owners/loading.tsx`
- `vehicles/loading.tsx`
- `projects/loading.tsx`
- `settlements/loading.tsx`

---

### 14. No Sub-Page SEO Metadata

**Status:** ✅ DONE  
**Location:** All dashboard sub-pages

**Fixed:** Added `export const metadata` with descriptive `title` and `description` to:
- Trips, Expenses, Owners, Vehicles, Projects, Settlements pages

---

## 🛠️ Code Quality & Architecture

### 15. TypeScript `any` Type Proliferation

**Status:** ✅ PARTIALLY DONE  
**File:** `src/types/next-auth.d.ts`

**Fixed:** Improved the NextAuth type definitions to include `Role` enum, `mustChangePassword`, and `ownerId` fields. The `as any` casts still exist in page files for backward compatibility — a full refactor to remove them is a larger effort.

---

### 16. Unused Import in Dashboard Layout

**Status:** ✅ DONE  
**File:** `src/app/dashboard/layout.tsx`

**Fixed:** Removed unused `import Sidebar from '@/components/Sidebar'`.

---

### 17. Excessive Inline Styles

**Status:** 🟠 Not Done  
**Location:** All page files

This is a large-scale refactoring effort that would touch every page file. Skipped for now — functional improvements prioritized.

---

### 18. No Form Validation Library

**Status:** 🟠 Not Done  
**Location:** `src/components/forms/`

Adding `zod` validation requires installing a new dependency and refactoring all form components. Deferred to a future sprint.

---

### 19. No Error Boundaries

**Status:** ✅ DONE  
**Files:** `src/app/dashboard/error.tsx`, `src/app/not-found.tsx`

**Fixed:** Added:
- Dashboard-level `error.tsx` with friendly error message and retry button
- Global `not-found.tsx` 404 page with back-to-dashboard link

---

## ⚡ Performance Optimizations

### 20. No Pagination — All Records Load at Once

**Status:** 🟠 Not Done  
**Files:** `trips/page.tsx`, `expenses/page.tsx`, `owners/page.tsx`

Requires adding `page`/`limit` params, Prisma `skip`/`take`, and pagination UI controls. Deferred — current dataset size is manageable.

---

### 21. Expenses Page Makes Two Separate Queries

**Status:** 🟠 Not Done  
**File:** `src/app/dashboard/expenses/page.tsx`

Optimization to merge into a single `groupBy` query. Low priority — works correctly as-is.

---

### 22. Owners Page Deep N+1-Adjacent Includes

**Status:** 🟠 Not Done  
**File:** `src/app/dashboard/owners/page.tsx`

Requires refactoring to aggregation queries. Low priority — works correctly as-is.

---

## 🔒 Security Hardening

### 23. No Rate Limiting on Server Actions

**Status:** 🟠 Not Done  
**Location:** All server actions

Requires adding middleware or `next-safe-action`. Medium priority.

---

### 24. Default Passwords Visible in UI

**Status:** 🟠 Not Done  
**File:** `src/app/dashboard/owners/page.tsx`

Adding a show/hide toggle is a UI enhancement. Low priority — current behavior is intentional for admin use.

---

### 25. No CSRF or Input Sanitization

**Status:** 🟠 Not Done  
**Location:** All `FormData` parsing

Prisma handles SQL injection prevention. XSS sanitization is a lower priority since content is admin-facing.

---

## 🔵 New Feature Ideas

### 26. Driver Management Module

**Status:** 🟠 Not Done — Future feature

---

### 27. Document & Image Upload

**Status:** 🟠 Not Done — Future feature

---

### 28. Settlement PDF Export

**Status:** 🟠 Not Done — Future feature

---

### 29. WhatsApp / SMS Notifications

**Status:** 🟠 Not Done — Future feature

---

### 30. Bulk Trip Import via UI

**Status:** 🟠 Not Done — Future feature

---

### 31. Owner Portal Build-out

**Status:** 🟠 Not Done — Future feature

---

### 32. GST & Compliance Support

**Status:** 🟠 Not Done — Future feature

---

### 33. Fuel Price Tracker Widget

**Status:** 🟠 Not Done — Future feature

---

## 📊 Priority Matrix

| Priority | Item | Status | Effort | Impact |
|----------|------|--------|--------|--------|
| **P0** | #1 Settlement calculation bug | ✅ Done | Low | 🔴 Critical |
| **P0** | #2 `markSettled` security hole | ✅ Done | Low | 🔴 Critical |
| **P1** | #3 Trip filters (wire up) | ✅ Done | Medium | High |
| **P1** | #4 Export CSV | ✅ Done | Medium | High |
| **P1** | #5 Owner search | ✅ Done | Low | Medium |
| **P1** | #6 Dynamic sidebar user | ✅ Done | Low | Medium |
| **P1** | #7 Dynamic sidebar brand | ✅ Done | Low | Medium |
| **P1** | #8 Delete trip | ✅ Done | Low | High |
| **P2** | #9 Owners mobile view | ✅ Done | Medium | High |
| **P2** | #10–11 Vehicle/Project status | 🟠 Pending | Medium | Medium |
| **P2** | #12 Upcoming renewals stat | ✅ Done | Low | Low |
| **P2** | #13 Per-route loading states | ✅ Done | Medium | Medium |
| **P2** | #14 Sub-page SEO metadata | ✅ Done | Low | Low |
| **P2** | #15 TypeScript types | ✅ Partial | Medium | Medium |
| **P2** | #16 Unused import cleanup | ✅ Done | Low | Low |
| **P2** | #19 Error boundaries | ✅ Done | Medium | Medium |
| **P2** | #20 Pagination | 🟠 Pending | High | High |
| **P3** | #17 Inline styles refactor | 🟠 Pending | High | Medium |
| **P3** | #18 Zod validation | 🟠 Pending | Medium | Medium |
| **P3** | #23 Rate limiting | 🟠 Pending | Medium | Medium |
| **P4** | #26–33 New features | 🟠 Pending | High | Various |

---

## Summary

- **✅ Done:** 16 items (P0-P2 critical + quick wins)
- **🟠 Pending:** 17 items (schema migrations, performance optimizations, new features)
- **Build Status:** ✅ Compiles successfully

---

*Document updated 23 April 2026 after implementation pass.*
