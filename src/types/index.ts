export type UserRole = 'Admin' | 'Manager' | 'Staff';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Advertiser {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  gst_number: string;
  notes: string;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface Campaign {
  id: string;
  advertiser_id: string;
  campaign_name: string;
  ad_type: 'Digital' | 'Print' | 'Radio' | 'OOH' | 'TV';
  start_date: string;
  end_date: string;
  insertions: number;
  billing_amount: number;
  status: 'Active' | 'Scheduled' | 'Completed' | 'Expired';
  created_at: string;
}

export interface Invoice {
  id: string;
  campaign_id: string;
  invoice_number: string;
  amount: number;
  gst: number;
  total_amount: number;
  due_date: string;
  payment_status: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: 'UPI' | 'Cash' | 'Bank Transfer' | 'Cheque';
  reference_number: string;
  payment_date: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name?: string;
  action: string;
  module: 'Auth' | 'Advertiser' | 'Campaign' | 'Billing' | 'Payment' | 'System';
  created_at: string;
}

// Joined interfaces for lists & dashboard UI
export interface CampaignWithAdvertiser extends Campaign {
  advertiser?: Advertiser;
}

export interface InvoiceWithDetails extends Invoice {
  campaign?: Campaign;
  advertiser?: Advertiser;
  payments?: Payment[];
  outstanding?: number;
}
