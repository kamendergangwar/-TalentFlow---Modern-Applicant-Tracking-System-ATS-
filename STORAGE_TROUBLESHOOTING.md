# Fix "Failed to Upload Resume" Error

## Quick Fix Steps

### Step 1: Create Storage Bucket (If Not Already Done)

1. Go to your Supabase Dashboard
2. Click **"Storage"** in the left sidebar
3. Click **"Create a new bucket"**
4. Enter the following:
   - **Name**: `candidate-files` (must be exactly this)
   - **Public bucket**: Toggle **ON** ✅
   - **File size limit**: 50 MB (or your preference)
   - **Allowed MIME types**: Leave empty for now
5. Click **"Create bucket"**

### Step 2: Verify Bucket is Public

1. Click on the `candidate-files` bucket
2. Look for "Public" badge next to the bucket name
3. If it says "Private", click the bucket settings (3 dots) → **"Make public"**

### Step 3: Add Storage Policies (Option A - UI Method)

1. Click on `candidate-files` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow Upload (INSERT)
- Click **"Create a policy from scratch"**
- **Policy name**: `Anyone can upload candidate files`
- **Allowed operation**: Check **INSERT**
- **Target roles**: Select **public**
- **Policy definition**: Leave as `true`
- Click **"Review"** → **"Save policy"**

#### Policy 2: Allow View (SELECT)
- Click **"New Policy"** again
- **Policy name**: `Anyone can view candidate files`
- **Allowed operation**: Check **SELECT**
- **Target roles**: Select **public**
- **Policy definition**: Leave as `true`
- Click **"Review"** → **"Save policy"**

#### Policy 3: Allow Delete (DELETE)
- Click **"New Policy"** again
- **Policy name**: `Authenticated users can delete files`
- **Allowed operation**: Check **DELETE**
- **Target roles**: Select **authenticated**
- **Policy definition**: Leave as `true`
- Click **"Review"** → **"Save policy"**

### Step 3: Add Storage Policies (Option B - SQL Method)

If the UI method doesn't work, use SQL:

1. Go to **SQL Editor** in Supabase
2. Copy the contents of `supabase_storage_policies.sql`
3. Paste and **Run** the script

### Step 4: Test the Upload

1. Restart your dev server:
   ```bash
   # Press Ctrl+C to stop
   npm run dev
   ```
2. Try uploading a resume again

## Troubleshooting

### Error: "Bucket not found"
- ✅ Verify bucket name is exactly `candidate-files` (no spaces, hyphens only)
- ✅ Check that bucket was created successfully in Storage tab

### Error: "Policy violation" or "Insufficient permissions"
- ✅ Make sure bucket is set to **PUBLIC**
- ✅ Verify all 3 policies are created (check Policies tab)
- ✅ Try deleting and recreating the policies

### Error: "File too large"
- ✅ Check file size limit in bucket settings
- ✅ Default code limit is 5MB, increase if needed

### Error: "Invalid file type"
- ✅ Make sure you're uploading PDF, DOC, or DOCX files
- ✅ Check the file isn't corrupted

## Verify Setup Checklist

Run through this checklist:

- [ ] Storage bucket `candidate-files` exists
- [ ] Bucket is set to **PUBLIC** (not private)
- [ ] INSERT policy exists and allows public uploads
- [ ] SELECT policy exists and allows public downloads
- [ ] DELETE policy exists for authenticated users
- [ ] Dev server was restarted after changes
- [ ] Browser cache was cleared

## Alternative: Manual Policy Creation via SQL

If policies still don't work, try this direct approach:

```sql
-- First, ensure the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'candidate-files';

-- Then create policies using the storage.policies table
-- (This is more reliable than the UI sometimes)
```

## Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try uploading a file
4. Look for error messages - they will show the exact issue
5. Common errors:
   - `Bucket not found` → Create the bucket
   - `new row violates row-level security policy` → Add policies
   - `413 Payload Too Large` → File too big

## Still Not Working?

If you're still having issues:

1. **Check the exact error message** in browser console
2. **Verify your .env file** has correct Supabase credentials
3. **Check Supabase logs**: Dashboard → Logs → Storage
4. **Try a smaller file** (under 1MB) to rule out size issues
5. **Clear browser cache** completely and try again

## Quick Test

To verify storage is working, try this in the browser console:

```javascript
// Test storage connection
const { data, error } = await supabase.storage
  .from('candidate-files')
  .list('resumes');

console.log('Storage test:', { data, error });
// Should return empty array if bucket exists and is accessible
```
