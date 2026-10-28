-- Upload limits enforced by Supabase Storage itself (the app also checks them).
-- 25 MB per file; only photos, videos and PDFs. Safe to re-run.
update storage.buckets
set file_size_limit = 26214400,
    allowed_mime_types = array['image/*', 'video/*', 'application/pdf']
where id = 'service-evidence';

-- Technician WhatsApp numbers are set directly in the database, not stored in the repo.
