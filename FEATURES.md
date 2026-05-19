# 🚛 Apna Transport — Feature Tracker

> **Last Updated:** 2026-05-19  
> **Platform:** Hyva Transport Management System (MTMS)

---

## ✅ Implemented Features

### Core Operations
| # | Feature | Status | Module | Notes |
|---|---------|--------|--------|-------|
| 1 | Multi-tenant Transporter Setup | ✅ Done | Platform | Super Admin onboards transporters, assigns users |
| 2 | Project Management | ✅ Done | Dashboard | Create/edit/delete projects with party rate & owner rate |
| 3 | Vehicle Management | ✅ Done | Dashboard | Register vehicles, assign to owner + project, unique plate check |
| 4 | Owner Management | ✅ Done | Dashboard | Register owners, phone number, default password, rate overrides |
| 5 | Trip Logging | ✅ Done | Dashboard | Date, vehicle, project, weight, invoice no, LR no, auto-calculate freight |
| 6 | Bulk Trip Import | ✅ Done | Scripts | Parse & import from structured data (109 trips May 2026) |
| 7 | Expense Tracking (Vehicle) | ✅ Done | Dashboard | Fuel, driver advance, owner advance, maintenance, toll, cash payment |
| 8 | Owner Advances | ✅ Done | Dashboard | Track advances to vehicle owners, deducted in settlements |
| 9 | CSV Export | ✅ Done | Expenses/Settlements | Download expense and settlement data |

### Financial & Billing
| # | Feature | Status | Module | Notes |
|---|---------|--------|--------|-------|
| 10 | Settlement Generation | ✅ Done | Billing | Auto-generate per-owner settlements for a date range |
| 11 | Bill Generator UI | ✅ Done | Billing | Premium glassmorphic billing dashboard with per-vehicle breakdown |
| 12 | Dual-Rate Architecture | ✅ Done | Core | `partyRate` (what client pays) vs `ownerRate` (what company earns) |
| 13 | Owner Rate Overrides | ✅ Done | Vehicles | Vehicle-level and owner-level rate overrides |
| 14 | Settlement History | ✅ Done | Settlements | View past settlements, mark as SETTLED |
| 15 | Itemized Deductions | ✅ Done | Billing | High-level category summaries (fuel, toll, advances) before line items |

### Analytics & Dashboard
| # | Feature | Status | Module | Notes |
|---|---------|--------|--------|-------|
| 16 | Analytics Hub | ✅ Done | Dashboard | 9-tab analytics with Overview, P&L, Revenue, Expenses, Vehicles, Projects, Owners, Activity, Rate Calculator |
| 17 | Trend Charts | ✅ Done | Dashboard | Area charts, bar charts, donut charts — pure CSS, no library |
| 18 | Vehicle Performance Cards | ✅ Done | Dashboard | Per-vehicle breakdown with gross pay, deductions, settlement, margin |
| 19 | Activity Heatmap | ✅ Done | Dashboard | Daily trips per vehicle with color-coded heatmap |
| 20 | Rate Calculator / Simulator | ✅ Done | Dashboard | What-if rate scenarios, deductible type configuration |
| 21 | Period Filters | ✅ Done | Dashboard | 7d, 30d, 90d, this month, this year, all-time, custom range |
| 22 | Entity Filters | ✅ Done | Dashboard | Filter by project, owner, vehicle |

### P&L & Company Financials (NEW — May 2026)
| # | Feature | Status | Module | Notes |
|---|---------|--------|--------|-------|
| 23 | **P&L Tab in Dashboard** | ✅ Done | Analytics | Full Profit & Loss waterfall: Revenue → Owner Payouts → Rate Spread → Vehicle Expenses → Overhead → Net Profit |
| 24 | **Company Overhead in Analytics** | ✅ Done | Analytics | Salary, Rent, Insurance, EMI, Office, Partner Payout — now visible in main analytics, not just Partners page |
| 25 | **Partner Equity in Analytics** | ✅ Done | Analytics | Partner equity %, invested amount, profit share, pending payout — visible in P&L tab |
| 26 | **Cash Flow in Analytics** | ✅ Done | Analytics | Cash In/Out summary with recent entries — visible in P&L tab alongside overhead & partners |
| 27 | **Integrated Net Profit** | ✅ Done | Analytics | Net Profit now deducts both vehicle expenses AND company overhead (was previously trip-only) |

