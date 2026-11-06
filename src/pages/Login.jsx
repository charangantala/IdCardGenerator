import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const ROLE_CONFIGS = {
  admin: {
    key: 'admin',
    title: 'Platform Admin Portal',
    subtitle: 'Manage colleges, subscriptions, and card templates',
    icon: '🛡️',
    badgeText: 'Platform Owner',
    themeColor: 'indigo',
    accentBorder: 'border-indigo-500',
    accentBg: 'bg-indigo-50',
    accentText: 'text-indigo-700',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
    demoEmail: 'admin@demo.com',
    demoPassword: 'Admin@123',
    demoLabel: 'Use Admin Demo Credentials',
    targetRoute: '/admin',
  },
  college: {
    key: 'college',
    title: 'College Administration Portal',
    subtitle: 'Manage departments, enroll students, and approve digital ID cards',
    icon: '🏛️',
    badgeText: 'College Registrar',
    themeColor: 'blue',
    accentBorder: 'border-blue-500',
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-700',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    demoEmail: 'college@mitc.com',
    demoPassword: 'College@123',
    demoLabel: 'Use College (MITC) Demo Credentials',
    targetRoute: '/college',
  },
  student: {
    key: 'student',
    title: 'Student Credential Portal',
    subtitle: 'Fill your profile details, preview your ID card, and download when approved',
    icon: '🎓',
    badgeText: 'Student',
    themeColor: 'emerald',
    accentBorder: 'border-emerald-500',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
    demoEmail: 'student@mitc.com',
    demoPassword: 'Student@123',
    demoLabel: 'Use Student (Alex) Demo Credentials',
    targetRoute: '/student',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login } = useAuth();

  // Read role from query param (?role=admin | college | student) or default to 'college'
  const initialRole = searchParams.get('role');
  const [selectedRole, setSelectedRole] = useState(
    ROLE_CONFIGS[initialRole] ? initialRole : 'college'
  );

  const currentConfig = ROLE_CONFIGS[selectedRole];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // When tab changes, pre-populate demo hints and reset errors
  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setSearchParams({ role: roleKey });
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleFillDemo = () => {
    setEmail(currentConfig.demoEmail);
    setPassword(currentConfig.demoPassword);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      const authenticatedUser = await login(email, password);

      // Verify the user is logging into the appropriate portal
      if (authenticatedUser.role !== selectedRole && authenticatedUser.role !== 'admin') {
        throw new Error(
          `This account has the role "${authenticatedUser.role.toUpperCase()}". Please switch to the ${authenticatedUser.role.toUpperCase()} login tab above.`
        );
      }

      // Redirect to the corresponding portal
      if (authenticatedUser.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (authenticatedUser.role === 'college') {
        navigate('/college', { replace: true });
      } else if (authenticatedUser.role === 'student') {
        navigate('/student', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2">
            <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shadow-md">
              ID
            </span>
            <span className="font-extrabold text-2xl text-gray-900 tracking-tight">
              CardCraft SaaS
            </span>
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            Choose your portal below to sign into your account
          </p>
        </div>

        {/* 3 Distinct Portal Tabs */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-200/70 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => handleRoleSelect('college')}
            className={`py-3 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 ${
              selectedRole === 'college'
                ? 'bg-white text-blue-700 shadow-md ring-1 ring-blue-500/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span className="text-base">🏛️</span>
            <span>College Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('student')}
            className={`py-3 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 ${
              selectedRole === 'student'
                ? 'bg-white text-emerald-700 shadow-md ring-1 ring-emerald-500/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span className="text-base">🎓</span>
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('admin')}
            className={`py-3 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 ${
              selectedRole === 'admin'
                ? 'bg-white text-indigo-700 shadow-md ring-1 ring-indigo-500/20'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span className="text-base">🛡️</span>
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Main Login Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-200 space-y-6">
          {/* Active Portal Header */}
          <div className="flex items-start justify-between pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl">{currentConfig.icon}</span>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentConfig.title}
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                {currentConfig.subtitle}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${currentConfig.accentBg} ${currentConfig.accentText}`}
            >
              {currentConfig.badgeText}
            </span>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-start space-x-2">
              <span className="text-sm font-bold flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Controlled Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={`${currentConfig.badgeText} Email`}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`e.g. ${currentConfig.demoEmail}`}
              required
            />

            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className={`w-full py-2.5 text-white ${currentConfig.buttonBg}`}
              disabled={loading}
            >
              {loading ? 'Signing In...' : `Sign In to ${currentConfig.badgeText} Portal`}
            </Button>
          </form>

          {/* One-Click Demo Helper For Selected Role */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-gray-800 block">
                Testing this portal?
              </span>
              <span className="text-[11px] text-gray-500 font-mono">
                {currentConfig.demoEmail} • {currentConfig.demoPassword}
              </span>
            </div>

            <button
              type="button"
              onClick={handleFillDemo}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 shadow-xs transition-colors whitespace-nowrap text-xs"
            >
              Fill Demo Credentials ⚡
            </button>
          </div>
        </div>

        {/* Public Card Verification Shortcut */}
        <div className="text-center text-xs text-gray-400">
          Looking to verify an issued student ID card?{' '}
          <Link
            to="/verify/card-alex-001"
            className="text-blue-600 font-semibold hover:underline"
          >
            Public ID Verification Page →
          </Link>
        </div>
      </div>
    </div>
  );
}
