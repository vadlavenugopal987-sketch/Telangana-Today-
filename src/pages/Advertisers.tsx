import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Input, Select, Table, Badge, Modal, useToast } from '../components/ui';
import { Plus, Search, Edit3, Trash2, Phone, Mail, MapPin, Layers } from 'lucide-react';
import { Advertiser } from '../types';
import { useForm } from 'react-hook-form';

export const Advertisers: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Modal forms state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdv, setEditingAdv] = useState<Advertiser | null>(null);

  // TanStack Query
  const { data: advertisers = [], isLoading } = useQuery({
    queryKey: ['advertisers'],
    queryFn: () => dbService.getAdvertisers(),
  });

  // React Hook Form
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Omit<Advertiser, 'id' | 'created_at'>>();

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newAdv: Omit<Advertiser, 'id' | 'created_at'>) => 
      dbService.createAdvertiser(newAdv, user?.id || 'unknown', user?.full_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      success('Success', 'Advertiser created successfully.');
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      error('Failed to create', err.message);
    }
  });

  // Edit Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Advertiser> }) => 
      dbService.updateAdvertiser(id, data, user?.id || 'unknown', user?.full_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      success('Success', 'Advertiser details updated successfully.');
      setModalOpen(false);
      setEditingAdv(null);
      reset();
    },
    onError: (err: any) => {
      error('Failed to update', err.message);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      dbService.deleteAdvertiser(id, user?.id || 'unknown', user?.full_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertisers'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      success('Deleted', 'Advertiser deleted successfully.');
    },
    onError: (err: any) => {
      error('Cannot Delete', err.message || 'Linked campaigns prevent deletion.');
    }
  });

  const handleOpenCreateModal = () => {
    setEditingAdv(null);
    reset({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      gst_number: '',
      notes: '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (adv: Advertiser) => {
    setEditingAdv(adv);
    setValue('company_name', adv.company_name);
    setValue('contact_person', adv.contact_person);
    setValue('email', adv.email);
    setValue('phone', adv.phone);
    setValue('address', adv.address);
    setValue('gst_number', adv.gst_number);
    setValue('notes', adv.notes);
    setValue('status', adv.status);
    setModalOpen(true);
  };

  const onSubmit = (data: Omit<Advertiser, 'id' | 'created_at'>) => {
    if (editingAdv) {
      updateMutation.mutate({ id: editingAdv.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this advertiser?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter & Search logic
  const filteredAdvertisers = advertisers.filter(adv => {
    const matchesSearch = 
      adv.company_name.toLowerCase().includes(search.toLowerCase()) ||
      adv.contact_person.toLowerCase().includes(search.toLowerCase()) ||
      adv.email.toLowerCase().includes(search.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || adv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAdvertisers.length / itemsPerPage);
  const paginatedAdvertisers = filteredAdvertisers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const canDelete = user?.role === 'Admin';
  const canModify = user?.role === 'Admin' || user?.role === 'Manager';

  return (
    <div className="space-y-6 text-left">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900  tracking-tight">
            Advertisers Management
          </h2>
          <p className="text-sm text-slate-500  mt-1">
            Maintain account detail files, contract addresses, and active flags.
          </p>
        </div>
        {canModify && (
          <Button onClick={handleOpenCreateModal} icon={Plus}>
            Add Advertiser
          </Button>
        )}
      </div>

      {/* Search and filter bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <Input
            placeholder="Search by company, representative, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={Search}
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active Only' },
              { value: 'Inactive', label: 'Inactive Only' }
            ]}
          />
        </div>
      </Card>

      {/* Main Table */}
      <Table
        headers={['Company', 'Contact Person', 'Email / Phone', 'GST Number', 'Status', 'Actions']}
        isLoading={isLoading}
      >
        {paginatedAdvertisers.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500 ">
              No matching advertisers found.
            </td>
          </tr>
        ) : (
          paginatedAdvertisers.map((adv) => (
            <tr key={adv.id} className="border-b border-slate-100  text-sm hover:bg-slate-50/50 ">
              <td className="px-6 py-4.5 font-bold text-slate-900 ">
                {adv.company_name}
              </td>
              <td className="px-6 py-4.5 text-slate-650 ">
                {adv.contact_person}
              </td>
              <td className="px-6 py-4.5">
                <div className="flex flex-col gap-0.5 text-xs text-slate-500  font-medium">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3 shrink-0" /> {adv.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" /> {adv.phone}</span>
                </div>
              </td>
              <td className="px-6 py-4.5 font-mono text-xs font-semibold text-slate-600 ">
                {adv.gst_number || 'N/A'}
              </td>
              <td className="px-6 py-4.5">
                <Badge variant={adv.status === 'Active' ? 'success' : 'neutral'}>
                  {adv.status}
                </Badge>
              </td>
              <td className="px-6 py-4.5">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit3}
                    disabled={!canModify}
                    onClick={() => handleOpenEditModal(adv)}
                    title="Edit Advertiser"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    disabled={!canDelete}
                    onClick={() => handleDelete(adv.id)}
                    title="Delete Advertiser"
                  />
                </div>
              </td>
            </tr>
          ))
        )}
      </Table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white  px-6 py-4 rounded-xl border border-slate-200/80 ">
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

      {/* Modal Dialog Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAdv ? 'Edit Advertiser Details' : 'Register New Advertiser'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <Input
            label="Company Name *"
            placeholder="e.g. Apex Media Corp"
            required
            error={errors.company_name?.message}
            {...register('company_name', { required: 'Company name is required' })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Representative *"
              placeholder="John Doe"
              required
              error={errors.contact_person?.message}
              {...register('contact_person', { required: 'Contact person is required' })}
            />
            <Input
              label="GST Registration Number"
              placeholder="e.g. 27AAAAA1111A1Z1"
              error={errors.gst_number?.message}
              {...register('gst_number')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              placeholder="billing@company.com"
              type="email"
              required
              error={errors.email?.message}
              {...register('email', { 
                required: 'Email is required',
                pattern: { value: /^\S+@\S+?/i, message: 'Invalid email format' }
              })}
            />
            <Input
              label="Phone Number *"
              placeholder="+1 (555) 012-3456"
              required
              error={errors.phone?.message}
              {...register('phone', { required: 'Phone is required' })}
            />
          </div>

          <Input
            label="Street Billing Address"
            placeholder="123 Corporate Blvd, Suite 100"
            error={errors.address?.message}
            {...register('address')}
          />

          <Select
            label="Advertiser Status"
            defaultValue="Active"
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' }
            ]}
            {...register('status')}
          />

          <div className="w-full text-left">
            <label className="block text-xs font-semibold text-slate-650  mb-1.5">
              Internal Account Notes
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200  bg-white  px-3.5 py-2.5 text-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none min-h-20"
              placeholder="Add payment terms, preferences, etc..."
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100  pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Save Advertiser
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
