import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Badge, useToast } from '../components/ui';
import { User, Shield, Info, RotateCcw, Database } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, isDemo } = useAuth();
  const { success } = useToast();

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to clear current edits and reload the default coursework mock datasets?')) {
      localStorage.clear();
      success('Database Reinitialized', 'Loaded base project records. Refreshing page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl">
      
      {/* Header */}
      <div>
        <h2 className="text-xl lg:text-2xl font-black text-slate-950 tracking-tight">
          System Settings
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Review your access permissions, database settings, and system backup tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* User Card */}
        <Card className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
            <div className="w-12 h-12 bg-slate-950 text-white flex items-center justify-center font-bold text-base rounded-lg">
              {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-950">{user?.full_name}</h3>
              <p className="text-xs text-slate-450 font-bold mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs font-bold text-slate-600">
            <div className="flex justify-between items-center py-1">
              <span className="flex items-center gap-2"><User className="w-4 h-4 text-slate-500" /> Account Role</span>
              <Badge variant="info">{user?.role}</Badge>
            </div>
            
            <div className="flex justify-between items-center py-2.5 border-t border-slate-100">
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-slate-500" /> Action Scope</span>
              <span className="text-slate-800 font-semibold">
                {user?.role === 'Admin' ? 'Full Administrator Permissions (Delete allowed)' :
                 user?.role === 'Manager' ? 'Add & Edit Advertisers / Campaigns' :
                 'Record Payment Transactions & View Pages'}
              </span>
            </div>
          </div>
        </Card>

        {/* Database Status Card */}
        <Card className="flex flex-col justify-between">
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-950 flex items-center gap-2 uppercase tracking-wide">
              <Database className="w-4.5 h-4.5 text-slate-900" />
              Database Config
            </h4>
            
            {isDemo ? (
              <div className="p-3 bg-slate-50 border border-slate-950 text-slate-850 rounded-lg text-xs space-y-1">
                <p className="font-bold">Local Connection Mode</p>
                <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                  Using local storage cache fallback. Any changes made are stored locally in your browser.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-950 text-slate-850 rounded-lg text-xs space-y-1">
                <p className="font-bold">Supabase Sync Online</p>
                <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
                  Active connection to cloud database server. Row Level Security policies active.
                </p>
              </div>
            )}
          </div>

          {isDemo && (
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={handleResetData}
              className="mt-4 w-full"
            >
              Reset Data Defaults
            </Button>
          )}
        </Card>
      </div>

      {/* Guide Info */}
      <Card className="p-5 border-slate-950 bg-slate-50 text-xs">
        <h4 className="font-bold text-slate-950 flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-slate-950" />
          Course Project Guidelines
        </h4>
        <div className="space-y-2 text-slate-500 font-semibold leading-relaxed">
          <p>
            This billing system restricts dashboard write/delete commands dynamically based on the current user's role.
            Admins have delete permissions, managers can add and update campaign files, and staff accounts can review invoice indices and record payment transactions.
          </p>
          <p>
            To link this coursework repo to a live Supabase backend:
            Import the database tables via the <strong>schema.sql</strong> script in your Supabase project dashboard.
            Add the <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> configs to your system environment variables.
          </p>
        </div>
      </Card>
    </div>
  );
};
