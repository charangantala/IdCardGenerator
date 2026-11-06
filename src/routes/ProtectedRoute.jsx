import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - Role-based route guard matching Section 2 and Section 4.
 * Checks effective role and blocks unauthorized routes.
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, role, actualRole, isViewAsActive } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is specified, check against current effective role
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If Admin is in 'View As' mode and tries to access admin-only routes, prompt them to exit View As
    if (actualRole === 'admin' && isViewAsActive && allowedRoles.includes('admin')) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <div className="text-3xl mb-2">👁️</div>
          <h3 className="text-lg font-bold text-amber-900">
            You are currently viewing the platform as "{role.toUpperCase()}"
          </h3>
          <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
            This route requires administrator privileges. To access this dashboard, switch your "View As" setting back to Admin in the top navigation bar.
          </p>
        </div>
      );
    }

    // Redirect other roles to their authorized home
    if (role === 'student') {
      return <Navigate to="/student" replace />;
    }
    if (role === 'college') {
      return <Navigate to="/college" replace />;
    }
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
