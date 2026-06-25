import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbService } from '../services/db';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Input, Select, Table, Badge, Modal, useToast } from '../components/ui';
import { Plus, Search, Edit3, Trash2, Calendar, FileText, Megaphone } from 'lucide-react';
import { Campaign, CampaignWithAdvertiser } from '../types';
import { useForm } from 'react-hook-form';

export const Campaigns: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Scheduled' | 'Completed' | 'Expired'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Digital' | 'Print' | 'Radio' | 'OOH' | 'TV'>('All');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Campaign | null>(null);

  // Queries
  const { data: campaigns = [], isLoading: loadingCamp } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => dbService.getCampaigns(),
  });

  const { data: advertisers = [], isLoading: loadingAdv } = useQuery({
    queryKey: ['advertisers'],
    queryFn: () => dbService.getAdvertisers(),
  });

  // React Hook Form
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Omit<Campaign, 'id' | 'created_at'>>();

  // Create Campaign Mutation (Autogenerates Invoice internally!)
  const createMutation = useMutation({
    mutationFn: (newCamp: Omit<Campaign, 'id' | 'created_at'>) => 
      dbService.createCampaign(newCamp, user?.id || 'unknown', user?.full_name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      success('Campaign Setup Successfully', `Campaign created and linked invoice auto-generated.`);
      setModalOpen(false);
      reset();
    },
    onError: (err: any) => {
      error('Failed to create', err.message);
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) => 
      dbService.updateCampaign(id, data, user?.id || 'unknown', user?.full_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      success('Campaign Updated', 'Campaign settings saved successfully.');
      setModalOpen(false);
      setEditingCamp(null);
      reset();
    },
    onError: (err: any) => {
      error('Failed to update', err.message);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      dbService.deleteCampaign(id, user?.id || 'unknown', user?.full_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['activity_logs'] });
      success('Deleted', 'Campaign and all linked invoices deleted successfully.');
    },
    onError: (err: any) => {
      error('Error deleting', err.message);
    }
  });

  const handleOpenCreateModal = () => {
    if (advertisers.length === 0) {
      error('No Advertisers', 'Please register at least one Advertiser first before setting up a Campaign.');
      return;
    }
    setEditingCamp(null);
    reset({
      campaign_name: '',
      advertiser_id: advertisers[0].id,
      ad_type: 'Digital',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      insertions: 10,
      billing_amount: 5000,
      status: 'Scheduled'
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (camp: Campaign) => {
    setEditingCamp(camp);
    setValue('campaign_name', camp.campaign_name);
    setValue('advertiser_id', camp.advertiser_id);
    setValue('ad_type', camp.ad_type);
    setValue('start_date', camp.start_date);
    setValue('end_date', camp.end_date);
    setValue('insertions', camp.insertions);
    setValue('billing_amount', camp.billing_amount);
    setValue('status', camp.status);
    setModalOpen(true);
  };

  const onSubmit = (data: Omit<Campaign, 'id' | 'created_at'>) => {
    // Force inputs to correct types
    const formatted = {
      ...data,
      insertions: Number(data.insertions),
      billing_amount: Number(data.billing_amount)
    };

    if (editingCamp) {
      updateMutation.mutate({ id: editingCamp.id, data: formatted });
    } else {
      createMutation.mutate(formatted);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deleting this campaign will also remove its automatically generated invoices and payments. Proceed?')) {
      deleteMutation.mutate(id);
    }
  };

  // Remaining days helper with color systems
  const getRemainingDaysBadge = (camp: CampaignWithAdvertiser) => {
    if (camp.status !== 'Active') return null;
    const end = new Date(camp.end_date);
    const diff = end.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return <Badge variant="error">Expired</Badge>;
    if (days <= 7) return <Badge variant="error">{days} Days Left</Badge>;
    if (days <= 15) return <Badge variant="warning">{days} Days Left</Badge>;
    if (days <= 30) return <Badge variant="success">{days} Days Left</Badge>;
    return <Badge variant="info">{days} Days Left</Badge>;
  };

  // Filter Logic
  const filteredCampaigns = campaigns.filter(camp => {
    const matchesSearch = camp.campaign_name.toLowerCase().includes(search.toLowerCase()) ||
      camp.advertiser?.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || camp.status === statusFilter;
    const matchesType = typeFilter === 'All' || camp.ad_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const paginatedCampaigns = filteredCampaigns.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const canDelete = user?.role === 'Admin';
  const canModify = user?.role === 'Admin' || user?.role === 'Manager';

  return (
    <div className="space-y-6 text-left">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900  tracking-tight">
            Campaigns Management
          </h2>
          <p className="text-sm text-slate-500  mt-1">
            Setup advertising insertions, timeline bounds, and view auto-generated bills.
          </p>
        </div>
        {canModify && (
          <Button onClick={handleOpenCreateModal} icon={Plus}>
            New Campaign
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <Input
            placeholder="Search by campaign name or client..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={Search}
          />
        </div>
        <div>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Scheduled', label: 'Scheduled' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Expired', label: 'Expired' }
            ]}
          />
        </div>
        <div>
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
            options={[
              { value: 'All', label: 'All Ad Types' },
              { value: 'Digital', label: 'Digital' },
              { value: 'Print', label: 'Print' },
              { value: 'Radio', label: 'Radio' },
              { value: 'OOH', label: 'OOH (Out of Home)' },
              { value: 'TV', label: 'TV Commercial' }
            ]}
          />
        </div>
      </Card>

      {/* Campaign List Grid / Cards */}
      {loadingCamp || loadingAdv ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-200  rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : paginatedCampaigns.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 ">
          <Megaphone className="w-12 h-12 text-slate-350  mx-auto mb-3 animate-pulse" />
          <p className="font-bold text-base">No Campaigns Found</p>
          <p className="text-sm text-slate-400 mt-1">Try relaxing filters or create a new campaign entry.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCampaigns.map((camp) => (
            <Card key={camp.id} className="relative flex flex-col justify-between overflow-hidden">
              {/* Status Side Indicator Accent */}
              <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                camp.status === 'Active' ? 'bg-indigo-600' :
                camp.status === 'Scheduled' ? 'bg-amber-400' :
                camp.status === 'Completed' ? 'bg-emerald-500' :
                'bg-rose-500'
              }`} />

              <div className="pl-2.5 space-y-4 flex-1">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900  truncate" title={camp.campaign_name}>
                      {camp.campaign_name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500  mt-1 truncate">
                      {camp.advertiser?.company_name || 'Loading client...'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0 items-end">
                    <Badge variant={
                      camp.status === 'Active' ? 'info' :
                      camp.status === 'Scheduled' ? 'warning' :
                      camp.status === 'Completed' ? 'success' : 'error'
                    }>
                      {camp.status}
                    </Badge>
                    {getRemainingDaysBadge(camp)}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50  p-3 rounded-xl border border-slate-200/40 ">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Ad Type</span>
                    <span className="font-bold text-slate-850  mt-0.5 block">{camp.ad_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Insertions</span>
                    <span className="font-bold text-slate-850  mt-0.5 block">{camp.insertions} times</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Dates</span>
                    <span className="font-bold text-slate-850  mt-0.5 block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      {camp.start_date}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Billing Amount</span>
                    <span className="font-extrabold text-indigo-600  mt-0.5 block">₹{camp.billing_amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Timeline visual representation */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Timeline Range</span>
                    <span>Ends {camp.end_date}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100  rounded-full overflow-hidden">
                    {/* Calculate progress percentage */}
                    {(() => {
                      const start = new Date(camp.start_date).getTime();
                      const end = new Date(camp.end_date).getTime();
                      const now = Date.now();
                      const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
                      return (
                        <div 
                          className={`h-full rounded-full ${
                            camp.status === 'Active' ? 'bg-indigo-600' :
                            camp.status === 'Completed' ? 'bg-emerald-500' :
                            camp.status === 'Scheduled' ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pl-2.5 flex justify-end gap-2 border-t border-slate-100  pt-3 mt-4 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit3}
                  disabled={!canModify}
                  onClick={() => handleOpenEditModal(camp)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  disabled={!canDelete}
                  onClick={() => handleDelete(camp.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
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

      {/* Campaign Create/Edit Dialog */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCamp ? 'Modify Campaign Details' : 'Launch New Campaign'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <Input
            label="Campaign Name *"
            placeholder="e.g. Autumn Real Estate Showcase"
            required
            error={errors.campaign_name?.message}
            {...register('campaign_name', { required: 'Campaign name is required' })}
          />

          <Select
            label="Select Client / Advertiser *"
            required
            options={advertisers.map(adv => ({
              value: adv.id,
              label: `${adv.company_name} (${adv.contact_person})`
            }))}
            {...register('advertiser_id')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Advertisement Medium *"
              defaultValue="Digital"
              options={[
                { value: 'Digital', label: 'Digital Banners' },
                { value: 'Print', label: 'Print Press / Newspaper' },
                { value: 'Radio', label: 'Radio Broadcast Spot' },
                { value: 'OOH', label: 'OOH Billboard / Banner' },
                { value: 'TV', label: 'TV Commercial Block' }
              ]}
              {...register('ad_type')}
            />
            <Input
              label="Insertion Count *"
              type="number"
              placeholder="e.g. 10"
              required
              error={errors.insertions?.message}
              {...register('insertions', { 
                required: 'Insertions is required',
                min: { value: 1, message: 'Minimum 1 insertion required' }
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Schedule Start Date *"
              type="date"
              required
              {...register('start_date', { required: 'Start date is required' })}
            />
            <Input
              label="Schedule End Date *"
              type="date"
              required
              {...register('end_date', { required: 'End date is required' })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Billing Base Amount (₹) *"
              type="number"
              placeholder="e.g. 5000"
              required
              error={errors.billing_amount?.message}
              {...register('billing_amount', { 
                required: 'Billing amount is required',
                min: { value: 0, message: 'Must be positive' }
              })}
            />
            <Select
              label="Campaign Status"
              defaultValue="Scheduled"
              options={[
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Active', label: 'Active / Running' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Expired', label: 'Expired' }
              ]}
              {...register('status')}
            />
          </div>

          <div className="p-3 bg-indigo-500/5  border border-indigo-200/50  rounded-xl text-xs text-slate-500 ">
            <p className="font-bold text-slate-700 ">System Workflow Notice:</p>
            <p className="mt-1 leading-relaxed">
              When creating a new campaign, the system automatically triggers invoice creation. 
              The total amount will include a standard <strong>18% GST</strong> surcharge.
            </p>
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
              Save Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
