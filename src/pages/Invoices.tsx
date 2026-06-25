import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Input, Select, Table, Badge, Modal, useToast } from '../components/ui';
import { Search, CreditCard, Eye, Printer, IndianRupee, Calendar, Landmark, CheckCircle } from 'lucide-react';
import { Invoice, Payment, InvoiceWithDetails } from '../types';
import { useForm } from 'react-hook-form';

export const Invoices: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue' | 'Partial'>('All');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<InvoiceWithDetails | null>(null);

  // Queries
  const { data: invoices = [], isLoading: loadingInvs } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => dbService.getInvoices(),
  });

  // React Hook Form for Payments
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Omit<Payment, 'id' | 'created_at'>>();

  // Record Payment Mutation
  const paymentMutation = useMutation({
    mutationFn: (newPay: Omit<Payment, 'id' | 'created_at'>) => 
      dbService.recordPayment(newPay, user?.id || 'unknown', user?.full_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      success('Payment Recorded', 'Invoice payment state and outstanding balances updated.');
      setPaymentModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      error('Recording Failed', err.message);
    }
  });

  const handleOpenPreview = (inv: InvoiceWithDetails) => {
    setSelectedInvoice(inv);
    setPreviewModalOpen(true);
  };

  const handleOpenPayment = (inv: InvoiceWithDetails) => {
    setPayingInvoice(inv);
    reset({
      invoice_id: inv.id,
      amount: inv.outstanding || 0,
      payment_method: 'UPI',
      reference_number: '',
      payment_date: new Date().toISOString().split('T')[0]
    });
    setPaymentModalOpen(true);
  };

  const onPaymentSubmit = (data: Omit<Payment, 'id' | 'created_at'>) => {
    const formatted = {
      ...data,
      amount: Number(data.amount)
    };

    if (payingInvoice && formatted.amount > (payingInvoice.outstanding || 0)) {
      error('Invalid Amount', `Payment cannot exceed the outstanding invoice balance of ₹${payingInvoice.outstanding}.`);
      return;
    }

    paymentMutation.mutate(formatted);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter Logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.advertiser?.company_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.campaign?.campaign_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getStatusBadge = (status: Invoice['payment_status']) => {
    const badges: Record<Invoice['payment_status'], 'success' | 'warning' | 'error' | 'info'> = {
      Paid: 'success',
      Pending: 'warning',
      Overdue: 'error',
      Partial: 'info'
    };
    return <Badge variant={badges[status]}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header controls */}
      <div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900  tracking-tight">
          Billing & Invoices
        </h2>
        <p className="text-sm text-slate-500  mt-1">
          Review accounts receivable billing reports, record partial collections, and print corporate invoices.
        </p>
      </div>

      {/* Filter controls */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by invoice number, client, or campaign..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={Search}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            options={[
              { value: 'All', label: 'All Invoices' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Partial', label: 'Partial' },
              { value: 'Overdue', label: 'Overdue' }
            ]}
          />
        </div>
      </Card>

      {/* Invoices List Table */}
      <Table
        headers={['Invoice Number', 'Campaign & Client', 'Total Billed', 'Outstanding', 'Due Date', 'Status', 'Actions']}
        isLoading={loadingInvs}
      >
        {paginatedInvoices.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500 ">
              No matching invoices found.
            </td>
          </tr>
        ) : (
          paginatedInvoices.map((inv) => (
            <tr key={inv.id} className="border-b border-slate-100  text-sm hover:bg-slate-50/50 ">
              <td className="px-6 py-4 font-mono font-bold text-slate-900 ">
                {inv.invoice_number}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800  truncate max-w-[220px]">
                    {inv.campaign?.campaign_name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider truncate max-w-[200px]">
                    {inv.advertiser?.company_name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 font-bold text-slate-800 ">
                ₹{inv.total_amount.toLocaleString()}
                <span className="text-[10px] text-slate-400 font-medium block">Base: ₹{inv.amount.toLocaleString()} + GST</span>
              </td>
              <td className="px-6 py-4 font-bold">
                {inv.outstanding === 0 ? (
                  <span className="text-emerald-600  flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Fully Paid</span>
                ) : (
                  <span className="text-slate-950 ">₹{inv.outstanding?.toLocaleString()}</span>
                )}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-500 ">
                {inv.due_date}
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(inv.payment_status)}
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => handleOpenPreview(inv)}
                    title="Preview & Print Invoice"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CreditCard}
                    disabled={inv.payment_status === 'Paid'}
                    onClick={() => handleOpenPayment(inv)}
                  >
                    Pay
                  </Button>
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>

      {/* Pagination control */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white  px-6 py-4 rounded-xl border border-slate-200/80  mt-4">
          <span className="text-xs font-semibold text-slate-500">
            Showing Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* 1. RECORD PAYMENT MODAL */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Invoice Payment Collection"
      >
        {payingInvoice && (
          <form onSubmit={handleSubmit(onPaymentSubmit)} className="space-y-4 text-left">
            <div className="p-4 bg-slate-50  border border-slate-200/60  rounded-2xl flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Invoice Number:</span>
                <span className="font-bold text-slate-850 ">{payingInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Client:</span>
                <span className="font-bold text-slate-850  truncate max-w-[200px]">{payingInvoice.advertiser?.company_name}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/40  pt-2">
                <span className="text-slate-500 font-medium">Total Billed:</span>
                <span className="font-bold text-slate-800 ">₹{payingInvoice.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Outstanding Balance:</span>
                <span className="font-extrabold text-indigo-600  text-sm">₹{payingInvoice.outstanding?.toLocaleString()}</span>
              </div>
            </div>

            <Input
              label="Collection Amount (₹) *"
              type="number"
              placeholder="0.00"
              required
              error={errors.amount?.message}
              {...register('amount', { 
                required: 'Amount is required',
                min: { value: 1, message: 'Minimum ₹1 collection required' }
              })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Payment Gateway / Method *"
                defaultValue="UPI"
                options={[
                  { value: 'UPI', label: 'UPI / QR Code' },
                  { value: 'Bank Transfer', label: 'Bank IMPS/NEFT' },
                  { value: 'Cash', label: 'Cash Collection' },
                  { value: 'Cheque', label: 'Bank Cheque' }
                ]}
                {...register('payment_method')}
              />
              <Input
                label="Transaction / Cheque Reference *"
                placeholder="e.g. TXN98765432"
                required
                error={errors.reference_number?.message}
                {...register('reference_number', { required: 'Transaction reference is required' })}
              />
            </div>

            <Input
              label="Collection Date *"
              type="date"
              required
              {...register('payment_date', { required: 'Date is required' })}
            />

            <div className="flex justify-end gap-3 border-t border-slate-100  pt-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={paymentMutation.isPending}
                icon={CheckCircle}
              >
                Submit Collection
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* 2. INVOICE PREVIEW MODAL (Printable view) */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Invoice Document Preview"
      >
        {selectedInvoice && (
          <div className="space-y-6 text-left">
            {/* Printable Area Wrapper */}
            <div id="invoice-print-area" className="print-card p-6 bg-white border border-slate-200 rounded-2xl text-slate-800">
              
              {/* Header Letterhead */}
              <div className="flex justify-between items-start border-b-2 border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-950 flex items-center justify-center text-white text-xs font-black">T</span>
                    TELANGANA TODAY
                  </h3>
                  <p className="text-[10px] text-slate-450 mt-1 font-bold uppercase tracking-wider">Newspaper & Media Management</p>
                  <p className="text-xs text-slate-500 mt-0.5">100 Advertising Blvd, Boston, MA</p>
                </div>
                <div className="text-right">
                  <h4 className="text-lg font-extrabold text-indigo-600">INVOICE</h4>
                  <p className="text-xs font-mono font-bold text-slate-650 mt-1">{selectedInvoice.invoice_number}</p>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-2 gap-6 py-6 text-xs border-b border-slate-150">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1.5">Billed To:</span>
                  <p className="font-extrabold text-slate-900">{selectedInvoice.advertiser?.company_name}</p>
                  <p className="text-slate-600 mt-1 font-semibold">Rep: {selectedInvoice.advertiser?.contact_person}</p>
                  <p className="text-slate-500 mt-0.5">{selectedInvoice.advertiser?.address || 'Billing address not provided'}</p>
                  <p className="text-slate-500 mt-0.5">Email: {selectedInvoice.advertiser?.email}</p>
                  {selectedInvoice.advertiser?.gst_number && (
                    <p className="text-slate-800 font-mono font-bold mt-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 inline-block">GSTIN: {selectedInvoice.advertiser?.gst_number}</p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-1.5">Invoice Parameters:</span>
                  <table className="text-slate-600 font-semibold space-y-1">
                    <tbody>
                      <tr>
                        <td className="pr-3 text-slate-400 text-left">Date Created:</td>
                        <td className="text-slate-800 text-right">{new Date(selectedInvoice.created_at || Date.now()).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td className="pr-3 text-slate-400 text-left">Due Date:</td>
                        <td className="text-slate-900 font-extrabold text-right">{selectedInvoice.due_date}</td>
                      </tr>
                      <tr>
                        <td className="pr-3 text-slate-400 text-left">Billing Status:</td>
                        <td className="text-right pt-0.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            selectedInvoice.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            selectedInvoice.payment_status === 'Partial' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                            selectedInvoice.payment_status === 'Overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {selectedInvoice.payment_status}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="py-6">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-left">
                      <th className="py-2.5">Advertising Item / Description</th>
                      <th className="py-2.5">Medium</th>
                      <th className="py-2.5 text-right">Insertions</th>
                      <th className="py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 text-slate-800">
                      <td className="py-4">
                        <p className="font-extrabold text-slate-900">{selectedInvoice.campaign?.campaign_name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Schedule: {selectedInvoice.campaign?.start_date} to {selectedInvoice.campaign?.end_date}</p>
                      </td>
                      <td className="py-4 font-semibold text-slate-600">{selectedInvoice.campaign?.ad_type}</td>
                      <td className="py-4 text-right font-bold text-slate-650">{selectedInvoice.campaign?.insertions}</td>
                      <td className="py-4 text-right font-bold">₹{selectedInvoice.amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Subtotals & Taxes */}
              <div className="border-t border-slate-150 pt-4 flex justify-end text-xs">
                <div className="w-56 space-y-2 font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span>₹{selectedInvoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-150 pb-2">
                    <span>GST (18% standard):</span>
                    <span>₹{selectedInvoice.gst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1">
                    <span>Invoice Total:</span>
                    <span className="text-indigo-600">₹{selectedInvoice.total_amount.toLocaleString()}</span>
                  </div>
                  
                  {/* Collections history summary */}
                  <div className="border-t border-slate-150 pt-2 flex justify-between text-slate-500 font-medium">
                    <span>Total Collected:</span>
                    <span className="text-emerald-600 font-bold">
                      -₹{((selectedInvoice.payments || []).reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black pt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span>Remaining Due:</span>
                    <span className="text-rose-600">₹{selectedInvoice.outstanding?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Transactions details */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div className="border-t border-slate-150 mt-6 pt-4 text-left">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2">Recorded Collections History:</span>
                  <div className="space-y-1.5">
                    {selectedInvoice.payments.map((p, index) => (
                      <div key={p.id || index} className="flex justify-between text-[11px] p-2 bg-slate-55 rounded-lg border border-slate-100 font-medium">
                        <span className="text-slate-600">
                          {p.payment_date} – {p.payment_method} (Ref: {p.reference_number})
                        </span>
                        <span className="font-bold text-emerald-600">+₹{p.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Policy */}
              <div className="text-center text-[10px] text-slate-400 mt-8 border-t border-slate-100 pt-4 leading-relaxed font-medium">
                Thank you for your business! All invoices are subject to 18% standard goods & services tax. 
                Payments should be processed by the indicated due dates.
              </div>
            </div>

            {/* Print Controls (Excluded from print style via CSS) */}
            <div className="flex justify-between items-center border-t border-slate-100  pt-4 mt-6 no-print">
              <Button
                variant="outline"
                onClick={() => setPreviewModalOpen(false)}
              >
                Close Preview
              </Button>
              <Button
                variant="primary"
                onClick={handlePrint}
                icon={Printer}
              >
                Print Invoice Document
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
