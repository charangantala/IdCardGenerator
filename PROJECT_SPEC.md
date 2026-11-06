# Digital ID Card Generator (Multi-College SaaS)

> A web platform where colleges get a branded digital ID card system. Students fill in their details, see a live card preview, and colleges verify and manage them. The platform owner (Admin) controls every college's card design.

**How to use this file:** Put it in the root of your repo as `PROJECT_SPEC.md`. Copy the "Rules for the AI" section into `CLAUDE.md` (Claude Code) or `.cursorrules` (Cursor). Then work through the phases in Section 12 one at a time, pasting each phase prompt into your AI tool.

---

## 1. Product Overview

| Item | Decision |
|---|---|
| Product type | Multi-tenant SaaS (one app, many colleges) |
| Domain | One shared domain for everyone |
| Login | One login page, redirect by role |
| Template editing | **Admin only** |
| Payments | None in the app (handled offline) |
| Core idea | React controlled forms + props + state + reusable components + dynamic rendering |

### Three roles

1. **Admin** (the owner/builder): manages colleges, edits each college's card template, can view everything.
2. **College**: manages its own departments, years and students (full CRUD), approves or rejects cards.
3. **Student**: fills in their own ID card form, sees a live preview, downloads the card once approved.

---

## 2. Access Control Matrix

| Feature | Admin | College | Student |
|---|---|---|---|
| Add / edit / suspend / delete colleges | Yes | No | No |
| Edit card template | Yes | No | No |
| View card template (read-only) | Yes | Yes | Yes |
| Manage departments | Yes | Yes (own) | No |
| Student CRUD | Yes | Yes (own college) | No |
| Edit own ID card form | Yes (View-as) | Yes (View-as) | Yes (own only) |
| Approve / reject cards | Yes | Yes (own college) | No |
| Download card PNG/PDF | Yes | Yes | Yes (approved only) |
| Bulk CSV import | Yes | Yes (own college) | No |

**Hierarchy:** Admin can open the College and Student screens through a **"View as"** switch. College can open the Student form for any of its students. Student sees only their own data.

**Critical rule:** Every record belongs to a `college_id`. A college must never see another college's data. Enforce this in the database/backend, never only in React.

---

## 3. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast, AI tools know it well |
| Routing | React Router v6 | Role-based routes |
| Styling | Tailwind CSS | Quick, consistent UI |
| Forms | Plain controlled inputs (matches project concept) | Keeps it educational |
| State | React Context (auth) + `useState` / `useReducer` | No extra library needed |
| Backend + DB | **Supabase** (Postgres, Auth, Storage, Row Level Security) | Least code, built-in tenant isolation |
| Card export | `html-to-image` + `jsPDF` | Download PNG/PDF |
| QR | `qrcode.react` | QR on card linking to verification page |
| CSV import | `papaparse` | Bulk student upload |
| Photo crop | `react-easy-crop` | Clean passport-style photos |
| Hosting | Vercel (frontend), Supabase (backend) | Free tiers to start |

> Alternative backend: Node + Express + MongoDB with JWT. If you choose it, every query must filter by `collegeId` from the token.

---

## 4. Architecture

```
Browser (React SPA)
   |
   |-- AuthContext (user, role, collegeId)
   |-- ProtectedRoute (role check)
   |
Supabase
   |-- Auth (email + password)
   |-- Postgres + Row Level Security (tenant isolation)
   |-- Storage (logos, student photos)
```

### Routes

| Path | Role | Screen |
|---|---|---|
| `/login` | Public | Single login page |
| `/admin` | Admin | Colleges list |
| `/admin/colleges/:id` | Admin | College details |
| `/admin/colleges/:id/template` | Admin | Template editor with live preview |
| `/college` | College | Departments grid |
| `/college/departments/:deptId` | College | Year filter + student table |
| `/college/students/:studentId` | College | Student form / card |
| `/student` | Student | ID card form + live preview |
| `/verify/:cardId` | Public | Card verification page (QR target) |

After login, redirect: admin to `/admin`, college to `/college`, student to `/student`.

---

## 5. Data Model

```sql
colleges
  id uuid pk
  name text
  code text unique          -- short college code, e.g. "MITC"
  logo_url text
  status text               -- 'active' | 'suspended'
  student_limit int
  valid_until date
  template_config jsonb     -- see Section 6
  created_at timestamptz

profiles                    -- one row per login user
  id uuid pk (= auth.users.id)
  role text                 -- 'admin' | 'college' | 'student'
  college_id uuid fk null   -- null for admin
  full_name text

departments
  id uuid pk
  college_id uuid fk
  name text
  years int                 -- number of years, e.g. 3 or 4

students
  id uuid pk
  profile_id uuid fk null
  college_id uuid fk
  department_id uuid fk
  year int                  -- 1, 2, 3, 4
  name text
  roll_no text
  dob date
  gender text
  blood_group text
  phone text
  email text
  address text
  guardian_name text
  photo_url text
  status text               -- 'draft' | 'submitted' | 'approved' | 'rejected'
  reject_reason text
  card_id uuid unique       -- public id used in QR/verify URL
  valid_until date
  created_at timestamptz
  updated_at timestamptz
  unique (college_id, roll_no)
```

