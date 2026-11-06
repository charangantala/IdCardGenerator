import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      // Redirect by role according to Section 4 & 8.1
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

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');

    try {
      setLoading(true);
      const authenticatedUser = await login(demoEmail, demoPassword);
      if (authenticatedUser.role === 'admin') navigate('/admin');
      else if (authenticatedUser.role === 'college') navigate('/college');
      else if (authenticatedUser.role === 'student') navigate('/student');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full space-y-6">
        {/* Header Monogram */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center text-xl font-extrabold shadow-md mb-3 tracking-wider">
            ID
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Sign In to CardCraft
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Multi-Tenant Digital ID Card System for Colleges & Students
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-start space-x-2">
            <span className="text-sm font-bold flex-shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. admin@demo.com"
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
            className="w-full py-2.5"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        {/* Quick Demo Logins according to Section 16 */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-[11px] font-bold uppercase text-gray-400 text-center tracking-wider mb-2">
            One-Click Demo Personas (Seed Data)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@demo.com', 'Admin@123')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors"
            >
              <div className="font-bold text-gray-800">Admin</div>
              <div className="text-[10px] text-gray-400">admin@demo.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('college@mitc.com', 'College@123')}
              className="p-2 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-lg text-left transition-colors"
            >
              <div className="font-bold text-blue-900">College (MITC)</div>
              <div className="text-[10px] text-blue-500">college@mitc.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('student@mitc.com', 'Student@123')}
              className="p-2 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-lg text-left transition-colors"
            >
              <div className="font-bold text-emerald-900">Student</div>
              <div className="text-[10px] text-emerald-600">student@mitc.com</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('college@suspended.com', 'Suspended@123')}
              className="p-2 bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200 rounded-lg text-left transition-colors"
            >
              <div className="font-bold text-rose-800">Suspended Test</div>
              <div className="text-[10px] text-rose-500">college@suspended.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
