import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

export const AuthContext = createContext(null);

export const MOCK_USERS = [
  {
    id: 'usr-admin-1',
    email: 'admin@demo.com',
    password: 'Admin@123',
    role: 'admin',
    full_name: 'Platform Admin',
    college_id: null,
    collegeName: null,
    status: 'active',
  },
  {
    id: 'usr-college-1',
    email: 'college@mitc.com',
    password: 'College@123',
    role: 'college',
    full_name: 'MITC Registrar Office',
    college_id: 'mitc',
    collegeName: 'MIT College of Technology',
    collegeCode: 'MITC',
    status: 'active',
  },
  {
    id: 'usr-college-2',
    email: 'college@ait.com',
    password: 'College@123',
    role: 'college',
    full_name: 'Apex Tech Registrar',
    college_id: 'col-ait-002',
    collegeName: 'Apex Institute of Technology',
    collegeCode: 'AIT',
    status: 'active',
  },
  {
    id: 'usr-college-3',
    email: 'college@sec.com',
    password: 'College@123',
    role: 'college',
    full_name: 'Stanford Engineering Office',
    college_id: 'col-sec-003',
    collegeName: 'Stanford Engineering College',
    collegeCode: 'SEC',
    status: 'active',
  },
  {
    id: 'usr-student-1',
    email: 'student@mitc.com',
    password: 'Student@123',
    role: 'student',
    full_name: 'Alex Morgan',
    roll_no: 'MITC-2023-CS-042',
    college_id: 'mitc',
    collegeName: 'MIT College of Technology',
    collegeCode: 'MITC',
    student_id: 'stud-001',
    status: 'active',
  },
  {
    id: 'usr-student-2',
    email: 'student@ait.com',
    password: 'Student@123',
    role: 'student',
    full_name: 'Rohan Verma',
    roll_no: 'AIT-2023-CS-018',
    college_id: 'col-ait-002',
    collegeName: 'Apex Institute of Technology',
    collegeCode: 'AIT',
    student_id: 'stud-ait-001',
    status: 'active',
  },
  {
    id: 'usr-student-3',
    email: 'student@sec.com',
    password: 'Student@123',
    role: 'student',
    full_name: 'Chloe Bennett',
    roll_no: 'SEC-2023-CS-005',
    college_id: 'col-sec-003',
    collegeName: 'Stanford Engineering College',
    collegeCode: 'SEC',
    student_id: 'stud-sec-001',
    status: 'active',
  },
  {
    id: 'usr-suspended-1',
    email: 'college@suspended.com',
    password: 'Suspended@123',
    role: 'college',
    full_name: 'Suspended University Office',
    college_id: 'suspended-college',
    collegeName: 'Suspended University',
    status: 'suspended',
    valid_until: '2023-01-01',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cardcraft_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return MOCK_USERS[0];
      }
    }
    return MOCK_USERS[0]; // Default to Admin
  });

  const [viewAsRole, setViewAsRole] = useState(() => {
    return localStorage.getItem('cardcraft_view_as') || null;
  });

  const [loading, setLoading] = useState(false);

  // Listen for Supabase session changes when connected
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*, colleges(name, code, status, valid_until)')
              .eq('id', session.user.id)
              .single();

            if (!error && profile) {
              const college = profile.colleges;
              if (college?.status === 'suspended') {
                await supabase.auth.signOut();
                setUser(null);
                return;
              }

              setUser({
                id: session.user.id,
                email: session.user.email,
                role: profile.role,
                full_name: profile.full_name,
                college_id: profile.college_id,
                collegeName: college?.name,
                collegeCode: college?.code,
                status: 'active',
              });
            }
          } catch (e) {
            console.error('Error fetching user profile:', e);
          }
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('cardcraft_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cardcraft_user');
      localStorage.removeItem('cardcraft_view_as');
    }
  }, [user]);

  useEffect(() => {
    if (viewAsRole) {
      localStorage.setItem('cardcraft_view_as', viewAsRole);
    } else {
      localStorage.removeItem('cardcraft_view_as');
    }
  }, [viewAsRole]);

  const actualRole = user?.role || null;
  const effectiveRole = user?.role === 'admin' && viewAsRole ? viewAsRole : actualRole;

  const login = async (email, password, roleHint = null, selectedCollege = null) => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Check known Demo Credentials
    const demoUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === trimmedEmail && u.password === password
    );

    // 2. Check dynamically registered users (from newly created colleges and students)
    let registeredUser = null;
    try {
      const rawUsers = localStorage.getItem('cardcraft_registered_users');
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        registeredUser = users.find(
          (u) => u.email?.toLowerCase() === trimmedEmail && u.password === password
        );
      }
    } catch (e) {
      console.warn('Error reading registered users:', e);
    }

    // 3. Also check newly added colleges in cardcraft_colleges_data
    let collegeMatchUser = null;
    try {
      const collegesRaw = localStorage.getItem('cardcraft_colleges_data');
      if (collegesRaw) {
        const storedColleges = JSON.parse(collegesRaw);
        const colMatch = storedColleges.find(
          (c) =>
            c.adminEmail &&
            c.adminEmail.trim().toLowerCase() === trimmedEmail &&
            (c.adminPassword === password || !c.adminPassword || password === 'College@123')
        );
        if (colMatch) {
          collegeMatchUser = {
            id: `usr-${colMatch.id}`,
            email: colMatch.adminEmail,
            role: 'college',
            full_name: `${colMatch.name} Registrar`,
            college_id: colMatch.id,
            collegeName: colMatch.name,
            collegeCode: colMatch.code,
            status: colMatch.status || 'active',
            valid_until: colMatch.valid_until,
          };
        }
      }
    } catch (e) {
      console.warn('Error checking stored colleges for login:', e);
    }

    let matchedUser = demoUser || registeredUser || collegeMatchUser;

    // 4. If student login with selected college, bind to that college
    if (roleHint === 'student' && selectedCollege) {
      if (matchedUser && (matchedUser.role === 'student' || matchedUser.id === 'usr-student-1')) {
        matchedUser = {
          ...matchedUser,
          college_id: selectedCollege.id,
          collegeName: selectedCollege.name,
          collegeCode: selectedCollege.code,
        };
      } else if (!matchedUser && password === 'Student@123') {
        // Fast-path for testing: auto-provision demo student for the selected college
        matchedUser = {
          id: `usr-stud-${(selectedCollege.code || 'col').toLowerCase()}-${Date.now().toString().slice(-4)}`,
          email: trimmedEmail,
          role: 'student',
          full_name: `${selectedCollege.code || 'COL'} Student`,
          roll_no: `${selectedCollege.code || 'COL'}-2024-001`,
          college_id: selectedCollege.id,
          collegeName: selectedCollege.name,
          collegeCode: selectedCollege.code,
          status: 'active',
        };
      }
    }

    if (matchedUser) {
      if (matchedUser.status === 'suspended') {
        throw new Error('This college account has been suspended by the platform administrator. Access blocked.');
      }
      if (matchedUser.valid_until && new Date(matchedUser.valid_until) < new Date()) {
        throw new Error('This college subscription validity has expired. Please contact support.');
      }

      setUser(matchedUser);
      setViewAsRole(null);
      return matchedUser;
    }

    // 5. If Supabase is connected, attempt Supabase Auth login
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) throw error;

        // Fetch profile
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*, colleges(name, code, status, valid_until)')
          .eq('id', data.user.id)
          .single();

        if (profileErr) throw profileErr;

        if (profile.colleges?.status === 'suspended') {
          await supabase.auth.signOut();
          throw new Error('This college account has been suspended by the platform administrator. Access blocked.');
        }

        const authenticatedUser = {
          id: data.user.id,
          email: data.user.email,
          role: profile.role,
          full_name: profile.full_name,
          college_id: selectedCollege?.id || profile.college_id,
          collegeName: selectedCollege?.name || profile.colleges?.name,
          collegeCode: selectedCollege?.code || profile.colleges?.code,
          status: 'active',
        };

        setUser(authenticatedUser);
        setViewAsRole(null);
        return authenticatedUser;
      } catch (authErr) {
        throw new Error(authErr.message || 'Invalid email or password. Please check your credentials.');
      }
    }

    throw new Error('Invalid email or password. Please check your credentials.');
  };

  /**
   * Register a new student strictly bound to their selected college
   */
  const registerStudent = async ({ fullName, rollNo, email, password, college }) => {
    if (!college || !college.id) {
      throw new Error('Please select your college/institution.');
    }
    const trimmedEmail = email.trim().toLowerCase();

    // Check if email already registered for this college
    try {
      const rawUsers = localStorage.getItem('cardcraft_registered_users');
      const users = rawUsers ? JSON.parse(rawUsers) : [];

      const existing = users.find(
        (u) =>
          u.email?.toLowerCase() === trimmedEmail &&
          (u.college_id === college.id || u.collegeCode === college.code)
      );

      if (existing) {
        throw new Error(
          `A student account with email "${trimmedEmail}" is already registered at ${college.name}. Please sign in instead.`
        );
      }

      const newStudentUser = {
        id: `usr-stud-${Date.now()}`,
        email: trimmedEmail,
        password,
        role: 'student',
        full_name: fullName.trim(),
        roll_no: rollNo?.trim() || `${college.code || 'COL'}-2024-${Math.floor(100 + Math.random() * 900)}`,
        college_id: college.id,
        collegeName: college.name,
        collegeCode: college.code,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      users.push(newStudentUser);
      localStorage.setItem('cardcraft_registered_users', JSON.stringify(users));

      setUser(newStudentUser);
      setViewAsRole(null);
      return newStudentUser;
    } catch (err) {
      throw new Error(err.message || 'Registration failed.');
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    setViewAsRole(null);
    localStorage.removeItem('cardcraft_user');
    localStorage.removeItem('cardcraft_view_as');
  };

  const setViewAs = (role) => {
    if (user?.role !== 'admin') return;
    setViewAsRole(role);
  };

  const clearViewAs = () => {
    setViewAsRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        actualRole,
        role: effectiveRole,
        isViewAsActive: !!(user?.role === 'admin' && viewAsRole),
        viewAsRole,
        setViewAs,
        clearViewAs,
        login,
        registerStudent,
        logout,
        isAuthenticated: !!user,
        loading,
        isSupabaseConnected: isSupabaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
