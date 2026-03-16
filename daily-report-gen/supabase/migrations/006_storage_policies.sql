-- Storage bucket policies (run after creating 'documents' bucket in Supabase dashboard)

-- Allow users to upload to their own folder
create policy "users_upload_own_files" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- Allow users to read their own files
create policy "users_read_own_files" on storage.objects
  for select using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

-- Allow users to delete their own files
create policy "users_delete_own_files" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[2]
  );
