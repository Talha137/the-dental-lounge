# The Dental Lounge — Clinic Management System (V1)

A real full-stack starter for clinic use, built with React, Express/Node.js and PostgreSQL.

## Included in V1
- Secure JWT login with Admin / Doctor / Receptionist role model
- Patient registration, unique patient IDs, medical history and allergies
- Appointments with status workflow
- Dental treatment records, tooth number, diagnosis, clinical notes and prescription
- Invoices, discounts, partial/full payments and outstanding balances
- Dashboard with patients, today's appointments/revenue and outstanding balance
- Responsive desktop/mobile interface

## Requirements
- Node.js 20+
- PostgreSQL 15+

## Setup
1. Create a PostgreSQL database named `dental_lounge`.
2. Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` and a long random `JWT_SECRET`.
3. In the project root run: `npm install`
4. Run: `npm run install:all`
5. Initialize database: `npm --prefix backend run db:init`
6. Start frontend + backend: `npm run dev`
7. Open `http://localhost:5173`

Default first-login account after DB initialization:
- Email: `admin@thedentallounge.local`
- Password: `ChangeMe123!`

**Change the default password before entering real patient data.**

## Production note
This is a solid V1 foundation, but before internet-facing production use add a password-change/admin user screen, audit trail, automated encrypted backups, HTTPS/reverse proxy, rate limiting, database least-privilege credentials, and a documented restore procedure. Medical records should never be hosted publicly without appropriate privacy/security controls and local legal review.