### Row Level Security rules (must implement)

- `colleges`: admin full access; college/student can only **select** their own row.
- `departments`: admin full; college full where `college_id` matches; student select only.
- `students`: admin full; college full where `college_id` matches; student can select/update only the row linked to their `profile_id`, and cannot change `status` to `approved`.
- `template_config` updates: **admin only**.
- Public `/verify/:cardId`: expose only a safe view (name, photo, roll no, college, department, year, validity, status) for approved cards.

---

## 6. Card Template (JSON driven)

The `IdCard` component renders from this JSON. The Admin edits it in the Template Editor.

```json
{
  "layout": "vertical",
  "colors": {
    "primary": "#1e3a8a",
    "secondary": "#f59e0b",
    "text": "#111827",
    "background": "#ffffff"
  },
  "font": "Poppins",
  "logoPosition": "top-center",
  "photoShape": "circle",
  "showFields": ["name", "rollNo", "department", "year", "bloodGroup", "phone", "validUntil"],
  "fieldLabels": { "rollNo": "Roll No", "bloodGroup": "Blood Group" },
  "showQR": true,
  "footerText": "If found, please return to the college office.",
  "cornerRadius": 12
}
```

### Template Editor controls

| Control | Input type |
|---|---|
| Layout (vertical / horizontal) | Dropdown |
| Colors | Color pickers |
| Font | Dropdown (Google Fonts shortlist) |
| Photo shape (circle / square / rounded) | Dropdown |
| Fields to show | Checkbox list |
| Field labels | Text inputs |
| Show QR | Toggle |
| Footer text | Text input |
| Logo | Image upload |

A live `IdCard` preview sits next to the controls and updates on every change.

---

## 7. Folder Structure

```
src/
├── components/
│   ├── IdCard/
│   │   ├── IdCard.jsx            # renders card from (student, template) props
│   │   ├── IdCardFront.jsx
│   │   ├── IdCardBack.jsx        # phase 2
│   │   └── IdCardPreview.jsx     # wrapper with scale + download buttons
│   ├── forms/
│   │   ├── StudentForm.jsx       # controlled form, reused by student + college
│   │   ├── CollegeForm.jsx
│   │   └── DepartmentForm.jsx
│   │   └── TemplateEditorForm.jsx
│   ├── tables/
│   │   ├── StudentTable.jsx
│   │   └── CollegeTable.jsx
│   ├── filters/
│   │   ├── DepartmentCards.jsx
│   │   └── YearTabs.jsx
│   └── common/                   # Button, Input, Select, Modal, Navbar, Sidebar, Badge, Toast
├── pages/
│   ├── Login.jsx
│   ├── Verify.jsx
│   ├── admin/    (AdminHome, CollegeDetails, TemplateEditor)
│   ├── college/  (CollegeHome, DepartmentStudents, StudentEdit)
│   └── student/  (StudentHome)
├── context/AuthContext.jsx
├── routes/       (AppRoutes.jsx, ProtectedRoute.jsx)
├── services/     (supabaseClient.js, collegeService.js, studentService.js, templateService.js)
├── hooks/        (useAuth.js, useStudents.js, useTemplate.js)
└── utils/        (validators.js, downloadCard.js, csv.js, constants.js)
```

---

## 8. Screen Specifications

### 8.1 Login
- Email + password. One page for all roles.
- On success, read role from `profiles` and redirect.
- If the college is `suspended` or past `valid_until`, block login for that college's users with a clear message.

