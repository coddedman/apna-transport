# 📋 Apna Transport — Phase 3 Roadmap & Audit Tracker

> **Last Updated:** May 19, 2026
> **Status:** Implementation In Progress

---

## 🔒 Security Audit (Sprint 1 — COMPLETED ✅)

| # | Issue | Status | Files Changed |
|---|-------|--------|---------------|
| 1 | ~~Plaintext password storage in `defaultPassword`~~ | ✅ Fixed | `owners.ts` |
| 2 | ~~Auth credential logging in production~~ | ✅ Fixed | `auth.ts` |
| 3 | ~~Owner portal missing auth guard~~ | ✅ Fixed | `owner/page.tsx` |
| 4 | ~~Centralized `revalidatePath` helper~~ | ✅ Fixed | All 9 action files |

### Changes Made
- **Plaintext Passwords**: `defaultPassword` field now always writes `null` — no new plaintext values stored
- **Auth Logging**: Removed 4 `console.log` statements exposing emails and password match results
- **Owner Portal**: Added explicit `role === 'OWNER'` check with redirect to `/login`
- **Revalidation**: Created `revalidate.ts` with `revalidateDashboard()` helper; replaced ~30 manual `revalidatePath()` calls across 9 files

---

## 💰 Financial Accuracy (Sprint 2 — COMPLETED ✅)

| # | Issue | Status | Files Changed |
|---|-------|--------|---------------|
| 5 | ~~Settlement rate logic using wrong fallback~~ | ✅ Fixed | `settlements.ts` |

### Changes Made
- **Settlement Rate Chain**: Fixed `generateSettlement` to properly use `vehicle.ownerRateOverride → owner.ownerRateOverride → vehicle.project.ownerRate → defaultRate` chain (was grabbing a random recent project rate)

---

## ⚡ Production Hardening (Sprint 3 — COMPLETED ✅)

| # | Issue | Status | Files Changed |
|---|-------|--------|---------------|
| 6 | ~~Owner portal loads unbounded data~~ | ✅ Fixed | `owner/page.tsx` |
| 7 | ~~Owner deletion race condition~~ | ✅ Fixed | `owners.ts` |
| 8 | ~~No error boundaries on dashboard tabs~~ | ✅ Fixed | `DashboardAnalytics.tsx`, NEW: `TabErrorBoundary.tsx` |

### Changes Made
- **Owner Portal Pagination**: Added `take: 25` for trips, `take: 20` for expenses per vehicle + `_count` for total tracking
- **Owner Deletion Safety**: Wrapped in `prisma.$transaction` — now cleans up `OwnerAdvance`, `Settlement`, then `Owner`, then `User` atomically
- **Tab Error Boundaries**: Created `TabErrorBoundary.tsx` class component; wrapped Activity, P&L, and Simulator tabs to isolate rendering failures

---

## 🎨 UI/UX Improvements (COMPLETED ✅)

| # | Improvement | Status |
|---|-------------|--------|
| 9 | ~~P&L tab values truncated (₹13,3...)~~ | ✅ Fixed |
| 10 | ~~Waterfall bars too thin~~ | ✅ Fixed |
| 11 | ~~P&L KPI layout cramped~~ | ✅ Fixed |

### Changes Made
- **P&L Complete Redesign**:
  - Replaced 5-col KPI grid with a full-width headline banner (Revenue | Net Profit | Margin)
  - Added smart `fmtSmart()` formatter that auto-abbreviates to K/L/Cr for large numbers
  - Waterfall bars increased from 6px to 8-10px height with gradient glow effects
  - Added mini KPI chips for Rate Spread, Vehicle Expenses, Overhead
  - 3-column grid now uses `repeat(auto-fit, minmax(300px, 1fr))` for responsive layout

---

## 🔮 Phase 3 Feature Roadmap (PLANNED)

### Feature 1: Owner Mobile Portal (P1)
- [ ] Responsive mobile-first layout for `/owner` route
- [ ] Push notification support for new settlements
- [ ] Trip-wise expense breakdown view
- **Effort:** 3-4 days | **Impact:** High (owner satisfaction)

### Feature 2: Vehicle & Project Archiving (P1)
- [ ] Add `isArchived Boolean @default(false)` to Vehicle and Project models
- [ ] Archive toggle UI on vehicles/projects pages
- [ ] Filter archived items from all active queries
- [ ] "Show Archived" toggle in UI
- **Effort:** 1-2 days | **Impact:** High (dashboard cleanup)

### Feature 3: Database Pagination (P2)
- [ ] Cursor-based pagination for trips, expenses, settlements
- [ ] "Load More" or infinite scroll UI components
- [ ] Server-side filtering (date range, project, vehicle)
- **Effort:** 3-4 days | **Impact:** Medium (scaling)

### Feature 4: PDF Invoice Export (P2)
- [ ] Settlement PDF generation with company branding
- [ ] Client invoice PDF with trip details
- [ ] Bulk export capability
- **Effort:** 2-3 days | **Impact:** Medium (billing workflow)

### Feature 5: Automated Notifications (P3)
- [ ] WhatsApp/SMS settlement alerts to owners
- [ ] Email digest for transporters (weekly P&L summary)
- [ ] Low balance warnings
- **Effort:** 3-4 days | **Impact:** Medium (automation)

---

## 📋 Remaining Code Quality Items (Backlog)

| # | Item | Priority | Status |
|---|------|----------|--------|
| CQ-1 | Fix `(session?.user as any)` TypeScript casting | P3 | 🔲 Planned |
| CQ-2 | Add `createdAt` to Trip and Expense models | P3 | 🔲 Planned |
| CQ-3 | Soft deletes for financial records | P3 | 🔲 Planned |
| CQ-4 | Settlement-to-Trip linkage (prevent double-settlement) | P2 | 🔲 Planned |
| CQ-5 | Input sanitization with Zod validation | P3 | 🔲 Planned |
| CQ-6 | Reduce analytics query count (30 → ~8) | P2 | 🔲 Planned |

---

> **Completed:** 11/11 audit items + P&L redesign  
> **Remaining:** 6 code quality items + 5 feature roadmap items
