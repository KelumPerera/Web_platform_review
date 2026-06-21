-- SQL script to create Supabase Storage bucket and RLS policy

-- 1. Create a public bucket for portfolio media
-- Ensure 'public' is the desired access level. Adjust if 'private' is needed with pre-signed URLs.
insert into storage
.buckets (id, name, owner)
values ('portfolio-media', 'portfolio-media', auth.uid())
on conflict do nothing; -- If the bucket already exists, do nothing

-- 2. Create an RLS policy for the 'portfolio_items' table to control uploads
-- This policy ensures that only the authenticated owner of the profile can upload to their own media folder.
-- IMPORTANT: This policy assumes your 'portfolio_items' table has a 'profile_id' column
-- that links to the 'profiles' table, and 'profiles' table has an 'id' column
-- that matches auth.uid(). This is consistent with the schema we previously defined.

-- First, ensure RLS is enabled for portfolio_items table (should already be done)
alter table portfolio_items enable row level security;

-- Create a policy for INSERT operations on storage.objects
-- This policy grants INSERT permission to objects where the path starts with 'portfolio-media/{auth.uid()}/'
-- The 'name' column in storage.objects is the full path within the bucket.
-- Example: name = 'f47ac10b-58cc-4372-a567-0e02b2c3d479/my-image.jpg'
-- The policy checks if the object name starts with the user's UUID, ensuring they can only upload to their designated folder.
create policy "Allow authenticated users to upload to their own media folder"
on storage.objects for insert
to authenticated
with check (
    bucket_name = 'portfolio-media' AND
    name like (auth.uid() || '/%')
);

-- Note: You might also need a SELECT policy on storage.objects if you intend to list/read files,
-- but for just uploading, the INSERT policy is primary.
-- For example, to allow anyone to read files (if the bucket is public):
-- create policy "Allow public read access to portfolio media"
-- on storage.objects for select using (bucket_name = 'portfolio-media');
-- This is already covered by the bucket being public, but explicit policies are good practice.

-- If you need to restrict read access to only the owner:
-- create policy "Allow owner to read their portfolio media"
-- on storage.objects for select using (bucket_name = 'portfolio-media' AND name LIKE (auth.uid() || '/%'));

-- To enable the policy, you may need to refresh your Supabase client connection or tokens.
