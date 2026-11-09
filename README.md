# 🪪 Digital ID Card Generator (Multi-College SaaS)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%7C_Auth_%7C_Storage-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern, multi-tenant SaaS platform enabling colleges and educational institutions to issue, customize, verify, and manage official digital ID cards. Built with real-time card previews, photo cropping, bulk CSV uploads, batch exports, and QR-code-based instant authenticity verification.

---

## 🌐 Live Demo & Deployment

- **Live Application:** [https://id-card-generator-delta-eight.vercel.app/login](https://id-card-generator-delta-eight.vercel.app/login)
- **Deployment Platform:** Vercel (Frontend) + Supabase (Database, Auth, Storage)

---

## ✨ Key Features

### 🏢 Multi-Tenant Architecture & Role-Based Access Control (RBAC)
- **Super Admin**:
  - Add, configure, suspend, or manage colleges and tenant accounts.
  - Interactive **Card Template Designer**: customize institutional colors (primary/secondary), card orientation (portrait/landscape), college logos, signature blocks, and displayed metadata.
  - Administrative "View As" mode for seamless support and multi-tenant management.
- **College Administration**:
  - Department, year, and section management.
  - Comprehensive student records directory with search and advanced filters.
  - Review student submissions with one-click **Approve** or **Reject** (with feedback notes).
  - Bulk student onboarding via **CSV import** with error reporting and template downloads.
  - Batch export of approved student ID cards into multi-page printable PDFs.
- **Student Portal**:
  - Self-service controlled form with live, real-time double-sided ID card preview.
  - Integrated 3:4 aspect-ratio passport photo cropper.
  - Real-time submission workflow: `Draft` ➔ `Submitted` (locked) ➔ `Approved` (download enabled) / `Rejected` (editable).
  - High-resolution, print-ready ID card download in **PNG** and **PDF** formats.

### 🔒 Trust & Verification
- **Dynamic QR Code on ID Cards**: Each generated ID card embeds an SVG QR code pointing to a public verification endpoint (`/verify/:cardId`).
- **PII-Protected Public Verification**: Anyone scanning the card's QR code can verify its legitimacy, status, and basic details without exposing sensitive personally identifiable information (PII) like phone numbers, residential addresses, or blood groups.
- **Database Row Level Security (RLS)**: Enforced directly at the PostgreSQL layer in Supabase to ensure complete tenant data isolation across colleges.

### 🖨️ Production-Ready Card Design
- **Standard CR-80 Dimensions**: Adheres strictly to the credit card / ID card ISO CR-80 standard size (85.6 mm × 54 mm).
- **Dual-Sided Output**: Renders both Front and Back card faces including barcode/QR verification, emergency contacts, authorized signatures, and college terms.

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite | High-performance SPA with client-side routing |
| **Styling** | Tailwind CSS, Lucide Icons | Responsive modern design system |
| **Routing** | React Router DOM v6 | Role-protected routing (`admin`, `college`, `student`) |
| **Backend & DB** | Supabase | PostgreSQL with Row-Level Security, Auth, and Storage |
| **Image & PDF Export** | `html-to-image`, `jspdf` | High-DPI canvas rasterization and PDF generation |
| **Utilities** | `papaparse`, `react-easy-crop`, `qrcode.react` | CSV parsing, passport photo cropping, SVG QR generation |

---

## 📁 Project Directory Structure

```text
IdCardGenerator/
├── index.html                   # HTML entry point
├── package.json                 # Project dependencies and npm scripts
├── postcss.config.js            # PostCSS configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── vite.config.js               # Vite configuration with chunk splitting
├── vercel.json                  # Vercel SPA routing redirects
├── supabase/
│   ├── schema.sql               # PostgreSQL tables, triggers, and RLS policies
│   └── connect_dashboards.sql   # Auxiliary database functions
└── src/
    ├── main.jsx                 # Application entry point
    ├── App.jsx                  # Root App layout and context providers
    ├── index.css                # Global styles and Tailwind directives
    ├── components/
    │   ├── common/              # Button, Input, Modal, Navbar, Toast, etc.
    │   ├── forms/               # College, Student, Template, PhotoCropper forms
    │   ├── filters/             # Department, Year, and Section filtering UI
    │   ├── tables/              # Data tables for colleges and student rosters
    │   └── IdCard/              # Front, Back, and Interactive Card Previews
    ├── context/                 # AuthContext (user session, role, college context)
    ├── hooks/                   # Custom hooks (useAuth, useStudents, useTemplate)
    ├── pages/                   # Login, Public Verify, Admin, College, and Student pages
    ├── routes/                  # Protected routes and role-based redirect guards
    ├── services/                # Supabase client and modular API services
    └── utils/                   # Card export, CSV handler, image cropper, validators
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- A free [Supabase](https://supabase.com/) account

### 1. Clone the Repository

```bash
git clone https://github.com/charangantala/IdCardGenerator.git
cd IdCardGenerator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (you can copy the provided `.env.example`):

```bash
cp .env.example .env
```

Add your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note:** Never commit your `.env` file with secret keys to version control. The repository's `.gitignore` automatically prevents `.env` from being pushed.

### 4. Database Setup

1. Open your project dashboard in [Supabase](https://supabase.com).
2. Navigate to the **SQL Editor**.
3. Copy the contents of `supabase/schema.sql` and execute the query to provision:
   - Enums (`user_role`, `student_status`, `college_status`)
   - Tables (`colleges`, `profiles`, `departments`, `students`)
   - Row Level Security (RLS) policies
   - Storage buckets (`logos`, `student-photos`)
4. Create an initial Super Admin account or use the provided seed queries in the SQL editor.

### 5. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📦 Build for Production

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 🚢 Deployment on Vercel

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import the `IdCardGenerator` repository.
4. In **Project Settings ➔ Environment Variables**, add:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
5. Click **Deploy**.
6. In your **Supabase Dashboard** ➔ **Authentication** ➔ **URL Configuration**, add your production Vercel URL to **Site URL** and **Redirect URLs** (e.g., `https://id-card-generator-delta-eight.vercel.app/**`).

---

## 🛡️ Security & Privacy Highlights

- **Multi-Tenant Row-Level Security**: Colleges can only query their own department and student records.
- **Admin Privilege Safeguard**: Template updates are restricted to admin users directly in PostgreSQL policies.
- **Student Modification Lock**: Once a student submits their card, edits are disabled unless requested changes are approved or rejected by the institution.
- **Verification Masking**: Scanned QR codes show only public validation details (Name, College, Department, Validity) to safeguard student privacy.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

