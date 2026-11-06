-- ==============================================================================
-- DIGITAL ID CARD GENERATOR - MULTI-TENANT SAAS DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase Postgres + Auth + Storage
-- Specification Reference: Section 5, Section 6, Section 10
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'college', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE student_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE college_status AS ENUM ('active', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. TABLES DEFINITION
-- ==============================================================================

-- COLLEGES TABLE
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    status college_status NOT NULL DEFAULT 'active',
    student_limit INT NOT NULL DEFAULT 1000,
    valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    template_config JSONB NOT NULL DEFAULT '{
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
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'student',
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    years INT NOT NULL DEFAULT 4 CHECK (years >= 1 AND years <= 6),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    year INT NOT NULL DEFAULT 1 CHECK (year >= 1),
    name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2 AND char_length(trim(name)) <= 60),
    roll_no TEXT NOT NULL,
    dob DATE CHECK (dob <= CURRENT_DATE),
    gender TEXT,
    blood_group TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    guardian_name TEXT,
    photo_url TEXT,
    status student_status NOT NULL DEFAULT 'draft',
    reject_reason TEXT,
    card_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_college_roll_no UNIQUE (college_id, roll_no)
);

-- Auto-update updated_at on students
CREATE OR REPLACE FUNCTION update_student_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_student_updated_at ON public.students;
CREATE TRIGGER trg_student_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION update_student_timestamp();

-- ==============================================================================
-- 4. PUBLIC VERIFICATION SAFE VIEW (Section 5 & 8.5)
-- Exposes ONLY non-sensitive card verification data for approved cards
-- ==============================================================================
CREATE OR REPLACE VIEW public.public_card_verification AS
SELECT
    s.card_id,
    s.name,
    s.roll_no,
    s.year,
    s.photo_url,
    s.valid_until,
    s.status,
    c.name AS college_name,
    c.code AS college_code,
    c.status AS college_status,
    d.name AS department_name
FROM public.students s
JOIN public.colleges c ON s.college_id = c.id
JOIN public.departments d ON s.department_id = d.id
WHERE s.status = 'approved' AND c.status = 'active';

-- Allow public anonymous access to the verification view
GRANT SELECT ON public.public_card_verification TO anon, authenticated;

-- ==============================================================================
-- 5. HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_college_id()
RETURNS UUID AS $$
    SELECT college_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES (Section 2, 5, 10)
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. COLLEGES POLICIES
-- Admin: full access
-- College & Student: can SELECT ONLY their own college
-- Template Config edit: ADMIN ONLY
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "colleges_admin_all" ON public.colleges;
CREATE POLICY "colleges_admin_all" ON public.colleges
FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "colleges_tenant_read" ON public.colleges;
CREATE POLICY "colleges_tenant_read" ON public.colleges
FOR SELECT TO authenticated
USING (
    public.current_user_role() IN ('college', 'student')
    AND id = public.current_user_college_id()
);

-- ------------------------------------------------------------------------------
-- B. PROFILES POLICIES
-- Admin: full access
-- Users: select their own profile
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- C. DEPARTMENTS POLICIES
-- Admin: full access
-- College: full access WHERE college_id matches
-- Student: select only WHERE college_id matches
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "departments_admin_all" ON public.departments;
CREATE POLICY "departments_admin_all" ON public.departments
FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "departments_college_manage" ON public.departments;
CREATE POLICY "departments_college_manage" ON public.departments
FOR ALL TO authenticated
USING (
    public.current_user_role() = 'college'
    AND college_id = public.current_user_college_id()
)
WITH CHECK (
    public.current_user_role() = 'college'
    AND college_id = public.current_user_college_id()
);

DROP POLICY IF EXISTS "departments_student_read" ON public.departments;
CREATE POLICY "departments_student_read" ON public.departments
FOR SELECT TO authenticated
USING (
    public.current_user_role() = 'student'
    AND college_id = public.current_user_college_id()
);

-- ------------------------------------------------------------------------------
-- D. STUDENTS POLICIES
-- Admin: full access
-- College: full access WHERE college_id matches
-- Student: select/update ONLY their own row, CANNOT set status to 'approved'
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "students_admin_all" ON public.students;
CREATE POLICY "students_admin_all" ON public.students
FOR ALL TO authenticated
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "students_college_manage" ON public.students;
CREATE POLICY "students_college_manage" ON public.students
FOR ALL TO authenticated
USING (
    public.current_user_role() = 'college'
    AND college_id = public.current_user_college_id()
)
WITH CHECK (
    public.current_user_role() = 'college'
    AND college_id = public.current_user_college_id()
);

DROP POLICY IF EXISTS "students_self_read" ON public.students;
CREATE POLICY "students_self_read" ON public.students
FOR SELECT TO authenticated
USING (
    public.current_user_role() = 'student'
    AND profile_id = auth.uid()
    AND college_id = public.current_user_college_id()
);

DROP POLICY IF EXISTS "students_self_update" ON public.students;
CREATE POLICY "students_self_update" ON public.students
FOR UPDATE TO authenticated
USING (
    public.current_user_role() = 'student'
    AND profile_id = auth.uid()
    AND college_id = public.current_user_college_id()
)
WITH CHECK (
    public.current_user_role() = 'student'
    AND profile_id = auth.uid()
    AND college_id = public.current_user_college_id()
    -- Critical Security: Student CANNOT set their own status to approved!
    AND (status <> 'approved')
);

-- ==============================================================================
-- 7. STORAGE BUCKETS SETUP (Photos & Logos)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('college-logos', 'college-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Anyone can view student photos (needed for cards & verify)
DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
CREATE POLICY "photos_public_read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'student-photos');

-- Storage Policy: Authenticated users can upload to student-photos
DROP POLICY IF EXISTS "photos_auth_upload" ON storage.objects;
CREATE POLICY "photos_auth_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'student-photos');

-- Storage Policy: Users can update/delete their own uploads
DROP POLICY IF EXISTS "photos_auth_update" ON storage.objects;
CREATE POLICY "photos_auth_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'student-photos' AND auth.uid() = owner);

-- ==============================================================================
-- 8. SEED DATA (Section 16: Admin, MITC College, MITC Students)
-- ==============================================================================

-- Insert MITC College
INSERT INTO public.colleges (id, name, code, status, student_limit, valid_until)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'MIT College of Technology',
    'MITC',
    'active',
    1200,
    '2026-12-31'
) ON CONFLICT (code) DO NOTHING;

-- Insert Departments for MITC
INSERT INTO public.departments (id, college_id, name, code, years, description)
VALUES 
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Computer Science & Engineering',
    'CSE',
    4,
    'Software engineering, AI, algorithms'
),
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Electronics & Communication',
    'ECE',
    4,
    'Embedded hardware, VLSI, wireless networks'
) ON CONFLICT DO NOTHING;

-- Insert Sample Students for MITC
INSERT INTO public.students (
    college_id, department_id, year, name, roll_no, dob, gender, blood_group, phone, email, status, valid_until, photo_url
) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    3,
    'Alex Morgan',
    'MITC-2023-CS-042',
    '2003-05-14',
    'Male',
    'O+',
    '9876543210',
    'alex.morgan@student.mitc.edu',
    'approved',
    '2026-06-30',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80'
),
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    2,
    'Sophia Patel',
    'MITC-2024-CS-015',
    '2004-08-19',
    'Female',
    'A+',
    '9876543211',
    'sophia.patel@student.mitc.edu',
    'submitted',
    '2027-06-30',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80'
) ON CONFLICT DO NOTHING;

