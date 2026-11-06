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
    status: 'active',
  },
  {
    id: 'usr-student-1',
    email: 'student@mitc.com',
    password: 'Student@123',
    role: 'student',
    full_name: 'Alex Morgan',
    college_id: 'mitc',
    collegeName: 'MIT College of Technology',
    student_id: 'stud-001',
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

  const [loading, setLoading] = useState(isSupabaseConfigured());

  // Listen for Supabase session changes when connected
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            // Fetch profile
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*, colleges(name, code, status, valid_until)')
              .eq('id', session.user.id)
              .single();

            if (!error && profile) {
              const college = profile.colleges;
              // Check suspension
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
        } else {
          // If no session on supabase, clear user if supabase was active
          // (keep local session if falling back to mock)
        }
        setLoading(false);
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

  const login = async (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. If Supabase is connected, sign in with real Supabase Auth
    if (isSupabaseConfigured() && supabase) {
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

      // Section 8.1 suspension check
      if (profile.colleges?.status === 'suspended') {
        await supabase.auth.signOut();
        throw new Error('This college account has been suspended by the platform administrator. Access blocked.');
      }

      const authenticatedUser = {
        id: data.user.id,
        email: data.user.email,
        role: profile.role,
        full_name: profile.full_name,
        college_id: profile.college_id,
        collegeName: profile.colleges?.name,
        collegeCode: profile.colleges?.code,
        status: 'active',
      };

      setUser(authenticatedUser);
      setViewAsRole(null);
      return authenticatedUser;
    }

    // 2. Otherwise use mock users with full validation
    const foundUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === trimmedEmail && u.password === password
    );

    if (!foundUser) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }

    if (foundUser.status === 'suspended') {
      throw new Error('This college account has been suspended by the platform administrator. Access blocked.');
    }

    if (foundUser.valid_until && new Date(foundUser.valid_until) < new Date()) {
      throw new Error('This college subscription validity has expired. Please contact support.');
    }

    setUser(foundUser);
    setViewAsRole(null);
    return foundUser;
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
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