### 8.2 Admin Dashboard
- **Colleges list:** table with name, code, status, student count, valid until. Search box.
- **Actions:** Add college (also creates the college's first login), Edit, Suspend/Activate, Delete (with confirm).
- **Click a college:** opens details with tabs: Overview, Template, Departments, Students.
- **Template tab:** the Template Editor with live preview using sample student data.
- **View as College / View as Student:** buttons in the navbar.

### 8.3 College Dashboard
1. **Departments grid:** a card per department showing student counts. Add/edit/delete departments.
2. **Year filter:** after picking a department, show tabs: All, 1st Year, 2nd Year, 3rd Year, 4th Year (based on the department's `years`).
3. **Student table** (filtered by department + year): photo, name, roll no, status badge, actions.
4. **CRUD:**
   - Create: opens `StudentForm` in a modal or page.
   - Read: view card preview.
   - Update: edit any field.
   - Delete: confirm dialog.
5. **Approve / Reject** with a rejection reason.
6. **Bulk:** CSV import, export student list, download all approved cards as one PDF (phase 2).
7. **Extras:** search by name/roll no, filter by status, pagination.

### 8.4 Student Dashboard
- Two-column layout: **form on the left, live card preview on the right**.
- Fields: name, roll no, department, year, DOB, gender, blood group, phone, email, address, guardian name, photo (upload + crop).
- Buttons: Save Draft, Submit for Approval.
- Status banner: Draft / Submitted / Approved / Rejected (with reason).
- Download PNG/PDF enabled only when status is `approved`.
- After submission, the form is locked unless rejected.

### 8.5 Public Verify Page
- `/verify/:cardId` shows name, photo, college, department, year, validity and a green "Valid" or red "Invalid/Expired" badge.

---

## 9. Validation Rules

| Field | Rule |
|---|---|
| Name | Required, 2-60 chars |
| Roll no | Required, unique within the college |
| Phone | 10 digits |
| Email | Valid format |
| DOB | Valid date, not in the future |
| Blood group | One of A+, A-, B+, B-, AB+, AB-, O+, O- |
| Photo | JPG/PNG, max 2 MB, cropped to 3:4 |
| Year | 1 to the department's `years` |

---

## 10. Security Checklist

- [ ] Row Level Security enabled on every table
- [ ] Only admin can write `template_config` and `colleges`
- [ ] Students cannot set their own status to `approved`
- [ ] Suspended/expired colleges are blocked at login and at the database level
- [ ] Storage buckets: students can upload only to their own folder; college can read only its own folder
- [ ] Public verify page uses a limited view, never the raw table
- [ ] No secrets in the frontend except the Supabase anon key
- [ ] Input validation on both client and server
- [ ] Rate limit login attempts (Supabase Auth settings)

---

## 11. Rules for the AI (paste into `CLAUDE.md` or `.cursorrules`)

```
Project: Digital ID Card Generator (multi-college SaaS). Read PROJECT_SPEC.md before any task.

Stack: React 18 + Vite, React Router v6, Tailwind CSS, Supabase (Auth, Postgres, Storage, RLS).

Rules:
1. Use functional components and hooks only. JavaScript (JSX), no TypeScript unless asked.
2. IdCard must be a pure presentational component: props (student, template) only, no data fetching inside.
3. Use plain controlled inputs for forms (value + onChange).
4. Every database table has college_id (except colleges, profiles for admin). Never write a query that skips tenant filtering.
5. Template editing is admin-only. Enforce in RLS, not only in UI.
6. Keep components small and reusable. Put API calls in /services, never inside components.
7. Every list screen needs loading, empty and error states.
8. Make every screen responsive (mobile first).
9. Do one phase at a time. After each phase, tell me how to run and test it.
10. Do not install extra libraries without telling me why.
11. Use the folder structure and naming from PROJECT_SPEC.md.
```

---

## 12. Build Phases (with AI prompts)

Work in order. Finish and test each phase before the next. Commit to Git after every phase.

### Phase 0: Project setup
**Goal:** Running Vite + React + Tailwind app with routing and folder structure.

> **Prompt:** "Read PROJECT_SPEC.md. Set up a Vite + React project with Tailwind CSS and React Router. Create the folder structure from Section 7 with empty placeholder files. Add a basic Navbar and a placeholder page for each route in Section 4."

**Done when:** All routes open a placeholder page.

---

### Phase 1: Reusable IdCard component
**Goal:** Card renders from a student object and a template JSON.

> **Prompt:** "Build `IdCard.jsx` in components/IdCard. It takes `student` and `template` props and renders the card using the template JSON from Section 6: colors, font, photo shape, visible fields, logo and QR. Support vertical and horizontal layouts. Create `sampleData.js` with 3 sample students and 3 different templates. Build a test page that shows all three side by side."

**Done when:** Changing the template JSON visibly changes the card.

---

### Phase 2: Student form with live preview
**Goal:** The core concept: controlled form + state + live preview.

> **Prompt:** "Build `StudentForm.jsx` using controlled inputs and the validation rules in Section 9. Build the student page with the form on the left and `IdCardPreview` on the right, updating on every keystroke. Add photo upload with crop using react-easy-crop. Use local state and sample data for now."

**Done when:** Typing in the form updates the card instantly and validation errors show.

---

### Phase 3: Template Editor (admin)
**Goal:** Admin edits a template and sees a live preview.

> **Prompt:** "Build `TemplateEditorForm.jsx` with the controls listed in Section 6 and a live `IdCard` preview. Keep the template in state and add a Save button (mock save for now). Reuse the same IdCard component."

**Done when:** Every control changes the preview.

---

### Phase 4: Auth and protected routes (mock)
**Goal:** Role-based login and redirects with fake users.

> **Prompt:** "Build `AuthContext`, `useAuth`, `Login.jsx` and `ProtectedRoute.jsx`. Use 3 mock users (admin, college, student). Redirect by role after login. Block routes the role cannot access. Add a 'View as' dropdown for the admin in the Navbar."

**Done when:** Each role only reaches its own routes; admin can switch views.

---

### Phase 5: College dashboard
**Goal:** Department, then year filter, then student CRUD.

> **Prompt:** "Build the college dashboard per Section 8.3 using mock data in state: department cards, year tabs, student table with search and status filter, and a modal with StudentForm for create/edit. Add delete with confirmation and approve/reject with reason."

**Done when:** Full CRUD works and the filters narrow the list correctly.

---

### Phase 6: Admin college management
**Goal:** College list and per-college template.

> **Prompt:** "Build the admin colleges list per Section 8.2 with add, edit, suspend and delete. Clicking a college opens its details with a Template tab using the Template Editor from Phase 3."

**Done when:** Each college has its own template and the student preview uses it.

---

### Phase 7: Real backend (Supabase)
**Goal:** Replace all mock data with a database.

> **Prompt:** "Create the Supabase SQL for the tables in Section 5 and write the Row Level Security policies described there. Create `supabaseClient.js` and the service files. Replace mock data and mock auth with Supabase Auth and queries. Upload photos and logos to Supabase Storage. Give me the SQL to run and the env variables to set."

**Done when:** Two different colleges cannot see each other's data (test this manually).

---

### Phase 8: Download, QR and verification
**Goal:** Real, printable cards and a public check page.

> **Prompt:** "Add PNG and PDF download using html-to-image and jsPDF, enabled only for approved cards. Add a QR code linking to /verify/:cardId. Build the public Verify page using a limited database view."

**Done when:** Scanning the QR on a downloaded card opens the verify page.

---

### Phase 9: Bulk tools and polish
> **Prompt:** "Add CSV import of students with row-level error reporting using papaparse, a CSV export of the student list, and download-all-approved-cards as one multi-page PDF. Add toasts, loading skeletons, empty states and mobile responsiveness across all screens."

---

### Phase 10: Deploy
> **Prompt:** "Prepare this project for deployment on Vercel with Supabase. List the env variables, the Supabase auth redirect URLs, and a pre-launch checklist."

---

## 13. Suggested AI Tool Workflow

| Task | Tool |
|---|---|
| Planning, spec changes, SQL/RLS design, code review | Claude (chat) |
| Writing and editing code across files | Claude Code or Cursor |
| UI mockups and quick layouts | Claude artifacts, v0.dev |
| Debugging errors | Paste the full error + the file into your AI tool |
| Database management | Supabase dashboard + SQL editor |

**Habits that make AI-built projects work:**
1. One phase per session. Do not ask for the whole app at once.
2. Always give the AI this file first.
3. Test after every phase, then commit.
4. When something breaks, paste the exact error message and the relevant file.
5. Ask the AI to explain any code you do not understand.
6. Review security (Section 10) with the AI before launching.

---

## 14. Testing Checklist

**Isolation**
- [ ] College A cannot see College B's students (try by editing URLs and IDs)
- [ ] Student cannot open `/college` or `/admin`
- [ ] College cannot open `/admin` or edit templates
- [ ] Suspended college cannot log in

**Features**
- [ ] Student form updates preview live
- [ ] Draft, Submit, Approve, Reject flow works
- [ ] Download is blocked until approved
- [ ] CSV import rejects bad rows and reports them
- [ ] Duplicate roll number in the same college is rejected
- [ ] Verify page shows "Invalid" for rejected or expired cards

---

## 15. Phase 2 Ideas (after MVP)

- Back side of the card (emergency contact, address, rules)
- Card re-issue and expiry reminders
- Audit log (who edited what and when)
- Student limit enforcement per college
- Email notifications on approve/reject
- Multiple template designs per college
- Online payments and subscription plans (only if you decide to add them later)
- Analytics for admin (cards issued per college)

---

## 16. Seed Data for Testing

| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | Admin@123 |
| College (MITC) | college@mitc.com | College@123 |
| Student (MITC) | student@mitc.com | Student@123 |

Create 2 colleges, 3 departments each, and about 10 students per college with different statuses so every screen has data.

---

## 17. Open Decisions Log

| Question | Decision |
|---|---|
| Subdomains per college? | No, one shared domain |
| Colleges edit templates? | No, admin only |
| Online payments? | No, offline for now |
| How do students get accounts? | **To decide:** college creates accounts / CSV import with invite, or student self-register with college code + roll number |
| Backend | Supabase (recommended) |