### Partners & Overhead (Standalone Page)
| # | Feature | Status | Module | Notes |
|---|---------|--------|--------|-------|
| 28 | Business Partner Management | ✅ Done | Partners | Add/edit/delete partners, equity %, invested amount, payout tracking |
| 29 | Company Overhead Expenses | ✅ Done | Partners | Log salary, rent, EMI, insurance, office expenses with type badges |
| 30 | Cash Flow Ledger | ✅ Done | Partners | Cash In / Cash Out tracker with category tags, direction toggle |
| 31 | Profit Distribution Preview | ✅ Done | Partners | Auto-calculates each partner's share based on equity % x net profit |

### Access Control & Security
| # | Feature | Status | Module | Notes |
|---|---------|--------|--------|-------|
| 32 | Role-Based Auth | ✅ Done | Core | SUPER_ADMIN, ORG_ADMIN, FIELD_MANAGER, OWNER roles |
| 33 | Owner Portal | ✅ Done | Owner | Read-only view for vehicle owners (trips, settlements) |
| 34 | Password Change | ✅ Done | Auth | Force password change on first login |
| 35 | Expense Ownership Check | ✅ Done | Security | Prevent editing/deleting others' expenses |

### UI/UX
| # | Feature | Status | Module | Notes |
|---|---------|--------|--------|-------|
| 36 | Dark Mode Glassmorphic Design | ✅ Done | Global | Premium dark theme with glass cards, subtle animations |
| 37 | Mobile Bottom Nav | ✅ Done | Layout | Responsive bottom navigation for mobile |
| 38 | Collapsible Sidebar | ✅ Done | Layout | Desktop sidebar with toggle |
| 39 | Loading States | ✅ Done | Global | Skeleton loaders, loading bar, transition states |

---

## 🔜 Planned / Wishlist

| # | Feature | Priority | Notes |
|---|---------|----------|-------|
| W1 | Google Sheets Auto-Sync | Medium | Auto-fetch trip data from shared Google Sheets |
| W2 | Monthly P&L PDF Report | Medium | Downloadable PDF of monthly P&L statement |
| W3 | Fuel Rate Tracker | Low | Track fuel prices over time, correlate with expenses |
| W4 | Driver Management | Medium | Track which driver drove which vehicle per trip |
| W5 | Tyre / Insurance Reminders | Low | Alert when tyre replacement or insurance renewal is due |
| W6 | Multi-Project Billing | High | Generate bills spanning multiple projects for one owner |
| W7 | WhatsApp Notifications | Low | Send trip/settlement summaries to owners via WhatsApp |
| W8 | Real-time Dashboard | Low | WebSocket updates for live trip counts |
| W9 | Audit Log | Medium | Track who created/edited/deleted records |
| W10 | Date Filtering on Overhead/CashFlow | Medium | Add period filters to the Partners & Overhead page itself |
| W11 | Cash Flow to Trip Auto-Link | Medium | Automatically link party payments to trip invoices |
| W12 | Bank Account Integration | Low | Connect bank feeds for auto-reconciliation |

---

## Data Models

```
Transporter → Users, Projects, Owners, Partners, CompanyExpenses, CashFlows
Project → Trips, Vehicles, Expenses, OwnerAdvances
Owner → Vehicles, Settlements, OwnerAdvances
Vehicle → Trips, Expenses
Trip → date, weight, invoiceNo, lrNo, ownerRate, partyRate, freightAmounts
CompanyExpense → SALARY | RENT | INSURANCE | EMI | OFFICE | PARTNER_PAYOUT | OTHER
CashFlow → CASH_IN | CASH_OUT with category tags
BusinessPartner → equityPct, investedAmount, paidOutAmount
Settlement → periodStart/End, revenue, deductions, finalPayout, status
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Database | PostgreSQL via Neon |
| ORM | Prisma |
| Auth | NextAuth.js |
| Styling | Vanilla CSS (dark glassmorphic theme) |
| Charts | Pure CSS/SVG (no charting library) |
| Hosting | Vercel-compatible |

---

## Changelog

### 2026-05-19
- **Imported 109 trips** (May 1-15) for vehicles BR01GN0351, BR01GN4328, JH13J9407
- **Built P&L Tab** — Waterfall P&L, overhead breakdown, partner equity, cash flow summary
- **Integrated company financials** into main analytics engine (was previously isolated to Partners page)
- **Created FEATURES.md** — This tracking document

### 2026-05-08
- Redesigned Billing Dashboard UI with glassmorphic aesthetics

### 2026-05-06-07
- Fixed owner advance calculation (no duplicate deductions)
- Added high-level deduction category summaries to billing

### 2026-05-04
- Fixed 500 error on dashboard (server/client component boundary)
- Implemented 10 high-priority improvement features

### 2026-04-23
- Added invoiceNo and lrNo fields to Trip schema
- Google Sheets data import pipeline

### 2026-04-11
- Implemented dual-rate financial architecture
- Built Partners & Overhead page with Cash Flow section
