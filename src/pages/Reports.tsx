import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { Card, Button, Input, Select, Table, Badge } from '../components/ui';
import { FileDown, Calendar, Search, ArrowUpRight, DownloadCloud } from 'lucide-react';
import { CampaignWithAdvertiser, InvoiceWithDetails, Payment, Advertiser } from '../types';

type ReportType = 'revenue' | 'campaign' | 'advertiser' | 'payment' | 'outstanding' | 'renewal';
type DateFilter = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [dateFilter, setDateFilter] = useState<DateFilter>('monthly');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Queries
  const { data: advertisers = [] } = useQuery({ queryKey: ['advertisers'], queryFn: () => dbService.getAdvertisers() });
  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: () => dbService.getCampaigns() });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: () => dbService.getInvoices() });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => dbService.getPayments() });

  // Date Range calculation based on selected filters
  const getFilterBoundaries = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (dateFilter) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start.setDate(now.getDate() - 30);
        break;
      case 'yearly':
        start.setDate(now.getDate() - 365);
        break;
      case 'custom':
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        break;
    }
    return { start, end };
  };

  const { start, end } = getFilterBoundaries();

  // Helper to check if a date falls in range
  const isInRange = (dateStr: string) => {
    const d = new Date(dateStr);
    if (dateFilter === 'daily') {
      return d.toDateString() === new Date().toDateString();
    }
    if (dateFilter === 'custom') {
      return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
    }
    return d.getTime() >= start.getTime();
  };

  // --- REPORT GENERATION LOGIC ---

  // 1. Revenue Report
  const revenueReportData = React.useMemo(() => {
    return invoices.filter(inv => isInRange(inv.created_at || ''));
  }, [invoices, dateFilter, startDate, endDate]);

  // 2. Campaign Report
  const campaignReportData = React.useMemo(() => {
    return campaigns.filter(c => isInRange(c.created_at || ''));
  }, [campaigns, dateFilter, startDate, endDate]);

  // 3. Advertiser Report
  const advertiserReportData = React.useMemo(() => {
    return advertisers.filter(a => isInRange(a.created_at || ''));
  }, [advertisers, dateFilter, startDate, endDate]);

  // 4. Payment Report
  const paymentReportData = React.useMemo(() => {
    return payments.filter(p => isInRange(p.payment_date));
  }, [payments, dateFilter, startDate, endDate]);

  // 5. Outstanding Report
  const outstandingReportData = React.useMemo(() => {
    return invoices.filter(inv => inv.payment_status !== 'Paid' && isInRange(inv.created_at || ''));
  }, [invoices, dateFilter, startDate, endDate]);

  // 6. Renewal Report (only campaigns expiring within 30 days)
  const renewalReportData = React.useMemo(() => {
    return campaigns
      .filter(c => {
        if (c.status !== 'Active') return false;
        const endDay = new Date(c.end_date);
        const diff = endDay.getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 30; // Expiring soon
      })
      .map(c => {
        const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return { ...c, daysRemaining: days };
      });
  }, [campaigns]);

  // --- SUMMARIES ---
  const reportTotals = React.useMemo(() => {
    let billed = 0;
    let collected = 0;
    let outstanding = 0;
    let count = 0;

    if (reportType === 'revenue') {
      count = revenueReportData.length;
      revenueReportData.forEach(inv => {
        billed += inv.total_amount;
        const paid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
        collected += paid;
        outstanding += inv.outstanding || 0;
      });
    } else if (reportType === 'outstanding') {
      count = outstandingReportData.length;
      outstandingReportData.forEach(inv => {
        billed += inv.total_amount;
        const paid = (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
        collected += paid;
        outstanding += inv.outstanding || 0;
      });
    } else if (reportType === 'payment') {
      count = paymentReportData.length;
      paymentReportData.forEach(p => {
        collected += p.amount;
      });
    } else if (reportType === 'campaign') {
      count = campaignReportData.length;
      campaignReportData.forEach(c => {
        billed += c.billing_amount;
      });
    } else if (reportType === 'advertiser') {
      count = advertiserReportData.length;
    } else if (reportType === 'renewal') {
      count = renewalReportData.length;
      renewalReportData.forEach(c => {
        billed += c.billing_amount;
      });
    }

    return { billed, collected, outstanding, count };
  }, [
    reportType, 
    revenueReportData, 
    outstandingReportData, 
    paymentReportData, 
    campaignReportData, 
    advertiserReportData, 
    renewalReportData
  ]);

  // --- CSV CLIENT EXPORT HANDLER ---
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `TelanganaToday_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    switch (reportType) {
      case 'revenue':
        headers = ['Invoice Number', 'Company Name', 'Campaign Name', 'Base Amount', 'GST Surcharge', 'Total Billed', 'Paid Amount', 'Outstanding Due', 'Payment Status', 'Created At'];
        rows = revenueReportData.map(inv => [
          inv.invoice_number,
          inv.advertiser?.company_name || 'N/A',
          inv.campaign?.campaign_name || 'N/A',
          inv.amount.toString(),
          inv.gst.toString(),
          inv.total_amount.toString(),
          ((inv.total_amount - (inv.outstanding || 0))).toString(),
          (inv.outstanding || 0).toString(),
          inv.payment_status,
          inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A'
        ]);
        break;

      case 'campaign':
        headers = ['Campaign Name', 'Company Name', 'Ad Medium', 'Start Date', 'End Date', 'Insertions', 'Billing Amount', 'Status'];
        rows = campaignReportData.map(c => [
          c.campaign_name,
          c.advertiser?.company_name || 'N/A',
          c.ad_type,
          c.start_date,
          c.end_date,
          c.insertions.toString(),
          c.billing_amount.toString(),
          c.status
        ]);
        break;

      case 'advertiser':
        headers = ['Company Name', 'Contact Representative', 'Email Address', 'Phone Number', 'Tax GST No', 'Status', 'Registered Date'];
        rows = advertiserReportData.map(a => [
          a.company_name,
          a.contact_person,
          a.email,
          a.phone,
          a.gst_number || 'N/A',
          a.status,
          a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'
        ]);
        break;

      case 'payment':
        headers = ['Payment Date', 'Payment reference ID', 'Invoice reference #', 'Gateway Method', 'Reference Code', 'Amount Collected'];
        rows = paymentReportData.map(p => {
          const invNum = invoices.find(i => i.id === p.invoice_id)?.invoice_number || 'N/A';
          return [
            p.payment_date,
            p.id,
            invNum,
            p.payment_method,
            p.reference_number,
            p.amount.toString()
          ];
        });
        break;

      case 'outstanding':
        headers = ['Invoice Number', 'Company Name', 'Campaign Name', 'Due Date', 'Total Invoice Amount', 'Amount Received', 'Outstanding Due', 'Billing Status'];
        rows = outstandingReportData.map(inv => [
          inv.invoice_number,
          inv.advertiser?.company_name || 'N/A',
          inv.campaign?.campaign_name || 'N/A',
          inv.due_date,
          inv.total_amount.toString(),
          (inv.total_amount - (inv.outstanding || 0)).toString(),
          (inv.outstanding || 0).toString(),
          inv.payment_status
        ]);
        break;

      case 'renewal':
        headers = ['Campaign Name', 'Company Name', 'End Schedule Date', 'Days Remaining', 'Billing Amount', 'Type'];
        rows = renewalReportData.map(c => [
          c.campaign_name,
          c.advertiser?.company_name || 'N/A',
          c.end_date,
          c.daysRemaining.toString(),
          c.billing_amount.toString(),
          c.ad_type
        ]);
        break;
    }

    // Compose CSV string contents
    const csvContent = 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');

    // Create download element
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900  tracking-tight">
            Reports Dashboard
          </h2>
          <p className="text-sm text-slate-500  mt-1">
            Perform filters across datasets and export CSV audit logs.
          </p>
        </div>
        <Button onClick={handleExportCSV} icon={FileDown}>
          Export CSV Report
        </Button>
      </div>

      {/* Configurations panel */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Report Template</label>
          <Select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            options={[
              { value: 'revenue', label: 'Revenue Report' },
              { value: 'campaign', label: 'Campaign Listings' },
              { value: 'advertiser', label: 'Advertiser Files' },
              { value: 'payment', label: 'Collection History' },
              { value: 'outstanding', label: 'Outstanding Balance' },
              { value: 'renewal', label: 'Upcoming Renewals' }
            ]}
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Date Filters</label>
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            options={[
              { value: 'daily', label: 'Daily (Today)' },
              { value: 'weekly', label: 'Weekly (7 Days)' },
              { value: 'monthly', label: 'Monthly (30 Days)' },
              { value: 'yearly', label: 'Yearly (365 Days)' },
              { value: 'custom', label: 'Custom Date Range' }
            ]}
          />
        </div>

        {dateFilter === 'custom' && (
          <>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}
      </Card>

      {/* Summary totals widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-4 bg-slate-50  border border-slate-200/50 ">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Record Count</span>
          <span className="text-xl font-black text-slate-850  block mt-1.5">{reportTotals.count} items</span>
        </Card>
        
        {reportType !== 'advertiser' && reportType !== 'payment' && (
          <Card className="p-4 bg-slate-50  border border-slate-200/50 ">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Billed</span>
            <span className="text-xl font-black text-slate-850  block mt-1.5">₹{reportTotals.billed.toLocaleString()}</span>
          </Card>
        )}

        {(reportType === 'revenue' || reportType === 'outstanding' || reportType === 'payment') && (
          <>
            <Card className="p-4 bg-slate-50  border border-slate-200/50 ">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Collected Cash</span>
              <span className="text-xl font-black text-emerald-600  block mt-1.5">₹{reportTotals.collected.toLocaleString()}</span>
            </Card>
            <Card className="p-4 bg-slate-50  border border-slate-200/50 ">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Outstanding Due</span>
              <span className="text-xl font-black text-rose-600  block mt-1.5">₹{reportTotals.outstanding.toLocaleString()}</span>
            </Card>
          </>
        )}
      </div>

      {/* Report Table Display */}

      {/* A. REVENUE REPORT */}
      {reportType === 'revenue' && (
        <Table headers={['Invoice', 'Client', 'Campaign', 'Billed Subtotal', 'GST', 'Total Billed', 'Status']}>
          {revenueReportData.map(inv => (
            <tr key={inv.id} className="border-b border-slate-100  text-xs hover:bg-slate-50/50 ">
              <td className="px-6 py-4.5 font-bold font-mono">{inv.invoice_number}</td>
              <td className="px-6 py-4.5 font-semibold">{inv.advertiser?.company_name}</td>
              <td className="px-6 py-4.5 text-slate-500">{inv.campaign?.campaign_name}</td>
              <td className="px-6 py-4.5">₹{inv.amount.toLocaleString()}</td>
              <td className="px-6 py-4.5">₹{inv.gst.toLocaleString()}</td>
              <td className="px-6 py-4.5 font-bold">₹{inv.total_amount.toLocaleString()}</td>
              <td className="px-6 py-4.5">
                <Badge variant={inv.payment_status === 'Paid' ? 'success' : inv.payment_status === 'Overdue' ? 'error' : 'warning'}>
                  {inv.payment_status}
                </Badge>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* B. CAMPAIGN LIST */}
      {reportType === 'campaign' && (
        <Table headers={['Campaign Name', 'Client / Client ID', 'Medium Type', 'Timeline Bounds', 'Insertions', 'Billing Amount', 'Status']}>
          {campaignReportData.map(c => (
            <tr key={c.id} className="border-b border-slate-100  text-xs hover:bg-slate-50/50 ">
              <td className="px-6 py-4.5 font-bold">{c.campaign_name}</td>
              <td className="px-6 py-4.5 font-semibold">{c.advertiser?.company_name}</td>
              <td className="px-6 py-4.5">{c.ad_type}</td>
              <td className="px-6 py-4.5 font-medium text-slate-500">{c.start_date} to {c.end_date}</td>
              <td className="px-6 py-4.5 font-mono">{c.insertions} times</td>
              <td className="px-6 py-4.5 font-bold">₹{c.billing_amount.toLocaleString()}</td>
              <td className="px-6 py-4.5">
                <Badge variant={c.status === 'Active' ? 'info' : c.status === 'Completed' ? 'success' : 'neutral'}>
                  {c.status}
                </Badge>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* C. ADVERTISER REPORT */}
      {reportType === 'advertiser' && (
        <Table headers={['Company Name', 'Contact Person', 'Email Address', 'Phone Number', 'GSTIN', 'Status']}>
          {advertiserReportData.map(a => (
            <tr key={a.id} className="border-b border-slate-100  text-xs hover:bg-slate-50/50 ">
              <td className="px-6 py-4.5 font-bold">{a.company_name}</td>
              <td className="px-6 py-4.5">{a.contact_person}</td>
              <td className="px-6 py-4.5 font-mono text-slate-500">{a.email}</td>
              <td className="px-6 py-4.5 font-mono text-slate-500">{a.phone}</td>
              <td className="px-6 py-4.5 font-mono">{a.gst_number || 'N/A'}</td>
              <td className="px-6 py-4.5">
                <Badge variant={a.status === 'Active' ? 'success' : 'neutral'}>
                  {a.status}
                </Badge>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* D. COLLECTION LOGS */}
      {reportType === 'payment' && (
        <Table headers={['Payment Date', 'Payment Reference', 'Invoice Code', 'Method', 'Transaction Code', 'Amount Collected']}>
          {paymentReportData.map(p => {
            const invoiceNum = invoices.find(inv => inv.id === p.invoice_id)?.invoice_number || 'N/A';
            return (
              <tr key={p.id} className="border-b border-slate-100  text-xs hover:bg-slate-50/50 ">
                <td className="px-6 py-4.5">{p.payment_date}</td>
                <td className="px-6 py-4.5 font-mono">{p.id}</td>
                <td className="px-6 py-4.5 font-bold font-mono">{invoiceNum}</td>
                <td className="px-6 py-4.5 font-semibold">{p.payment_method}</td>
                <td className="px-6 py-4.5 font-mono text-slate-500">{p.reference_number}</td>
                <td className="px-6 py-4.5 font-bold text-emerald-600 ">+₹{p.amount.toLocaleString()}</td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* E. OUTSTANDING REPORT */}
      {reportType === 'outstanding' && (
        <Table headers={['Invoice', 'Client', 'Campaign', 'Due Date', 'Total Amount', 'Collected', 'Remaining Due', 'Status']}>
          {outstandingReportData.map(inv => (
            <tr key={inv.id} className="border-b border-slate-100  text-xs hover:bg-slate-50/50 ">
              <td className="px-6 py-4.5 font-bold font-mono">{inv.invoice_number}</td>
              <td className="px-6 py-4.5 font-semibold">{inv.advertiser?.company_name}</td>
              <td className="px-6 py-4.5 text-slate-500">{inv.campaign?.campaign_name}</td>
              <td className="px-6 py-4.5 font-semibold text-rose-500">{inv.due_date}</td>
              <td className="px-6 py-4.5 font-bold">₹{inv.total_amount.toLocaleString()}</td>
              <td className="px-6 py-4.5 text-emerald-655">+₹{(inv.total_amount - (inv.outstanding || 0)).toLocaleString()}</td>
              <td className="px-6 py-4.5 font-extrabold text-rose-650">₹{inv.outstanding?.toLocaleString()}</td>
              <td className="px-6 py-4.5">
                <Badge variant={inv.payment_status === 'Overdue' ? 'error' : 'warning'}>
                  {inv.payment_status}
                </Badge>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* F. RENEWAL REPORT */}
      {reportType === 'renewal' && (
        <Table headers={['Campaign Name', 'Client', 'End Date', 'Days Remaining', 'Billing Amount', 'Ad Type']}>
          {renewalReportData.map(c => (
            <tr key={c.id} className="border-b border-slate-100  text-xs hover:bg-slate-50/50 ">
              <td className="px-6 py-4.5 font-bold">{c.campaign_name}</td>
              <td className="px-6 py-4.5 font-semibold">{c.advertiser?.company_name}</td>
              <td className="px-6 py-4.5 font-semibold">{c.end_date}</td>
              <td className="px-6 py-4.5">
                <Badge variant={c.daysRemaining <= 7 ? 'error' : c.daysRemaining <= 15 ? 'warning' : 'success'}>
                  {c.daysRemaining} Days Left
                </Badge>
              </td>
              <td className="px-6 py-4.5 font-bold">₹{c.billing_amount.toLocaleString()}</td>
              <td className="px-6 py-4.5">{c.ad_type}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
};
