-- ==============================================================================
-- CONNECT ALL DASHBOARDS - SUPABASE REALTIME & PERMISSIVE ACCESS SCRIPT
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bxzppeeecfdoicymjxze/sql
-- ==============================================================================

-- 1. Ensure columns exist on students table
ALTER TABLE IF EXISTS public.students 
ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'A',
ADD COLUMN IF NOT EXISTS approved_by TEXT;

-- 2. Ensure RLS policies allow public/anon web app access
-- (Since client uses VITE_SUPABASE_ANON_KEY to interact across all 3 dashboards)
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Colleges policies
DROP POLICY IF EXISTS "colleges_public_access" ON public.colleges;
CREATE POLICY "colleges_public_access" ON public.colleges
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Departments policies
DROP POLICY IF EXISTS "departments_public_access" ON public.departments;
CREATE POLICY "departments_public_access" ON public.departments
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Students policies (Allow select, insert, update, delete for web app)
DROP POLICY IF EXISTS "students_public_access" ON public.students;
CREATE POLICY "students_public_access" ON public.students
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Enable Supabase Realtime for instant cross-dashboard updates
-- (When a student submits, College Dashboard receives the event instantly)
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.colleges;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Ensure initial MIT College of Technology exists
INSERT INTO public.colleges (id, name, code, status, student_limit, valid_until)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'MIT College of Technology',
    'MITC',
    'active',
    1500,
    '2028-12-31'
) ON CONFLICT (code) DO UPDATE 
SET status = 'active', valid_until = '2028-12-31';

-- 5. Ensure Departments exist for MIT College of Technology
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
),
(
    'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Information Technology',
    'IT',
    4,
    'Cloud computing, web architecture, cyber security'
),
(
    'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380b55',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Mechanical Engineering',
    'MECH',
    4,
    'Robotics, thermodynamics, machine design'
) ON CONFLICT (id) DO NOTHING;

