# Apna Transport - Demo Credentials

This document contains the default credentials seeded into the local PostgreSQL database for the Hyva Transport Management System (MTMS).

## 1. Platform Owner (Super Admin)
**Role:** `SUPER_ADMIN`
The Platform Owner manages the SaaS platform, oversees all different transport companies using the software, and handles billing/subscriptions. This role is not tied to a specific transport company.
* **Email:** `super@hyvatransport.com`
* **Password:** `SuperAdmin@123`

## 2. Transporter Admin (Tenant Owner)
* **Email:** `admin@hyvatransport.com`
* **Password:** `Admin@123`

## 3. Field Manager (Site Supervisor)
**Role:** `FIELD_MANAGER`
The Field Manager works for a specific transporter and operates from the field. They generally log daily trips, track expenses, and upload proof-of-delivery (PoD) receipts but don't have access to global financial or billing reports.
* **Email:** `manager@hyvatransport.com`
* **Password:** `Manager@123`

---

*Note: These profiles are automatically generated when running `npm run db:seed` in your local environment.*
