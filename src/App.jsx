import React from 'react';
import Navbar from './components/common/Navbar';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
      </div>
    </AuthProvider>
  );
}

