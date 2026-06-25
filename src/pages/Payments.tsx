import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { Card, Table, Input, Select, Badge } from '../components/ui';
import { Search, IndianRupee, Calendar, CreditCard } from 'lucide-react';

export const Payments: React.FC = () => {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'All' | 'UPI' | 'Bank Transfer' | 'Cash' | 'Cheque'>('All');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Queries
  const { data: payments = [], isLoading: loadingPay } = useQuery({
    queryKey: ['payments'],
    queryFn: () => dbService.getPayments(),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => dbService.getInvoices(),
  });

  // Filter Logic
  const filteredPayments = payments.filter(pay => {
    const invoiceNum = invoices.find(inv => inv.id === pay.invoice_id)?.invoice_number || '';
    const matchesSearch = 
      pay.id.toLowerCase().includes(search.toLowerCase()) ||
      pay.reference_number.toLowerCase().includes(search.toLowerCase()) ||
      invoiceNum.toLowerCase().includes(search.toLowerCase());

    const matchesMethod = methodFilter === 'All' || pay.payment_method === methodFilter;

    return matchesSearch && matchesMethod;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h2 className="text-xl lg:text-2xl font-black text-slate-950 tracking-tight">
          Collection Transaction Ledger
        </h2>
        <p className="text-xs text-slate-500 font-semibold mt-1">
          Review all payment vouchers, UPI reference numbers, bank checks, and cash collection logs.
        </p>
      </div>

      {/* KPI total collections count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 bg-slate-50 flex items-center justify-between border-slate-950">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Received Income</p>
            <h3 className="text-xl font-black mt-1 text-slate-950">₹{totalCollected.toLocaleString()}</h3>
          </div>
          <div className="p-2 border border-slate-950 rounded-lg bg-white">
            <IndianRupee className="w-5 h-5 text-slate-950" />
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 flex items-center justify-between border-slate-950">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Processed Records</p>
            <h3 className="text-xl font-black mt-1 text-slate-950">{filteredPayments.length} transactions</h3>
          </div>
          <div className="p-2 border border-slate-950 rounded-lg bg-white">
            <CreditCard className="w-5 h-5 text-slate-950" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center border-slate-950">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by invoice number, transaction reference..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={Search}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value as any); setPage(1); }}
            options={[
              { value: 'All', label: 'All Methods' },
              { value: 'UPI', label: 'UPI / QR Code' },
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'Cash', label: 'Cash' },
              { value: 'Cheque', label: 'Bank Cheque' }
            ]}
          />
        </div>
      </Card>

      {/* Ledger Table */}
      <Table
        headers={['Payment Date', 'Invoice Reference', 'Collection Amount', 'Payment Gateway', 'Reference Number', 'Receipt ID']}
        isLoading={loadingPay}
      >
        {paginatedPayments.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
              No recorded payments found matching the search criteria.
            </td>
          </tr>
        ) : (
          paginatedPayments.map((pay) => {
            const invoiceNum = invoices.find(inv => inv.id === pay.invoice_id)?.invoice_number || 'N/A';
            return (
              <tr key={pay.id} className="border-b border-slate-200 text-xs hover:bg-slate-50/50">
                <td className="px-6 py-4 font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" /> {pay.payment_date}</span>
                </td>
                <td className="px-6 py-4 font-bold font-mono text-slate-900">
                  {invoiceNum}
                </td>
                <td className="px-6 py-4 font-black text-slate-900 text-sm">
                  ₹{pay.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <Badge variant="success">{pay.payment_method}</Badge>
                </td>
                <td className="px-6 py-4 font-mono font-semibold text-slate-600">
                  {pay.reference_number}
                </td>
                <td className="px-6 py-4 font-mono text-slate-450 uppercase font-bold">
                  {pay.id}
                </td>
              </tr>
            );
          })
        )}
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white px-6 py-4 rounded-xl border border-slate-950 mt-4">
          <span className="text-xs font-bold text-slate-500">
            Showing Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-950 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-950 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
