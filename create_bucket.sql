-- Create the bucket
insert into storage.buckets (id, name, public)
values ('company-assets', 'company-assets', true);

-- Allow public access to view files (logos need to be public)
create policy "Public Access Company Assets"
  on storage.objects for select
  using ( bucket_id = 'company-assets' );

-- Allow authenticated users to upload files
create policy "Authenticated Upload Company Assets"
  on storage.objects for insert
  with check ( bucket_id = 'company-assets' and auth.role() = 'authenticated' );

-- Allow users to update their own files (optional, but good practice)
create policy "Authenticated Update Company Assets"
  on storage.objects for update
  using ( bucket_id = 'company-assets' and auth.role() = 'authenticated' );
