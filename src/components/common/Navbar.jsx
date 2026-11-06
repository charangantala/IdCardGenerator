import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from './Badge';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    role,
    actualRole,
    isViewAsActive,
    viewAsRole,
    setViewAs,
    clearViewAs,
    logout,
  } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewAsChange = (e) => {
    const selected = e.target.value;
    if (!selected || selected === 'admin') {
      clearViewAs();
      navigate('/admin');
    } else {
      setViewAs(selected);
      if (selected === 'college') navigate('/college');
      if (selected === 'student') navigate('/student');
    }
  };

  // Determine navigation items based on current effective role
  const getNavLinks = () => {
    if (!user) {
      return [{ label: 'Sign In', path: '/login' }];
    }

    const links = [{ label: 'Card Showcase', path: '/cards-test' }];

    if (role === 'admin') {
      links.push({ label: 'Colleges & Templates', path: '/admin' });
    } else if (role === 'college') {
      links.push({ label: 'Department Portal', path: '/college' });
    } else if (role === 'student') {
      links.push({ label: 'My ID Card', path: '/student' });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* "View As" Banner for Admin */}
      {isViewAsActive && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2 mx-auto">
            <span>👁️ Admin Preview Mode:</span>
            <span className="uppercase font-bold tracking-wider underline">
              Viewing as {viewAsRole}
            </span>
            <span className="text-amber-100 font-normal">
              (Access restricted to {viewAsRole} routes)
            </span>
            <button
              type="button"
              onClick={() => {
                clearViewAs();
                navigate('/admin');
              }}
              className="ml-3 bg-white text-amber-900 px-2 py-0.5 rounded text-[11px] font-bold hover:bg-amber-100 shadow-xs"
            >
              Exit View As
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <Link to={user ? (role === 'admin' ? '/admin' : role === 'college' ? '/college' : '/student') : '/login'} className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                ID
              </span>
              <div>
                <span className="font-bold text-base text-gray-900 tracking-tight block leading-none">
                  CardCraft
                </span>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                  SaaS Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || location.pathname.startsWith(`${link.path}/`);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Controls & "View As" Dropdown */}
          <div className="flex items-center space-x-3">
            {/* View As Dropdown (Admin Only) */}
            {actualRole === 'admin' && (
              <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                  View as:
                </span>
                <select
                  value={viewAsRole || 'admin'}
                  onChange={handleViewAsChange}
                  className="text-xs font-bold text-blue-700 bg-transparent border-0 focus:ring-0 cursor-pointer p-0"
                >
                  <option value="admin">Admin</option>
                  <option value="college">College (MITC)</option>
                  <option value="student">Student (Alex)</option>
                </select>
              </div>
            )}

            {/* Profile Info / Logout */}
            {user ? (
              <div className="flex items-center space-x-2 border-l pl-3 border-gray-200">
                <div className="text-right hidden sm:block">
                  <span className="block text-xs font-bold text-gray-800 leading-tight">
                    {user.full_name}
                  </span>
                  <span className="block text-[10px] uppercase font-semibold text-gray-400">
                    {user.collegeName || user.role}
                  </span>
                </div>
                <Badge
                  variant={
                    role === 'admin' ? 'purple' : role === 'college' ? 'blue' : 'green'
                  }
                  size="sm"
                >
                  {role}
                </Badge>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 text-xs text-gray-500 hover:text-red-600 font-medium hover:bg-red-50 rounded transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
