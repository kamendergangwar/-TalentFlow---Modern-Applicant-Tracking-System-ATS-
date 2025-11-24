-- ============================================
-- Storage Bucket Setup for candidate-files
-- ============================================
-- NOTE: Storage policies CANNOT be created via SQL in Supabase
-- You MUST use the Supabase Dashboard UI to create storage policies
-- 
-- Follow these steps instead:

-- Step 1: Create the bucket (if not already created)
-- Go to Storage in Supabase Dashboard
-- Click "Create a new bucket"
-- Name: candidate-files
-- Public: YES (toggle ON)
-- Click "Create bucket"

-- Step 2: Make sure bucket is public
-- Run this SQL to ensure bucket is public:
UPDATE storage.buckets 
SET public = true 
WHERE id = 'candidate-files';

-- Step 3: Add policies via UI
-- Click on the 'candidate-files' bucket
-- Go to "Policies" tab
-- Click "New Policy"

-- Policy 1: Allow Upload
-- - Click "Create a policy from scratch"
-- - Policy name: Allow public uploads
-- - Allowed operation: INSERT
-- - Target roles: public
-- - Policy definition: true
-- - Save

-- Policy 2: Allow View/Download
-- - Click "New Policy"
-- - Policy name: Allow public access
-- - Allowed operation: SELECT
-- - Target roles: public
-- - Policy definition: true
-- - Save

-- Policy 3: Allow Delete (authenticated users only)
-- - Click "New Policy"
-- - Policy name: Allow authenticated delete
-- - Allowed operation: DELETE
-- - Target roles: authenticated
-- - Policy definition: true
-- - Save

-- Step 4: Verify
-- After creating policies, try uploading a file through your app
