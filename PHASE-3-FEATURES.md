# 🚀 Apna Transport — Phase 3 Feature Roadmap

> **Platform:** Apna Transport (Hyva Transport Management System)
> **Focus:** Scale, Portals, and Automations

This document details the upcoming high-impact features planned for Phase 3 of the transport management platform.

---

## 1. Owner Portal Mobile App / PWA
**Priority:** High
**Impact:** Massive reduction in manual phone calls from owners asking for balances.

**Features:**
- **Mobile-First Design:** A fully responsive, app-like experience for vehicle owners to check their stats from their phones.
- **Settlement & Advance Ledger:** A historical ledger where owners can view all past paid settlements, current pending balances, and deducted advances.
- **Trip Proof Validation:** Ability for owners to view (and potentially upload) LR/PODs for their assigned trips.

---

## 2. Archiving & Status Toggles (Schema Update)
**Priority:** Medium
**Impact:** Keeps the dashboard clean without deleting historical data.

**Features:**
- **Vehicle Archiving:** Add an `isActive` boolean to the `Vehicle` schema. Allow hiding old/sold vehicles from active dropdowns while preserving their historical trip and expense data.
- **Project Completion:** Add a `status` (Active, Completed, Paused) to the `Project` schema. Completed projects will no longer appear in active filters but remain in analytics.

---

## 3. Scalability & Performance Upgrades
**Priority:** Medium
**Impact:** Ensures the platform remains blazing fast as the database grows to 100,000+ records.

**Features:**
- **UI Pagination:** Implement true database pagination (`skip` and `take`) with Page 1/2/3 controls across the Trips, Expenses, and Settlements tables.
- **Zod Form Validation:** Wrap all forms in strict `zod` schemas to prevent dirty data entry.
- **Rate Limiting:** Add server-side rate limits on expense creation and trip logging to prevent spam and accidental double-clicks.

---

## 4. Professional Invoicing & PDF Exports
**Priority:** High
**Impact:** Enhances the professional image of the company and speeds up billing.

**Features:**
- **Settlement PDF Generation:** A "Download PDF" button on finalized settlements that generates a professional, branded invoice detailing trips, weight, freight, deductions (fuel, maintenance), and final payout.
- **Client Billing PDF:** Ability to generate formal invoices for Projects (Clients) based on the `partyRate` across a specific date range.

---

## 5. Automated Notifications
**Priority:** Low
**Impact:** Keeps owners and drivers in the loop instantly.

**Features:**
- **WhatsApp / SMS Integrations:** Trigger automated messages (via Twilio or similar API) when:
  - A new trip is logged for an owner's vehicle.
  - A cash advance is disbursed.
  - A settlement is marked as "Paid".

---

## 6. Driver Management Module
**Priority:** Future Expansion
**Impact:** Solves the problem of tracking individual driver performance and balances.

**Features:**
- **Driver Profiles:** Link drivers to vehicles.
- **Driver Balances:** Track driver-specific advances (separate from vehicle/owner advances).
- **Performance Metrics:** Track trips per driver, average fuel consumption per driver, and accident/maintenance logs.
