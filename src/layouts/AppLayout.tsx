import React, { useState } from 'react';
import { Outlet } from '@tanstack/react-router';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { Auth } from '../pages/Auth';
import { X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 1. Session check loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50  flex flex-col justify-center items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500  font-semibold text-sm animate-pulse">
          Loading Telangana Today...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated: Mount Login/Registration Page
  if (!user) {
    return <Auth />;
  }

  // 3. Authenticated: Render dashboard shell
  return (
    <div className="min-h-screen bg-slate-50  flex text-slate-800  transition-colors duration-200">
      
      {/* Desktop Sidebar (Permanent) */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Sidebar (Drawer) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Sidebar Drawer container */}
          <div className="relative flex animate-in slide-in-from-left duration-200">
            <Sidebar onClose={() => setMobileSidebarOpen(false)} />
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-[-45px] text-white p-1.5 hover:bg-white/10 rounded-lg cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar onMenuToggle={() => setMobileSidebarOpen(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
