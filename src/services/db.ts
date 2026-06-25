import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Advertiser, Campaign, Invoice, Payment, ActivityLog, Profile, UserRole, CampaignWithAdvertiser, InvoiceWithDetails } from '../types';
import { mockAdvertisers, mockCampaigns, mockInvoices, mockPayments, mockLogs, mockProfiles } from './mockData';

// Storage Keys
const KEYS = {
  ADVERTISERS: 'adbook_advertisers',
  CAMPAIGNS: 'adbook_campaigns',
  INVOICES: 'adbook_invoices',
  PAYMENTS: 'adbook_payments',
  LOGS: 'adbook_logs',
  PROFILES: 'adbook_profiles',
  CURRENT_USER: 'adbook_current_user',
};

// Initialize LocalStorage with mock data if not already existing
const initLocalStorage = () => {
  // Migration check: Clear cache if using old adbook.com domain profiles
  const profilesRaw = localStorage.getItem(KEYS.PROFILES);
  if (profilesRaw && profilesRaw.includes('@adbook.com')) {
    localStorage.clear();
  }

  if (!localStorage.getItem(KEYS.ADVERTISERS)) {
    localStorage.setItem(KEYS.ADVERTISERS, JSON.stringify(mockAdvertisers));
  }
  if (!localStorage.getItem(KEYS.CAMPAIGNS)) {
    localStorage.setItem(KEYS.CAMPAIGNS, JSON.stringify(mockCampaigns));
  }
  if (!localStorage.getItem(KEYS.INVOICES)) {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(mockInvoices));
  }
  if (!localStorage.getItem(KEYS.PAYMENTS)) {
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(mockPayments));
  }
  if (!localStorage.getItem(KEYS.LOGS)) {
    localStorage.setItem(KEYS.LOGS, JSON.stringify(mockLogs));
  }
  if (!localStorage.getItem(KEYS.PROFILES)) {
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(mockProfiles));
  }
  if (!localStorage.getItem(KEYS.CURRENT_USER)) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(mockProfiles[0])); // Default login as Admin for demo
  }
};

if (!isSupabaseConfigured) {
  initLocalStorage();
}

// Helper to get raw items from localStorage
const getLocal = <T>(key: string): T[] => {
  return JSON.parse(localStorage.getItem(key) || '[]') as T[];
};

