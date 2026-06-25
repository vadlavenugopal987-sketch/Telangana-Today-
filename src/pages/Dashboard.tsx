import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { Card, Badge, cn } from '../components/ui';
import { 
  Users, 
  Megaphone, 
  IndianRupee, 
  TrendingUp, 
  AlertTriangle,
  Clock, 
  ShieldAlert,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';

export const Dashboard: React.FC = () => {
  // Query DB state
  const { data: advertisers = [], isLoading: loadingAdv } = useQuery({
    queryKey: ['advertisers'],
    queryFn: () => dbService.getAdvertisers(),
  });

  const { data: campaigns = [], isLoading: loadingCamp } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => dbService.getCampaigns(),
  });

  const { data: invoices = [], isLoading: loadingInvs } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => dbService.getInvoices(),
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ['activity_logs'],
    queryFn: () => dbService.getLogs(),
  });

  const isLoading = loadingAdv || loadingCamp || loadingInvs || loadingLogs;

  // --- STATS CALCULATIONS ---
  const totalAdvertisers = advertisers.length;
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;

  // Revenue sums
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalReceived = invoices.reduce((sum, inv) => {
    const paid = (inv.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
    return sum + paid;
  }, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.outstanding || 0), 0);

  // Expiry / Renewals check (within 30 days)
  const upcomingRenewalsList = campaigns
    .filter(c => {
      if (c.status !== 'Active') return false;
      const end = new Date(c.end_date);
      const diffTime = end.getTime() - Date.now();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    })
    .map(c => {
      const diffDays = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      let color: 'green' | 'yellow' | 'orange' | 'red' = 'green';
      let badgeType: 'success' | 'warning' | 'error' = 'success';
      if (diffDays <= 7) {
        color = 'orange';
        badgeType = 'warning';
      } else if (diffDays <= 15) {
        color = 'yellow';
        badgeType = 'warning';
      }
      return { ...c, diffDays, color, badgeType };
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  const upcomingRenewalsCount = upcomingRenewalsList.length;

  // Overdue Invoices check
  const overdueInvoices = invoices.filter(inv => {
    if (inv.payment_status === 'Paid') return false;
    return new Date(inv.due_date).getTime() < Date.now();
  });

  // --- CHART 1: MONTHLY REVENUE TREND ---
  // Group invoices by month
  const monthlyRevenueData = React.useMemo(() => {
    const months: Record<string, { month: string; billing: number; received: number }> = {};
    invoices.forEach(inv => {
      const d = new Date(inv.created_at || Date.now());
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const paid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
      
      if (!months[key]) {
        months[key] = { month: key, billing: 0, received: 0 };
      }
      months[key].billing += inv.total_amount;
      months[key].received += paid;
    });
    return Object.values(months).slice(-6); // Last 6 months
  }, [invoices]);

  // --- CHART 2: CAMPAIGN STATUS DISTRIBUTION ---
  const campaignStatusData = React.useMemo(() => {
    const counts: Record<string, number> = { Active: 0, Scheduled: 0, Completed: 0, Expired: 0 };
    campaigns.forEach(c => {
      if (counts[c.status] !== undefined) {
        counts[c.status]++;
      }
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [campaigns]);

  const COLORS = ['#6366f1', '#fbbf24', '#10b981', '#f43f5e'];

  // --- CHART 3: PAYMENT STATUS DISTRIBUTION ---
  const paymentStatusData = React.useMemo(() => {
    const counts: Record<string, number> = { Paid: 0, Pending: 0, Overdue: 0, Partial: 0 };
    invoices.forEach(i => {
      if (counts[i.payment_status] !== undefined) {
        counts[i.payment_status]++;
      }
    });
    return Object.keys(counts).map(key => ({ name: key, count: counts[key] }));
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200  rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200  rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 lg:col-span-2 bg-slate-200  rounded-2xl animate-pulse" />
          <div className="h-96 bg-slate-200  rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900  tracking-tight">
          Dashboard Overview
        </h2>
        <p className="text-sm text-slate-500  mt-1">
          Monitor your advertising campaigns, invoicing metrics, and pending renewals.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card interactive>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500  uppercase tracking-wider">Total Advertisers</p>
              <h3 className="text-2xl font-black mt-2 text-slate-900 ">{totalAdvertisers}</h3>
            </div>
            <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <Users className="w-5.5 h-5.5" />
            </div>
          </div>
        </Card>

        <Card interactive>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500  uppercase tracking-wider">Active Campaigns</p>
              <h3 className="text-2xl font-black mt-2 text-slate-900 ">
                {activeCampaigns} <span className="text-xs font-normal text-slate-400">/ {totalCampaigns} total</span>
              </h3>
            </div>
            <div className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl">
              <Megaphone className="w-5.5 h-5.5" />
            </div>
          </div>
        </Card>

        <Card interactive>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500  uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-black mt-2 text-indigo-600 ">
                ₹{totalReceived.toLocaleString()}
                <span className="text-xs font-normal text-slate-400 block mt-0.5">Billed: ₹{totalRevenue.toLocaleString()}</span>
              </h3>
            </div>
            <div className="p-3.5 bg-indigo-500/10 text-indigo-500 rounded-2xl">
              <IndianRupee className="w-5.5 h-5.5" />
            </div>
          </div>
        </Card>

        <Card interactive>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500  uppercase tracking-wider">Outstanding Balance</p>
              <h3 className="text-2xl font-black mt-2 text-rose-600 ">
                ₹{totalOutstanding.toLocaleString()}
              </h3>
            </div>
            <div className="p-3.5 bg-rose-500/10 text-rose-500 rounded-2xl">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Renewals / Overdue Alerts Banners */}
      {(upcomingRenewalsCount > 0 || overdueInvoices.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Renewals Alerts */}
          {upcomingRenewalsCount > 0 && (
            <Card className="border-amber-250 bg-amber-500/5   p-5">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h4 className="text-sm font-bold text-amber-800 ">
                    Campaign Renewals Pending ({upcomingRenewalsCount})
                  </h4>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-2">
                    {upcomingRenewalsList.map(camp => (
                      <div key={camp.id} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700  truncate max-w-[200px]">
                          {camp.campaign_name}
                        </span>
                        <Badge variant={camp.badgeType}>{camp.diffDays} Days Left</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Overdue Alerts */}
          {overdueInvoices.length > 0 && (
            <Card className="border-rose-250 bg-rose-500/5   p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h4 className="text-sm font-bold text-rose-800 ">
                    Overdue Invoices Outstanding ({overdueInvoices.length})
                  </h4>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-2">
                    {overdueInvoices.map(inv => (
                      <div key={inv.id} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 ">
                          {inv.invoice_number} ({inv.advertiser?.company_name})
                        </span>
                        <span className="font-bold text-rose-600 ">₹{inv.outstanding?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-slate-900 ">Revenue Trend (Last 6 Months)</h4>
            <span className="text-xs font-semibold text-slate-400">Total Billed vs Collected</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" name="Billed Billing" dataKey="billing" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBilled)" />
                <Area type="monotone" name="Received Income" dataKey="received" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceived)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Campaign Status Breakdown */}
        <Card>
          <h4 className="text-base font-bold text-slate-900  mb-4">Campaign Status Allocation</h4>
          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={campaignStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {campaignStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Summary count */}
            <div className="absolute text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
              <p className="text-2xl font-black text-slate-850 ">{totalCampaigns}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            {campaignStatusData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5 font-semibold text-slate-650 ">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 3: Payment Status Chart & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Invoices Chart */}
        <Card>
          <h4 className="text-base font-bold text-slate-900  mb-4">Invoice Payment Status</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentStatusData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                  {paymentStatusData.map((entry, index) => {
                    const statusColors: Record<string, string> = {
                      Paid: '#10b981',
                      Pending: '#f59e0b',
                      Overdue: '#f43f5e',
                      Partial: '#6366f1'
                    };
                    return <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#6366f1'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-slate-900 ">Recent System Logs</h4>
            <span className="text-xs font-semibold text-slate-400">Audit trail</span>
          </div>
          <div className="overflow-y-auto max-h-72 space-y-3.5 pr-2">
            {logs.length === 0 ? (
              <p className="text-sm text-slate-500  py-6 text-center">No recent activities logged.</p>
            ) : (
              logs.slice(0, 5).map(log => (
                <div key={log.id} className="flex justify-between items-start gap-4 p-3 rounded-xl bg-slate-50  border border-slate-200/50  text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 ">{log.action}</p>
                    <div className="flex gap-2 items-center text-slate-400 font-medium">
                      <span>By: {log.user_name}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>Module: {log.module}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};
