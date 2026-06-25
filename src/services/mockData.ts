import { Advertiser, Campaign, Invoice, Payment, ActivityLog, Profile } from '../types';

export const mockProfiles: Profile[] = [
  {
    id: 'user-admin',
    full_name: 'Sarah Jenkins',
    email: 'admin@telanganatoday.com',
    role: 'Admin',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-manager',
    full_name: 'Robert Chen',
    email: 'manager@telanganatoday.com',
    role: 'Manager',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'user-staff',
    full_name: 'Emily Davis',
    email: 'staff@telanganatoday.com',
    role: 'Staff',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const mockAdvertisers: Advertiser[] = [
  {
    id: 'adv-1',
    company_name: 'Apex Digital Solutions',
    contact_person: 'John Miller',
    email: 'john.miller@apex.com',
    phone: '+1 (555) 019-2834',
    address: '100 Innovation Way, Suite 400, Boston, MA',
    gst_number: '27AAAAA1111A1Z1',
    notes: 'Premium partner. Prefers digital and print banners.',
    status: 'Active',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'adv-2',
    company_name: 'Vanguard Realty Group',
    contact_person: 'Clarissa Vance',
    email: 'billing@vanguardrealty.com',
    phone: '+1 (555) 014-9922',
    address: '450 Skyline Blvd, San Francisco, CA',
    gst_number: '06BBBBB2222B2Z2',
    notes: 'High-volume seasonal campaigns (Spring/Autumn).',
    status: 'Active',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'adv-3',
    company_name: 'BioHealth Products Corp',
    contact_person: 'Dr. Alan Grant',
    email: 'a.grant@biohealth.org',
    phone: '+1 (555) 012-3847',
    address: '89 Research Parkway, Boston, MA',
    gst_number: '09CCCCC3333C3Z3',
    notes: 'Requires detailed invoice copies for corporate audit.',
    status: 'Active',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'adv-4',
    company_name: 'Starlight Cinema & Entertainment',
    contact_person: 'Marcus Brody',
    email: 'm.brody@starlight.com',
    phone: '+1 (555) 017-8899',
    address: '12 Hollywood Court, Los Angeles, CA',
    gst_number: '05DDDDD4444D4Z4',
    notes: 'Inactive since winter. Re-engaging for summer blockbusters.',
    status: 'Inactive',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

// Helper to construct ISO dates relative to now
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    advertiser_id: 'adv-1',
    campaign_name: 'Summer Tech Blowout',
    ad_type: 'Digital',
    start_date: daysAgo(15),
    end_date: daysFromNow(45), // Active, plenty of time
    insertions: 12,
    billing_amount: 15000,
    status: 'Active',
    created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-2',
    advertiser_id: 'adv-2',
    campaign_name: 'Luxury Homes Fall Showcase',
    ad_type: 'Print',
    start_date: daysFromNow(20),
    end_date: daysFromNow(50), // Scheduled
    insertions: 6,
    billing_amount: 8000,
    status: 'Scheduled',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-3',
    advertiser_id: 'adv-3',
    campaign_name: 'BioShield Supplement Launch',
    ad_type: 'Radio',
    start_date: daysAgo(25),
    end_date: daysFromNow(5), // Expiring in 5 days (Orange Alert - <= 7 days)
    insertions: 24,
    billing_amount: 24000,
    status: 'Active',
    created_at: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-4',
    advertiser_id: 'adv-1',
    campaign_name: 'Spring Clearance Promotion',
    ad_type: 'OOH',
    start_date: daysAgo(60),
    end_date: daysAgo(10), // Expired
    insertions: 8,
    billing_amount: 12500,
    status: 'Expired',
    created_at: new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-5',
    advertiser_id: 'adv-3',
    campaign_name: 'Immune Boost Campaign',
    ad_type: 'Digital',
    start_date: daysAgo(40),
    end_date: daysAgo(5), // Completed
    insertions: 15,
    billing_amount: 9500,
    status: 'Completed',
    created_at: new Date(Date.now() - 41 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-6',
    advertiser_id: 'adv-2',
    campaign_name: 'Skyline Penthouse Launch',
    ad_type: 'Print',
    start_date: daysAgo(10),
    end_date: daysFromNow(12), // Expiring in 12 days (Yellow Alert - <= 15 days)
    insertions: 10,
    billing_amount: 18000,
    status: 'Active',
    created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'camp-7',
    advertiser_id: 'adv-1',
    campaign_name: 'Cyber Monday Deals Info',
    ad_type: 'Digital',
    start_date: daysAgo(5),
    end_date: daysFromNow(26), // Expiring in 26 days (Green Alert - <= 30 days)
    insertions: 30,
    billing_amount: 30000,
    status: 'Active',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    campaign_id: 'camp-1',
    invoice_number: 'INV-2026-001',
    amount: 15000,
    gst: 2700, // 18% GST
    total_amount: 17700,
    due_date: daysFromNow(15),
    payment_status: 'Pending',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv-2',
    campaign_id: 'camp-3',
    invoice_number: 'INV-2026-002',
    amount: 24000,
    gst: 4320,
    total_amount: 28320,
    due_date: daysAgo(5), // Overdue
    payment_status: 'Partial',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv-3',
    campaign_id: 'camp-4',
    invoice_number: 'INV-2026-003',
    amount: 12500,
    gst: 2250,
    total_amount: 14750,
    due_date: daysAgo(30),
    payment_status: 'Paid',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv-4',
    campaign_id: 'camp-5',
    invoice_number: 'INV-2026-004',
    amount: 9500,
    gst: 1710,
    total_amount: 11210,
    due_date: daysAgo(10),
    payment_status: 'Paid',
    created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv-5',
    campaign_id: 'camp-6',
    invoice_number: 'INV-2026-005',
    amount: 18000,
    gst: 3240,
    total_amount: 21240,
    due_date: daysFromNow(2),
    payment_status: 'Pending',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'inv-6',
    campaign_id: 'camp-7',
    invoice_number: 'INV-2026-006',
    amount: 30000,
    gst: 5400,
    total_amount: 35400,
    due_date: daysFromNow(20),
    payment_status: 'Pending',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const mockPayments: Payment[] = [
  {
    id: 'pay-1',
    invoice_id: 'inv-2',
    amount: 10000,
    payment_method: 'Bank Transfer',
    reference_number: 'TXN987654321',
    payment_date: daysAgo(12),
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pay-2',
    invoice_id: 'inv-3',
    amount: 14750,
    payment_method: 'UPI',
    reference_number: 'pay_UPI_556812',
    payment_date: daysAgo(35),
    created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'pay-3',
    invoice_id: 'inv-4',
    amount: 11210,
    payment_method: 'Cheque',
    reference_number: 'CHQ0004561',
    payment_date: daysAgo(15),
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

export const mockLogs: ActivityLog[] = [
  {
    id: 'log-1',
    user_id: 'user-admin',
    user_name: 'Sarah Jenkins',
    action: 'User Registered and Setup Profile',
    module: 'Auth',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-2',
    user_id: 'user-admin',
    user_name: 'Sarah Jenkins',
    action: 'Created Advertiser: Apex Digital Solutions',
    module: 'Advertiser',
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-3',
    user_id: 'user-manager',
    user_name: 'Robert Chen',
    action: 'Created Campaign: Summer Tech Blowout',
    module: 'Campaign',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-4',
    user_id: 'user-staff',
    user_name: 'Emily Davis',
    action: 'Recorded Payment of ₹10,000 for INV-2026-002',
    module: 'Payment',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  }
];
