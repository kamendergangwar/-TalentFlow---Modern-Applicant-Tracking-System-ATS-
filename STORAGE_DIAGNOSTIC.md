# Storage Upload Diagnostic Checklist

## ✅ Things to Verify in Supabase Dashboard

### 1. Check Storage Bucket Exists
- Go to **Storage** in Supabase Dashboard
- Look for bucket named `candidate-files`
- ✅ If it exists, proceed to step 2
- ❌ If not, create it:
  - Click "Create a new bucket"
  - Name: `candidate-files`
  - **Public bucket: Toggle ON** ✅
  - Click "Create bucket"

### 2. Verify Bucket is Public
- Click on `candidate-files` bucket
- Look for "Public" badge next to bucket name
- ✅ If it says "Public", proceed to step 3
- ❌ If it says "Private":
  - Click the 3 dots menu → "Edit bucket"
  - Toggle "Public bucket" to ON
  - Save

### 3. Check Storage Policies
- Click on `candidate-files` bucket
- Go to "Policies" tab
- You should see at least 2 policies:
  - One for INSERT (upload)
  - One for SELECT (view/download)

#### If No Policies Exist:

**Policy 1: Allow Upload**
- Click "New Policy"
- Click "For full customization"
- Policy name: `Public upload access`
- Allowed operation: **INSERT** ✅
- Policy definition (switch to custom if needed):
  ```
  true
  ```
- Save

**Policy 2: Allow View**
- Click "New Policy"
- Policy name: `Public read access`
- Allowed operation: **SELECT** ✅
- Policy definition:
  ```
  true
  ```
- Save

### 4. Test in Browser Console

Open your browser console (F12) and run this test:

```javascript
// Test 1: Check if Supabase client is initialized
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has Key:', !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

// Test 2: Try to list files in bucket (should work even if empty)
const { data, error } = await supabase.storage
  .from('candidate-files')
  .list('resumes');

console.log('Storage test result:', { data, error });

// Expected results:
// - data: [] (empty array) or list of files
// - error: null

// If error exists, it will tell you what's wrong:
// - "Bucket not found" → Create the bucket
// - "new row violates row-level security policy" → Add policies
```

### 5. Try Upload with Better Error Logging

After verifying the above, try uploading a resume. Watch the browser console for errors.

Common errors and solutions:

| Error Message | Solution |
|--------------|----------|
| `Bucket not found` | Create `candidate-files` bucket |
| `new row violates row-level security policy` | Add INSERT policy |
| `The resource already exists` | File with same name exists, try different file |
| `413 Payload Too Large` | File is too big (max 5MB in code) |
| `Invalid file type` | Only PDF, DOC, DOCX allowed |

### 6. Current .env Configuration

Your `.env` file should have:
```
VITE_SUPABASE_URL=https://lksawoewvvaqvfdznspj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ This is now correctly configured!

### 7. Next Steps

1. ✅ Dev server restarted (done)
2. ⏳ Verify bucket exists and is public
3. ⏳ Verify policies exist
4. ⏳ Try upload again
5. ⏳ Check browser console for specific error

## Quick Debug Commands

Run these in browser console while on the app:

```javascript
// Check environment variables
console.log({
  url: import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
});

// Test storage connection
const testStorage = async () => {
  const { data, error } = await supabase.storage.listBuckets();
  console.log('Buckets:', data, error);
};
testStorage();
```

---

**After completing the checklist above, try uploading a resume and let me know:**
1. What happens (success or error)?
2. What error message appears in the console (if any)?
3. What step in the checklist failed (if any)?
