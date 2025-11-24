# TalentFlow ATS - Supabase Setup Guide

## Step 1: Create New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in the details:
   - **Name**: TalentFlow-ATS (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is sufficient for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click **"Settings"** (gear icon in sidebar)
2. Click **"API"** in the settings menu
3. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Update Your .env File

1. Open `d:\ATSAPP\ApplicanrtalentSystem\.env`
2. Replace with your new credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the file

## Step 4: Run the Database Schema

1. In your Supabase dashboard, click **"SQL Editor"** in the sidebar
2. Click **"New query"**
3. Open the file `supabase_complete_schema.sql` from your project
4. Copy the **entire contents** of that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see "Success. No rows returned" - this is correct!

## Step 5: Create Storage Bucket

1. In Supabase dashboard, click **"Storage"** in the sidebar
2. Click **"Create a new bucket"**
3. Enter details:
   - **Name**: `candidate-files`
   - **Public bucket**: Toggle ON (make it public)
4. Click **"Create bucket"**

## Step 6: Add Storage Policies

1. Click on the `candidate-files` bucket you just created
2. Go to the **"Policies"** tab
3. Click **"New Policy"**

### Policy 1: Upload Files
- **Policy name**: Anyone can upload candidate files
- **Allowed operation**: INSERT
- **Target roles**: public
- **USING expression**: Leave empty
- **WITH CHECK expression**: `bucket_id = 'candidate-files'`
- Click **"Review"** then **"Save policy"**

### Policy 2: View Files
- Click **"New Policy"** again
- **Policy name**: Anyone can view candidate files
- **Allowed operation**: SELECT
- **Target roles**: public
- **USING expression**: `bucket_id = 'candidate-files'`
- Click **"Review"** then **"Save policy"**

### Policy 3: Delete Files
- Click **"New Policy"** again
- **Policy name**: Authenticated users can delete files
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **USING expression**: `bucket_id = 'candidate-files'`
- Click **"Review"** then **"Save policy"**

## Step 7: Enable Email Authentication

1. Go to **"Authentication"** → **"Providers"** in Supabase
2. Make sure **"Email"** is enabled
3. Configure email settings (optional):
   - You can use Supabase's built-in email service for development
   - For production, configure your own SMTP settings

## Step 8: Restart Your Development Server

1. Stop your current dev server (Ctrl+C in terminal)
2. Run: `npm run dev`
3. Your app should now connect to the new Supabase instance!

## Step 9: Create Your First User

1. Open your app in the browser
2. Go to the signup page
3. Create a new account with your email
4. Check your email for the confirmation link
5. Click the link to verify your account
6. You're ready to use TalentFlow ATS!

## Verification Checklist

✅ Supabase project created  
✅ API credentials copied to .env  
✅ Database schema executed successfully  
✅ Storage bucket created and set to public  
✅ Storage policies added  
✅ Email authentication enabled  
✅ Dev server restarted  
✅ First user account created  

## Troubleshooting

### "Failed to load" errors
- Check that your .env file has the correct credentials
- Restart the dev server after changing .env
- Clear browser cache and reload

### Storage upload errors
- Verify the bucket is set to PUBLIC
- Check that all three storage policies are created
- Ensure bucket name is exactly `candidate-files`

### Authentication issues
- Check that Email provider is enabled in Supabase
- Verify email confirmation link was clicked
- Check browser console for specific error messages

## Database Schema Includes

- ✅ Jobs table with configurable stages
- ✅ Candidates table
- ✅ Interviews table
- ✅ Scorecards table
- ✅ Activity log table
- ✅ Row Level Security policies
- ✅ Performance indexes
- ✅ Auto-update timestamps
- ✅ Rupee symbol support in salary fields

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check the Supabase logs in the dashboard
3. Verify all steps were completed in order
4. Make sure .env file changes were saved and server restarted
