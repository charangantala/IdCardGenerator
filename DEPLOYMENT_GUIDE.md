# Production Deployment Guide: Digital ID Card Generator

This guide provides instructions for deploying the **Digital ID Card Generator** SaaS platform on **Vercel** connected to your live **Supabase** backend.

---

## 1. Project Configuration Files

- **`vercel.json`**: Configures single-page application (SPA) client-side routing so deep routes like `/verify/:cardId` or `/admin/colleges/:id` resolve without 404 errors.
- **`vite.config.js`**: Optimized with manual chunking (`react-vendor`, `export-tools`, `crop-and-csv`) for mobile load speeds.
- **`.gitignore`**: Protects local `.env` and `node_modules` from being committed to Git.

---

## 2. Environment Variables to Set in Vercel

When importing your Git repository into Vercel, go to **Project Settings → Environment Variables** and add:

| Variable Name | Value | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://bxzppeeecfdoicymjxze.supabase.co` | Your live Supabase project endpoint |
| `VITE_SUPABASE_ANON_KEY` | *(Your anon public API key from Supabase)* | Client authentication and RLS queries |

> **Note:** Do NOT add the `service_role` key to the frontend. The `anon` key is safe for public browser exposure because Row Level Security (RLS) protects the database.

---

## 3. Supabase Auth & Redirect URLs Configuration

In your **Supabase Dashboard**:
1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to your production Vercel domain:
   ```
   https://your-project.vercel.app
   ```
3. Under **Redirect URLs**, add:
   ```
   https://your-project.vercel.app/**
   http://localhost:5173/**
   ```
4. Under **Authentication → Rate Limits**:
   - Ensure rate limiting is enabled for sign-in attempts (prevents brute-force attacks).

---

## 4. Pre-Launch Checklist (Section 10 & 14)

### A. Tenant Isolation & Security
- [x] **Row Level Security (RLS)** is enabled on all tables (`colleges`, `profiles`, `departments`, `students`).
- [x] **Admin-only template edits**: Enforced in PostgreSQL RLS policy `colleges_admin_all`.
- [x] **Student self-approval block**: Enforced in PostgreSQL trigger/check policy (`status <> 'approved'`).
- [x] **College tenant boundary**: Queries strictly isolate records by `college_id` via `departmentService` and `studentService`.
- [x] **Public Verification View**: `/verify/:cardId` queries `public_card_verification` only, hiding student PII (phone, residential address, guardian details).
- [x] **Account Suspension**: Suspended colleges are blocked at login.

### B. Features & Workflows
- [x] **Controlled Student Form**: Real-time keystroke update with 3:4 passport photo crop.
- [x] **Lifecycle States**: Draft → Submitted (locks form) → Approved (unlocks download) / Rejected (shows reason, unlocks edits).
- [x] **Bulk Tools**: CSV bulk upload with row-level error reporting, CSV list export, and batch multi-page PDF generation.
- [x] **Print-Ready Cards**: ISO CR-80 standard card dimensions (85.6 mm × 54 mm) in high-resolution PNG & PDF.
- [x] **Interactive QR Code**: SVG QR code linking directly to `/verify/:cardId`.
