-- AdBook Chronicle – Advertiser Billing Management System
-- Supabase Schema Initialization SQL Script

-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- Create Enum type for User Role
create type user_role as enum ('Admin', 'Manager', 'Staff');

-- Create Enum type for Advertiser Status
create type advertiser_status as enum ('Active', 'Inactive');

-- Create Enum type for Campaign Status
create type campaign_status as enum ('Active', 'Scheduled', 'Completed', 'Expired');

-- Create Enum type for Ad Medium
create type ad_medium as enum ('Digital', 'Print', 'Radio', 'OOH', 'TV');

-- Create Enum type for Invoice Payment Status
create type payment_status as enum ('Paid', 'Pending', 'Overdue', 'Partial');

-- Create Enum type for Payment Method
create type payment_method as enum ('UPI', 'Cash', 'Bank Transfer', 'Cheque');

-- 1. PROFILES TABLE (Associated with Supabase auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text not null,
    email text not null,
    role user_role not null default 'Staff',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- 2. ADVERTISERS TABLE
create table public.advertisers (
    id uuid default gen_random_uuid() primary key,
    company_name text not null,
    contact_person text not null,
    email text not null,
    phone text not null,
    address text,
    gst_number text,
    notes text,
    status advertiser_status not null default 'Active',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for advertisers
alter table public.advertisers enable row level security;

-- 3. CAMPAIGNS TABLE
create table public.campaigns (
    id uuid default gen_random_uuid() primary key,
    advertiser_id uuid references public.advertisers(id) on delete cascade not null,
    campaign_name text not null,
    ad_type ad_medium not null default 'Digital',
    start_date date not null,
    end_date date not null,
    insertions integer not null check (insertions > 0),
    billing_amount numeric(12, 2) not null check (billing_amount >= 0),
    status campaign_status not null default 'Scheduled',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for campaigns
alter table public.campaigns enable row level security;

-- 4. INVOICES TABLE
create table public.invoices (
    id uuid default gen_random_uuid() primary key,
    campaign_id uuid references public.campaigns(id) on delete cascade not null,
    invoice_number text not null unique,
    amount numeric(12, 2) not null,
    gst numeric(12, 2) not null,
    total_amount numeric(12, 2) not null,
    due_date date not null,
    payment_status payment_status not null default 'Pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for invoices
alter table public.invoices enable row level security;

-- 5. PAYMENTS TABLE
create table public.payments (
    id uuid default gen_random_uuid() primary key,
    invoice_id uuid references public.invoices(id) on delete cascade not null,
    amount numeric(12, 2) not null check (amount > 0),
    payment_method payment_method not null default 'UPI',
    reference_number text not null,
    payment_date date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for payments
alter table public.payments enable row level security;

-- 6. ACTIVITY LOGS TABLE
create table public.activity_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete set null,
    action text not null,
    module text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for activity logs
alter table public.activity_logs enable row level security;


-- --- TRIGGERS FOR USER PROFILE AUTO GENERATION ---

-- Function to handle new user registration in Supabase auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Staff'),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'Staff'::user_role)
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute handler when a user signs up
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- --- ROW LEVEL SECURITY (RLS) POLICIES ---

-- Staff, Managers, and Admins can READ all tables
create policy "Allow all logged in users to read profiles"
  on public.profiles for select using (auth.role() = 'authenticated');

create policy "Allow all logged in users to read advertisers"
  on public.advertisers for select using (auth.role() = 'authenticated');

create policy "Allow all logged in users to read campaigns"
  on public.campaigns for select using (auth.role() = 'authenticated');

create policy "Allow all logged in users to read invoices"
  on public.invoices for select using (auth.role() = 'authenticated');

create policy "Allow all logged in users to read payments"
  on public.payments for select using (auth.role() = 'authenticated');

create policy "Allow all logged in users to read activity logs"
  on public.activity_logs for select using (auth.role() = 'authenticated');


-- Only Admins can modify Profiles roles
create policy "Allow admins full control on profiles"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'Admin'
    )
  );

-- Staff, Managers, and Admins can INSERT activity logs
create policy "Allow users to write activity logs"
  on public.activity_logs for insert
  with check (auth.role() = 'authenticated');


-- --- ROLE-BASED MUTATION POLICIES (ADVERTISERS & CAMPAIGNS) ---

-- Create/Edit Advertisers: Admin and Manager
create policy "Allow managers and admins to write advertisers"
  on public.advertisers for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('Admin', 'Manager')
    )
  );

create policy "Allow managers and admins to update advertisers"
  on public.advertisers for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('Admin', 'Manager')
    )
  );

-- Delete Advertisers: ONLY Admin
create policy "Allow only admins to delete advertisers"
  on public.advertisers for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'Admin'
    )
  );


-- Create/Edit Campaigns: Admin and Manager
create policy "Allow managers and admins to write campaigns"
  on public.campaigns for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('Admin', 'Manager')
    )
  );

create policy "Allow managers and admins to update campaigns"
  on public.campaigns for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('Admin', 'Manager')
    )
  );

-- Delete Campaigns: ONLY Admin
create policy "Allow only admins to delete campaigns"
  on public.campaigns for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'Admin'
    )
  );


-- --- INVOICES & PAYMENTS MODIFICATIONS ---

-- Invoices: Autogenerated or written by Managers and Admins
create policy "Allow managers and admins to write invoices"
  on public.invoices for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('Admin', 'Manager')
    )
  );

create policy "Allow managers and admins to update invoices"
  on public.invoices for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('Admin', 'Manager')
    )
  );

-- Payments: Recorded by Staff, Managers, and Admins
create policy "Allow authenticated users to write payments"
  on public.payments for insert
  with check (auth.role() = 'authenticated');
