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
