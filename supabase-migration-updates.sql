-- Drop old tables if they exist
drop table if exists review_comments cascade;
drop table if exists review_upvotes cascade;
drop table if exists reviews cascade;
drop table if exists product_updates cascade;

-- ALTER portfolio_items to match new naming
alter table portfolio_items add column if not exists is_product boolean default false;
alter table portfolio_items add column if not exists demo_url text;
alter table portfolio_items add column if not exists github_url text;
alter table portfolio_items add column if not exists test_scenario_url text;
alter table portfolio_items add column if not exists upvotes_count integer default 0;

-- CREATE project_changelogs table
create table if not exists project_changelogs (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references portfolio_items(id) on delete cascade not null,
  title text not null,
  change_type text check (change_type in ('feature', 'fix', 'improvement')),
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CREATE review_reports table
create table if not exists review_reports (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references portfolio_items(id) on delete cascade not null,
  reviewer_name text not null,
  rating integer check (rating >= 1 and rating <= 5),
  summary text not null,
  error_logs text,
  screenshot_urls text[], -- Array of uploaded image links
  upvotes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CREATE review_upvotes table (to track visitor-level upvotes dynamically)
create table if not exists review_upvotes (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references review_reports(id) on delete cascade not null,
  visitor_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_review_report_visitor unique(review_id, visitor_hash)
);

-- CREATE review_comments table (to support discussions on reviews)
create table if not exists review_comments (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references review_reports(id) on delete cascade not null,
  author_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_review_reports_item on review_reports(item_id);
create index if not exists idx_review_upvotes_report on review_upvotes(review_id);
create index if not exists idx_review_comments_report on review_comments(review_id);
create index if not exists idx_project_changelogs_item on project_changelogs(item_id);

-- Enable RLS
alter table review_reports enable row level security;
alter table review_upvotes enable row level security;
alter table review_comments enable row level security;
alter table project_changelogs enable row level security;

-- RLS Policies
drop policy if exists "Review reports are viewable by everyone" on review_reports;
create policy "Review reports are viewable by everyone" on review_reports for select using (true);

drop policy if exists "Anyone can leave a review report" on review_reports;
create policy "Anyone can leave a review report" on review_reports for insert with check (true);

drop policy if exists "Review upvotes are viewable by everyone" on review_upvotes;
create policy "Review upvotes are viewable by everyone" on review_upvotes for select using (true);

drop policy if exists "Anyone can upvote a review report" on review_upvotes;
create policy "Anyone can upvote a review report" on review_upvotes for insert with check (true);

drop policy if exists "Review comments are viewable by everyone" on review_comments;
create policy "Review comments are viewable by everyone" on review_comments for select using (true);

drop policy if exists "Anyone can comment on a review report" on review_comments;
create policy "Anyone can comment on a review report" on review_comments for insert with check (true);

drop policy if exists "Project changelogs are viewable by everyone" on project_changelogs;
create policy "Project changelogs are viewable by everyone" on project_changelogs for select using (true);

drop policy if exists "Creators can manage project changelogs" on project_changelogs;
create policy "Creators can manage project changelogs" on project_changelogs 
  for all using (
    exists (
      select 1 from portfolio_items
      where portfolio_items.id = project_changelogs.item_id 
      and portfolio_items.profile_id = auth.uid()
    )
  );

-- Add Category and Tags columns to portfolio_items
alter table portfolio_items add column if not exists category text;
alter table portfolio_items add column if not exists tags text;

-- B2B Tech Marketplace Additions
alter table profiles add column if not exists expert_fee numeric default 0;
alter table profiles add column if not exists reputation_score integer default 0;

-- escrow_bounties table
create table if not exists escrow_bounties (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references portfolio_items(id) on delete cascade not null,
  pledge_amount numeric not null,
  processor_type text check (processor_type in ('stripe', 'paypal')) default 'stripe',
  status text check (status in ('escrow', 'paid', 'refunded')) default 'escrow',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alter review_reports for Specs & Bounty rewards
alter table review_reports add column if not exists test_passed boolean default true;
alter table review_reports add column if not exists reward_paid boolean default false;
alter table review_reports add column if not exists specs_os text;
alter table review_reports add column if not exists specs_browser text;
alter table review_reports add column if not exists specs_resolution text;
alter table review_reports add column if not exists downvotes integer default 0;

-- review_downvotes table
create table if not exists review_downvotes (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references review_reports(id) on delete cascade not null,
  visitor_hash text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint unique_review_report_downvote unique(review_id, visitor_hash)
);

-- Enable RLS on new tables
alter table escrow_bounties enable row level security;
alter table review_downvotes enable row level security;

-- Policies for escrow_bounties
drop policy if exists "Escrow bounties are viewable by everyone" on escrow_bounties;
create policy "Escrow bounties are viewable by everyone" on escrow_bounties for select using (true);

drop policy if exists "Creators can manage their escrow bounties" on escrow_bounties;
create policy "Creators can manage their escrow bounties" on escrow_bounties 
  for all using (
    exists (
      select 1 from portfolio_items
      where portfolio_items.id = escrow_bounties.item_id
      and portfolio_items.profile_id = auth.uid()
    )
  );

-- Policies for review_downvotes
drop policy if exists "Review downvotes are viewable by everyone" on review_downvotes;
create policy "Review downvotes are viewable by everyone" on review_downvotes for select using (true);

drop policy if exists "Anyone can downvote a review report" on review_downvotes;
create policy "Anyone can downvote a review report" on review_downvotes for insert with check (true);

-- Uptime Status and Analytics Additions
alter table portfolio_items add column if not exists uptime_status text check (uptime_status in ('operational', 'downtime', 'unknown')) default 'unknown';
alter table portfolio_items add column if not exists last_pinged_at timestamp with time zone;

create table if not exists item_analytics (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references portfolio_items(id) on delete cascade not null,
  metric_type text check (metric_type in ('demo_click', 'repo_click', 'page_view')) not null,
  visitor_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table item_analytics enable row level security;

-- Policies for item_analytics
drop policy if exists "Item analytics are viewable by everyone" on item_analytics;
create policy "Item analytics are viewable by everyone" on item_analytics for select using (true);

drop policy if exists "Anyone can log an analytics event" on item_analytics;
create policy "Anyone can log an analytics event" on item_analytics for insert with check (true);

-- Enable pg_trgm extension to support GIN indexes on text columns for wildcard search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a GIN index to make tag scans instantly fast on the multi-column layout grid using trigrams
CREATE INDEX IF NOT EXISTS idx_portfolio_items_tags_gin ON portfolio_items USING gin (tags gin_trgm_ops);

-- Secure escrow payout release transaction function using row-level locking (SELECT FOR UPDATE)
CREATE OR REPLACE FUNCTION public.release_bounty_escrow(
  target_report_id UUID,
  target_bounty_id UUID,
  expected_reviewer_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_bounty_status TEXT;
  current_reward_flag BOOLEAN;
BEGIN
  -- 1. Explicitly acquire exclusive row-level write locks via SELECT FOR UPDATE
  SELECT status INTO current_bounty_status
  FROM escrow_bounties
  WHERE id = target_bounty_id
  FOR UPDATE;

  SELECT reward_paid INTO current_reward_flag
  FROM review_reports
  WHERE id = target_report_id
  FOR UPDATE;

  -- 2. Validate transaction boundary expectations
  IF current_bounty_status != 'escrow' THEN
    RAISE EXCEPTION 'Bounty allocation state is invalid: %', current_bounty_status;
  END IF;

  IF current_reward_flag = TRUE THEN
    RAISE EXCEPTION 'Review report milestone is already paid out.';
  END IF;

  -- 3. Execute atomic state changes
  UPDATE escrow_bounties
  SET status = 'paid'
  WHERE id = target_bounty_id;

  UPDATE review_reports
  SET reward_paid = TRUE
  WHERE id = target_report_id;

  -- 4. Scale reviewer profile rank / metrics reputation ledger scores
  UPDATE profiles
  SET reputation_score = reputation_score + 100
  WHERE id = expected_reviewer_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- PostGreSQL handles rolling back the state naturally if an error is encountered
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Automated trigger function to delete storage assets when a product is deleted
create or replace function public.handle_deleted_portfolio_media()
returns trigger as $$
begin
  delete from storage.objects 
  where bucket_id = 'portfolio-media' 
  and (storage.foldername(name))[1] = old.profile_id::text;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists on_portfolio_item_deleted on public.portfolio_items;
create trigger on_portfolio_item_deleted
  before delete on public.portfolio_items
  for each row execute function public.handle_deleted_portfolio_media();





