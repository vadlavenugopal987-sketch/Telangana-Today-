import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '@tanstack/react-router';
import { Breadcrumbs } from './Breadcrumbs';
import { Button } from '../ui';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { logout } = useAuth();
  const location = useLocation();

  // Generate breadcrumb items from current path
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) {
      return [{ label: 'Dashboard', active: true }];
    }
    return paths.map((path, index) => {
      const isLast = index === paths.length - 1;
      const formatted = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
      return {
        label: formatted,
        active: isLast,
      };
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-950 flex items-center justify-between px-6 shrink-0 transition-colors duration-150">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden text-slate-700 hover:text-slate-950 p-1 border border-transparent hover:border-slate-950 rounded-lg cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        {/* Breadcrumbs */}
        <Breadcrumbs items={getBreadcrumbs()} />
      </div>

      <div className="flex items-center gap-3">
        {/* Logout button */}
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          icon={LogOut}
          className="hover:bg-rose-50 hover:text-rose-700 hover:border-rose-950"
        >
          <span>Sign Out</span>
        </Button>
      </div>
    </header>
  );
};
