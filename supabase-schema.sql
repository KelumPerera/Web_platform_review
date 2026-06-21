-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (One per registered creator)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text not null,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint username_length check (char_length(username) >= 3)
);

-- 2. PORTFOLIO ITEMS TABLE (Products, services, projects)
create table portfolio_items (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  media_url text, -- Image or Video URL hosted on Cloudinary/Supabase Storage
  media_type text check (media_type in ('image', 'video')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. COMMENTS TABLE (Public feedback)
create table comments (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references portfolio_items(id) on delete cascade not null,
  author_name text default 'Anonymous' not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. LIKES TABLE (Anonymized interactions)
create table likes (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references portfolio_items(id) on delete cascade not null,
  visitor_hash text not null, -- SHA-256 hash of IP + user agent or local session identifier
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_item_visitor_like unique(item_id, visitor_hash)
);

-- Create highly-performant indexes for fast public lookups by username
create index idx_profiles_username on profiles(username);
create index idx_portfolio_items_profile on portfolio_items(profile_id);
create index idx_comments_item on comments(item_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ==========================================

alter table profiles enable row level security;
alter table portfolio_items enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);

-- Portfolio Items Policies
create policy "Portfolio items are viewable by everyone" on portfolio_items for select using (true);
create policy "Users can insert their own portfolio items" on portfolio_items for insert with check (auth.uid() = profile_id);
create policy "Users can update their own portfolio items" on portfolio_items for update using (auth.uid() = profile_id);
create policy "Users can delete their own portfolio items" on portfolio_items for delete using (auth.uid() = profile_id);

-- Comments Policies (Public can read & write, nobody can edit/delete)
create policy "Comments are viewable by everyone" on comments for select using (true);
create policy "Anyone can leave a comment" on comments for insert with check (true);

-- Likes Policies (Public can view counts and cast votes)
create policy "Likes are viewable by everyone" on likes for select using (true);
create policy "Anyone can cast a like" on likes for insert with check (true);
