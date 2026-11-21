-- CarryGo Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null default 'CarryGo User',
  phone text default '',
  avatar_url text,
  wallet_balance numeric(10, 2) not null default 120.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on new auth user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, wallet_balance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'CarryGo Sender'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    120.00
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Saved Addresses Table
create table if not exists public.saved_addresses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  label text not null, -- e.g., 'Home', 'Office', 'Shop'
  address_line text not null,
  latitude double precision not null,
  longitude double precision not null,
  contact_name text,
  contact_phone text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.saved_addresses enable row level security;

create policy "Users manage own saved addresses"
  on public.saved_addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Payment Methods Table
create table if not exists public.payment_methods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('momo', 'card', 'wallet', 'cash_pickup', 'cash_delivery')),
  provider text not null, -- e.g. 'MTN MoMo', 'Telecel Cash', 'Visa', 'CarryGo Wallet'
  label text not null,
  masked_details text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.payment_methods enable row level security;

create policy "Users manage own payment methods"
  on public.payment_methods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Delivery Orders Table
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  tracking_code text not null unique,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'searching' check (
    status in ('searching', 'assigned', 'arriving_pickup', 'picked_up', 'in_transit', 'delivered', 'cancelled')
  ),
  vehicle_tier text not null check (vehicle_tier in ('bike', 'car')),
  pickup_address text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_address text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  distance_km numeric(8, 2) not null,
  eta_minutes integer not null,
  parcel_size text not null check (parcel_size in ('envelope', 'small_box', 'medium_parcel', 'bulky_bag')),
  parcel_description text not null default '',
  is_fragile boolean not null default false,
  handling_notes text default '',
  recipient_name text not null,
  recipient_phone text not null,
  delivery_pin text not null,
  payment_method text not null,
  promo_code text,
  base_fare numeric(10, 2) not null,
  distance_fare numeric(10, 2) not null,
  handling_fee numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0,
  total_fare numeric(10, 2) not null,
  driver_name text,
  driver_phone text,
  driver_rating numeric(3, 2),
  driver_vehicle text,
  driver_plate text,
  driver_lat double precision,
  driver_lng double precision,
  proof_of_delivery_note text,
  rating integer check (rating >= 1 and rating <= 5),
  rating_comment text,
  tip_amount numeric(10, 2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delivered_at timestamptz
);

alter table public.orders enable row level security;

create policy "Users manage own orders"
  on public.orders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Order Chat Messages Table
create table if not exists public.order_messages (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sender_role text not null check (sender_role in ('user', 'driver', 'system')),
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.order_messages enable row level security;

create policy "Users manage messages for own orders"
  on public.order_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Enable Realtime for orders & messages
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_messages;