// Helper to save items to localStorage
const setLocal = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Core Database Service
export const dbService = {
  isDemoMode(): boolean {
    return !isSupabaseConfigured;
  },

  // --- LOGGING ---
  async getLogs(): Promise<ActivityLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<ActivityLog>(KEYS.LOGS).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  },

  async addLog(action: string, module: ActivityLog['module'], userId: string, userName?: string): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: userId,
      user_name: userName || 'Unknown User',
      action,
      module,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([{
          action,
          module,
          user_id: userId
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const logs = getLocal<ActivityLog>(KEYS.LOGS);
      logs.unshift(log);
      setLocal(KEYS.LOGS, logs);
      return log;
    }
  },

  // --- ADVERTISERS ---
  async getAdvertisers(): Promise<Advertiser[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('advertisers')
        .select('*')
        .order('company_name', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<Advertiser>(KEYS.ADVERTISERS).sort((a, b) => 
        a.company_name.localeCompare(b.company_name)
      );
    }
  },

  async createAdvertiser(advertiser: Omit<Advertiser, 'id' | 'created_at'>, userId: string, userName?: string): Promise<Advertiser> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('advertisers')
        .insert([advertiser])
        .select()
        .single();
      if (error) throw error;
      await this.addLog(`Created advertiser: ${advertiser.company_name}`, 'Advertiser', userId, userName);
      return data;
    } else {
      const newAdv: Advertiser = {
        ...advertiser,
        id: 'adv-' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString()
      };
      const list = getLocal<Advertiser>(KEYS.ADVERTISERS);
      list.push(newAdv);
      setLocal(KEYS.ADVERTISERS, list);
      await this.addLog(`Created advertiser: ${newAdv.company_name}`, 'Advertiser', userId, userName);
      return newAdv;
    }
  },

  async updateAdvertiser(id: string, advertiser: Partial<Advertiser>, userId: string, userName?: string): Promise<Advertiser> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('advertisers')
        .update(advertiser)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await this.addLog(`Updated advertiser details: ${advertiser.company_name || id}`, 'Advertiser', userId, userName);
      return data;
    } else {
      const list = getLocal<Advertiser>(KEYS.ADVERTISERS);
      const index = list.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Advertiser not found');
      const updated = { ...list[index], ...advertiser };
      list[index] = updated;
      setLocal(KEYS.ADVERTISERS, list);
      await this.addLog(`Updated advertiser details: ${updated.company_name}`, 'Advertiser', userId, userName);
      return updated;
    }
  },

  async deleteAdvertiser(id: string, userId: string, userName?: string): Promise<void> {
    // Check if there are active campaigns linked to this advertiser
    const campaigns = await this.getCampaigns();
    const linked = campaigns.filter(c => c.advertiser_id === id);
    if (linked.length > 0) {
      throw new Error('Cannot delete advertiser. Please delete or reassign linked campaigns first.');
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('advertisers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await this.addLog(`Deleted advertiser ID: ${id}`, 'Advertiser', userId, userName);
    } else {
      const list = getLocal<Advertiser>(KEYS.ADVERTISERS);
      const target = list.find(a => a.id === id);
      const filtered = list.filter(a => a.id !== id);
      setLocal(KEYS.ADVERTISERS, filtered);
      await this.addLog(`Deleted advertiser: ${target?.company_name || id}`, 'Advertiser', userId, userName);
    }
  },

  // --- CAMPAIGNS & BILLING (AUTO-INVOICING) ---
  async getCampaigns(): Promise<CampaignWithAdvertiser[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, advertisers(*)');
      if (error) throw error;
      // Map supabase nested advertiser response to client layout
      return (data || []).map((c: any) => ({
        ...c,
        advertiser: c.advertisers
      }));
    } else {
      const campaigns = getLocal<Campaign>(KEYS.CAMPAIGNS);
      const advertisers = getLocal<Advertiser>(KEYS.ADVERTISERS);
      return campaigns.map(camp => ({
        ...camp,
        advertiser: advertisers.find(a => a.id === camp.advertiser_id)
      }));
    }
  },

  async createCampaign(campaign: Omit<Campaign, 'id' | 'created_at'>, userId: string, userName?: string): Promise<Campaign> {
    const gstRate = 0.18; // 18% GST standard
    const amount = campaign.billing_amount;
    const gst = Math.round(amount * gstRate * 100) / 100;
    const totalAmount = amount + gst;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days due date standard

    if (isSupabaseConfigured && supabase) {
      // 1. Insert Campaign
      const { data: campData, error: campError } = await supabase
        .from('campaigns')
        .insert([campaign])
        .select()
        .single();
      if (campError) throw campError;

      // 2. Generate Auto Invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error: invError } = await supabase
        .from('invoices')
        .insert([{
          campaign_id: campData.id,
          invoice_number: invoiceNumber,
          amount,
          gst,
          total_amount: totalAmount,
          due_date: dueDate.toISOString().split('T')[0],
          payment_status: 'Pending'
        }]);
      if (invError) {
        // Soft delete campaign if invoice creation fails
        await supabase.from('campaigns').delete().eq('id', campData.id);
        throw invError;
      }

      await this.addLog(`Created campaign: ${campaign.campaign_name} (Auto-generated ${invoiceNumber})`, 'Campaign', userId, userName);
      return campData;
    } else {
      const newCamp: Campaign = {
        ...campaign,
        id: 'camp-' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString()
      };
      
      const campaigns = getLocal<Campaign>(KEYS.CAMPAIGNS);
      campaigns.push(newCamp);
      setLocal(KEYS.CAMPAIGNS, campaigns);

      // Generate Auto Invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newInv: Invoice = {
        id: 'inv-' + Math.random().toString(36).substring(2, 9),
        campaign_id: newCamp.id,
        invoice_number: invoiceNumber,
        amount,
        gst,
        total_amount: totalAmount,
        due_date: dueDate.toISOString().split('T')[0],
        payment_status: 'Pending',
        created_at: new Date().toISOString()
      };

      const invoices = getLocal<Invoice>(KEYS.INVOICES);
      invoices.push(newInv);
      setLocal(KEYS.INVOICES, invoices);

      await this.addLog(`Created campaign: ${newCamp.campaign_name} (Auto-generated ${invoiceNumber})`, 'Campaign', userId, userName);
      return newCamp;
    }
  },

  async updateCampaign(id: string, campaign: Partial<Campaign>, userId: string, userName?: string): Promise<Campaign> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaign)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      await this.addLog(`Updated campaign: ${campaign.campaign_name || id}`, 'Campaign', userId, userName);
      return data;
    } else {
      const list = getLocal<Campaign>(KEYS.CAMPAIGNS);
      const index = list.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Campaign not found');
      const updated = { ...list[index], ...campaign };
      list[index] = updated;
      setLocal(KEYS.CAMPAIGNS, list);
      await this.addLog(`Updated campaign: ${updated.campaign_name}`, 'Campaign', userId, userName);
      return updated;
    }
  },

  async deleteCampaign(id: string, userId: string, userName?: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await this.addLog(`Deleted campaign ID: ${id}`, 'Campaign', userId, userName);
    } else {
      const list = getLocal<Campaign>(KEYS.CAMPAIGNS);
      const target = list.find(c => c.id === id);
      const filtered = list.filter(c => c.id !== id);
      setLocal(KEYS.CAMPAIGNS, filtered);

      // Clean up linked invoices and payments in mock mode
      const invoices = getLocal<Invoice>(KEYS.INVOICES);
      const linkedInvs = invoices.filter(inv => inv.campaign_id === id);
      const linkedInvIds = linkedInvs.map(inv => inv.id);

      const filteredInvoices = invoices.filter(inv => inv.campaign_id !== id);
      setLocal(KEYS.INVOICES, filteredInvoices);

      const payments = getLocal<Payment>(KEYS.PAYMENTS);
      const filteredPayments = payments.filter(pay => !linkedInvIds.includes(pay.invoice_id));
      setLocal(KEYS.PAYMENTS, filteredPayments);

      await this.addLog(`Deleted campaign: ${target?.campaign_name || id}`, 'Campaign', userId, userName);
    }
  },

  // --- INVOICES & PAYMENTS ---
  async getInvoices(): Promise<InvoiceWithDetails[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          campaigns (
            *,
            advertisers (*)
          ),
          payments (*)
        `);
      if (error) throw error;

      return (data || []).map((inv: any) => {
        const campaign = inv.campaigns;
        const advertiser = campaign ? campaign.advertisers : undefined;
        const payments = inv.payments || [];
        const paidAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const outstanding = Math.max(0, inv.total_amount - paidAmount);

        return {
          ...inv,
          campaign,
          advertiser,
          payments,
          outstanding
        };
      });
    } else {
      const invoices = getLocal<Invoice>(KEYS.INVOICES);
      const campaigns = getLocal<Campaign>(KEYS.CAMPAIGNS);
      const advertisers = getLocal<Advertiser>(KEYS.ADVERTISERS);
      const payments = getLocal<Payment>(KEYS.PAYMENTS);

      return invoices.map(inv => {
        const campaign = campaigns.find(c => c.id === inv.campaign_id);
        const advertiser = campaign ? advertisers.find(a => a.id === campaign.advertiser_id) : undefined;
        const invPayments = payments.filter(p => p.invoice_id === inv.id);
        const paidAmount = invPayments.reduce((sum, p) => sum + p.amount, 0);
        const outstanding = Math.max(0, inv.total_amount - paidAmount);

        return {
          ...inv,
          campaign,
          advertiser,
          payments: invPayments,
          outstanding
        };
      });
    }
  },

  async getPayments(): Promise<Payment[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      return getLocal<Payment>(KEYS.PAYMENTS).sort((a, b) => 
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      );
    }
  },

  async recordPayment(payment: Omit<Payment, 'id' | 'created_at'>, userId: string, userName?: string): Promise<Payment> {
    if (isSupabaseConfigured && supabase) {
      // 1. Insert Payment
      const { data: payData, error: payError } = await supabase
        .from('payments')
        .insert([payment])
        .select()
        .single();
      if (payError) throw payError;

      // 2. Fetch payments for this invoice to update status
      const { data: siblingPayments, error: sibError } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', payment.invoice_id);
      if (sibError) throw sibError;

      const { data: invData, error: invFetchError } = await supabase
        .from('invoices')
        .select('total_amount, due_date')
        .eq('id', payment.invoice_id)
        .single();
      if (invFetchError) throw invFetchError;

      const totalPaid = (siblingPayments || []).reduce((sum, p) => sum + p.amount, 0);
      let newStatus: Invoice['payment_status'] = 'Pending';

      if (totalPaid >= invData.total_amount) {
        newStatus = 'Paid';
      } else if (totalPaid > 0) {
        newStatus = 'Partial';
      } else {
        const isOverdue = new Date(invData.due_date).getTime() < Date.now();
        newStatus = isOverdue ? 'Overdue' : 'Pending';
      }

      // Update Invoice Status
      const { error: updateInvError } = await supabase
        .from('invoices')
        .update({ payment_status: newStatus })
        .eq('id', payment.invoice_id);
      if (updateInvError) throw updateInvError;

      await this.addLog(`Recorded payment of ${payment.amount} (Ref: ${payment.reference_number})`, 'Payment', userId, userName);
      return payData;
    } else {
      const newPay: Payment = {
        ...payment,
        id: 'pay-' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString()
      };

      const payments = getLocal<Payment>(KEYS.PAYMENTS);
      payments.push(newPay);
      setLocal(KEYS.PAYMENTS, payments);

      // Recalculate Invoice Status
      const invoices = getLocal<Invoice>(KEYS.INVOICES);
      const invIndex = invoices.findIndex(i => i.id === payment.invoice_id);
      if (invIndex !== -1) {
        const invoice = invoices[invIndex];
        const allInvPayments = payments.filter(p => p.invoice_id === invoice.id);
        const totalPaid = allInvPayments.reduce((sum, p) => sum + p.amount, 0);

        if (totalPaid >= invoice.total_amount) {
          invoice.payment_status = 'Paid';
        } else if (totalPaid > 0) {
          invoice.payment_status = 'Partial';
        } else {
          const isOverdue = new Date(invoice.due_date).getTime() < Date.now();
          invoice.payment_status = isOverdue ? 'Overdue' : 'Pending';
        }
        
        invoices[invIndex] = invoice;
        setLocal(KEYS.INVOICES, invoices);
      }

      await this.addLog(`Recorded payment of ${payment.amount} (Ref: ${payment.reference_number})`, 'Payment', userId, userName);
      return newPay;
    }
  },

  // --- RECALCULATE ALL INVOICE STATUSES (E.G. MARKING OVERDUE DAILY) ---
  async checkOverdueInvoices(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      // Typically handled via Cron / Database Trigger in Supabase, but we can do a client check
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, total_amount, due_date, payment_status');
      if (error) return;

      for (const inv of invoices) {
        if (inv.payment_status !== 'Paid' && inv.payment_status !== 'Overdue') {
          const isOverdue = new Date(inv.due_date).getTime() < Date.now();
          if (isOverdue) {
            const { data: payData } = await supabase
              .from('payments')
              .select('amount')
              .eq('invoice_id', inv.id);
            const paid = (payData || []).reduce((sum, p) => sum + p.amount, 0);
            
            if (paid < inv.total_amount) {
              await supabase
                .from('invoices')
                .update({ payment_status: paid > 0 ? 'Partial' : 'Overdue' })
                .eq('id', inv.id);
            }
          }
        }
      }
    } else {
      const invoices = getLocal<Invoice>(KEYS.INVOICES);
      const payments = getLocal<Payment>(KEYS.PAYMENTS);
      let changed = false;

      invoices.forEach((inv, index) => {
        if (inv.payment_status !== 'Paid') {
          const isOverdue = new Date(inv.due_date).getTime() < Date.now();
          if (isOverdue) {
            const invPayments = payments.filter(p => p.invoice_id === inv.id);
            const totalPaid = invPayments.reduce((sum, p) => sum + p.amount, 0);
            
            if (totalPaid < inv.total_amount) {
              const expectedStatus = totalPaid > 0 ? 'Partial' : 'Overdue';
              if (inv.payment_status !== expectedStatus) {
                inv.payment_status = expectedStatus;
                invoices[index] = inv;
                changed = true;
              }
            }
          }
        }
      });

      if (changed) {
        setLocal(KEYS.INVOICES, invoices);
      }
    }
  }
};

// Authentication Service Wrapper
export const authService = {
  async getCurrentProfile(): Promise<Profile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) return null;
      return data;
    } else {
      const raw = localStorage.getItem(KEYS.CURRENT_USER);
      return raw ? (JSON.parse(raw) as Profile) : null;
    }
  },

  async login(email: string, password: string): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const profile = await this.getCurrentProfile();
      if (!profile) throw new Error('User profile record not found');
      await dbService.addLog('Logged In Successfully', 'Auth', profile.id, profile.full_name);
      return profile;
    } else {
      // Local Mock Auth Checks
      const profiles = getLocal<Profile>(KEYS.PROFILES);
      const user = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('Invalid email or password');
      }
      // Simulate password check (any password works for demo mock mode)
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      await dbService.addLog('Logged In Successfully (Demo Mode)', 'Auth', user.id, user.full_name);
      return user;
    }
  },

  async register(email: string, fullName: string, role: UserRole): Promise<Profile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'Password123!', // Standard initial password, user can trigger forgot password
        options: {
          data: {
            full_name: fullName,
            role: role
          }
        }
      });
      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed');

      // The profile trigger handles DB insert, let's fetch it
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (pError) throw pError;

      return profile;
    } else {
      const profiles = getLocal<Profile>(KEYS.PROFILES);
      const existing = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        throw new Error('User with this email already exists');
      }

      const newProfile: Profile = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        full_name: fullName,
        email,
        role,
        created_at: new Date().toISOString()
      };

      profiles.push(newProfile);
      setLocal(KEYS.PROFILES, profiles);
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(newProfile));
      await dbService.addLog(`Registered new account: ${fullName}`, 'Auth', newProfile.id, newProfile.full_name);
      return newProfile;
    }
  },

  async logout(): Promise<void> {
    const profile = await this.getCurrentProfile();
    const userId = profile?.id || 'unknown';
    const userName = profile?.full_name || 'User';

    if (isSupabaseConfigured && supabase) {
      await dbService.addLog('Logged Out', 'Auth', userId, userName);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      await dbService.addLog('Logged Out (Demo Mode)', 'Auth', userId, userName);
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  }
};
