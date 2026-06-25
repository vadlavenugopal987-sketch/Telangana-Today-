import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { 
  LayoutDashboard, 
  Building2, 
  Megaphone, 
  Receipt, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Database
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../ui';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onClose }) => {
  const { user, isDemo } = useAuth();
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Advertisers', to: '/advertisers', icon: Building2 },
    { label: 'Campaigns', to: '/campaigns', icon: Megaphone },
    { label: 'Billing / Invoices', to: '/invoices', icon: Receipt },
    { label: 'Payments', to: '/payments', icon: CreditCard },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className={cn(
      "w-64 bg-white text-slate-800 flex flex-col border-r border-slate-950 shrink-0 h-screen overflow-y-auto",
      className
    )}>
      {/* Header Brand */}
      <div className="h-16 flex items-center px-6 gap-2.5 border-b border-slate-950 shrink-0">
        <div className="w-8 h-8 bg-slate-950 flex items-center justify-center text-white font-black text-base rounded-md">
          T
        </div>
        <div className="text-left">
          <h1 className="font-extrabold text-sm text-slate-950 tracking-tight uppercase">Telangana Today</h1>
          <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">System Management</p>
        </div>
      </div>

      {/* User Status Capsule */}
      <div className="p-4 mx-3 my-4 rounded-lg bg-slate-50 border border-slate-950 flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-950 text-white flex items-center justify-center font-bold text-xs rounded-md">
          {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
          <span className="inline-flex mt-0.5 items-center px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-200 text-slate-800 border border-slate-950 uppercase tracking-wide">
            {user?.role || 'Staff'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                isActive 
                  ? "bg-slate-950 text-white border-slate-950" 
                  : "text-slate-600 border-transparent hover:text-slate-950 hover:bg-slate-100"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Status indicator footer */}
      <div className="p-4 border-t border-slate-200 mt-auto">
        <div className="flex gap-2 p-3 bg-slate-50 border border-slate-950 rounded-lg text-slate-700 text-[10px] items-start text-left">
          <Database className="w-4 h-4 shrink-0 mt-0.5 text-slate-900" />
          <div>
            <p className="font-bold text-slate-950">System Mode</p>
            <p className="text-[9px] font-medium text-slate-500 mt-0.5">
              {isDemo ? 'Local Storage DB Active' : 'Supabase Synced (Online)'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
