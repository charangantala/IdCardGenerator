import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collegeService } from '../services/collegeService';
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
    subtitle: 'Select your college, sign in or register, and apply for your official digital ID card',
    icon: '🎓',
    badgeText: 'Student',
    themeColor: 'emerald',
    accentBorder: 'border-emerald-500',
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-700',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
    demoEmail: 'student@mitc.com',
    demoPassword: 'Student@123',
    demoLabel: 'Use Student Demo Credentials',
    targetRoute: '/student',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, registerStudent } = useAuth();

  // Read role from query param (?role=admin | college | student) or default to 'college'
  const initialRole = searchParams.get('role');
  const [selectedRole, setSelectedRole] = useState(
    ROLE_CONFIGS[initialRole] ? initialRole : 'college'
  );

  const currentConfig = ROLE_CONFIGS[selectedRole];

  // Colleges list for multi-tenant student selection
  const [colleges, setColleges] = useState([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState('mitc');
  const [studentAuthMode, setStudentAuthMode] = useState('signin'); // 'signin' | 'register'

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load all registered colleges on mount & subscribe to new colleges added by Admin
  useEffect(() => {
    async function loadColleges() {
      try {
        const list = await collegeService.getColleges();
        if (list && list.length > 0) {
          setColleges(list);
          setSelectedCollegeId((prev) => prev || list[0].id || list[0].code || 'mitc');
        }
      } catch (err) {
        console.warn('Failed to load colleges in Login:', err);
      }
    }
    loadColleges();

    const handleCollegeEvent = () => {
      collegeService.getColleges().then((list) => {
        if (list && list.length > 0) setColleges(list);
      });
    };
    window.addEventListener('cardcraft:college_change', handleCollegeEvent);

    let bc = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        bc = new BroadcastChannel('cardcraft_realtime');
        bc.onmessage = (e) => {
          if (
            e.data?.type === 'COLLEGE_CREATED' ||
            e.data?.type === 'COLLEGE_UPDATED' ||
            e.data?.type === 'COLLEGE_DELETED'
          ) {
            handleCollegeEvent();
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error in Login:', e);
    }

    return () => {
      window.removeEventListener('cardcraft:college_change', handleCollegeEvent);
      if (bc) bc.close();
    };
  }, []);

  const selectedCollege = useMemo(() => {
    if (!colleges || colleges.length === 0) {
      return { id: 'mitc', name: 'MIT College of Technology', code: 'MITC' };
    }
    return (
      colleges.find(
        (c) =>
          c.id === selectedCollegeId ||
          c.code?.toLowerCase() === selectedCollegeId?.toLowerCase()
      ) || colleges[0]
    );
  }, [colleges, selectedCollegeId]);

  const studentDemoEmail = useMemo(() => {
    const code = (selectedCollege?.code || 'mitc').toLowerCase();
    if (code === 'mitc') return 'student@mitc.com';
    if (code === 'ait') return 'student@ait.com';
    if (code === 'sec') return 'student@sec.com';
    return `student@${code}.edu`;
  }, [selectedCollege]);

  // When tab changes, pre-populate demo hints and reset errors
  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setSearchParams({ role: roleKey });
    setError('');
    setEmail('');
    setPassword('');
    setFullName('');
    setRollNo('');
    setConfirmPassword('');
  };

  const handleFillDemo = () => {
    if (selectedRole === 'student') {
      setEmail(studentDemoEmail);
      setPassword('Student@123');
      setStudentAuthMode('signin');
    } else {
      setEmail(currentConfig.demoEmail);
      setPassword(currentConfig.demoPassword);
    }
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

      if (selectedRole === 'student') {
        if (!selectedCollege) {
          throw new Error('Please select your college / institution from the dropdown.');
        }

        if (studentAuthMode === 'register') {
          if (!fullName.trim()) {
            throw new Error('Please enter your full student name.');
          }
          if (password !== confirmPassword) {
            throw new Error('Passwords do not match.');
          }
          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters.');
          }

          await registerStudent({
            fullName: fullName.trim(),
            rollNo:
              rollNo.trim() ||
              `${selectedCollege.code || 'COL'}-2024-${Math.floor(100 + Math.random() * 900)}`,
            email: email.trim(),
            password,
            college: selectedCollege,
          });

          navigate('/student', { replace: true });
          return;
        } else {
          // Sign In
          const authenticatedUser = await login(email, password, 'student', selectedCollege);
          navigate('/student', { replace: true });
          return;
        }
      }

      // College / Admin login
      const authenticatedUser = await login(email, password, selectedRole);

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

          {/* College-Specific: Quick Institution Switcher */}
          {selectedRole === 'college' && (
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <span>🏛️</span>
                  <span>Select Registered College for Presentation:</span>
                </span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  1-Click Select
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {colleges.map((c) => {
                  const targetEmail = (c.adminEmail || `college@${c.code?.toLowerCase()}.com`).toLowerCase();
                  const isSelected = email.toLowerCase() === targetEmail;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setEmail(targetEmail);
                        setPassword(c.adminPassword || 'College@123');
                        setError('');
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {c.name} ({c.code})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Student-Specific: Select College / Institution & Mode Switch */}
          {selectedRole === 'student' && (
            <div className="space-y-4 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
              <div>
                <label
                  htmlFor="college-select"
                  className="block text-xs font-bold uppercase tracking-wider text-emerald-950 mb-1.5 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🏛️</span>
                    <span>Select Your College / Institution *</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Multi-Tenant Routing
                  </span>
                </label>
                <select
                  id="college-select"
                  value={selectedCollegeId}
                  onChange={(e) => {
                    setSelectedCollegeId(e.target.value);
                    setError('');
                  }}
                  className="w-full text-sm font-semibold px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs text-gray-900 cursor-pointer"
                >
                  {colleges.map((col) => (
                    <option key={col.id} value={col.id} disabled={col.status === 'suspended'}>
                      {col.name} ({col.code || 'COL'}) {col.status === 'suspended' ? '— [Suspended]' : ''}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between mt-2 text-[11px] text-emerald-800">
                  <span className="flex items-center gap-1 font-medium">
                    <span>✓</span> Card & data routed to: <strong>{selectedCollege.name}</strong>
                  </span>
                  <span className="font-mono text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                    {selectedCollege.code}
                  </span>
                </div>
              </div>

              {/* Sub-Switch: Sign In vs New Student Registration */}
              <div className="grid grid-cols-2 gap-2 bg-emerald-100/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setStudentAuthMode('signin');
                    setError('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    studentAuthMode === 'signin'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-emerald-900/80 hover:text-emerald-950'
                  }`}
                >
                  🔑 Student Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudentAuthMode('register');
                    setError('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    studentAuthMode === 'register'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-emerald-900/80 hover:text-emerald-950'
                  }`}
                >
                  📝 New Student Register
                </button>
              </div>
            </div>
          )}

          {/* Controlled Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedRole === 'student' && studentAuthMode === 'register' && (
              <>
                <Input
                  label="Full Student Name *"
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
                <Input
                  label={`Roll Number / Student ID (Optional)`}
                  id="rollNo"
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder={`e.g. ${selectedCollege.code || 'COL'}-2024-001`}
                />
              </>
            )}

            <Input
              label={
                selectedRole === 'student'
                  ? studentAuthMode === 'register'
                    ? 'Student Email Address *'
                    : `Student Email or Roll Number * (${selectedCollege.code})`
                  : `${currentConfig.badgeText} Email *`
              }
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                selectedRole === 'student'
                  ? `e.g. ${studentDemoEmail}`
                  : `e.g. ${currentConfig.demoEmail}`
              }
              required
            />

            <Input
              label="Password *"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {selectedRole === 'student' && studentAuthMode === 'register' && (
              <Input
                label="Confirm Password *"
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className={`w-full py-2.5 text-white ${currentConfig.buttonBg}`}
              disabled={loading}
            >
              {loading
                ? 'Processing...'
                : selectedRole === 'student'
                ? studentAuthMode === 'register'
                  ? `Register & Apply for ${selectedCollege.code} ID Card →`
                  : `Sign In to ${selectedCollege.code} Student Portal →`
                : `Sign In to ${currentConfig.badgeText} Portal`}
            </Button>
          </form>

          {/* One-Click Demo Helper For Selected Role */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-gray-800 block">
                Testing{' '}
                {selectedRole === 'student'
                  ? `${selectedCollege.code} Student`
                  : currentConfig.badgeText}{' '}
                portal?
              </span>
              <span className="text-[11px] text-gray-500 font-mono">
                {selectedRole === 'student' ? studentDemoEmail : currentConfig.demoEmail} •{' '}
                {selectedRole === 'student' ? 'Student@123' : currentConfig.demoPassword}
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
