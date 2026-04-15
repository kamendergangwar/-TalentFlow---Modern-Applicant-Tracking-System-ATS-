# Supabase Recovery Guide

This project can be brought back by restoring the old backup into a new Supabase project and then re-pointing the app to that new project.

## Recommended Restore Path

1. Create a brand new Supabase project.
2. Restore the backup from the paused project into the new project.
3. Reapply this repo's current schema additions and backend setup.
4. Update the app's environment variables and local Supabase config.
5. Verify auth, database reads/writes, storage uploads, realtime, and email functions.

## Important Repo-Specific Notes

- The app reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env`.
- The app uploads resumes to the `candidate-files` storage bucket.
- `supabase_complete_schema.sql` is older than the current repo state.
- The current app also expects:
  - `profiles`
  - `candidate_activities`
  - `email_templates`
  - realtime on `candidates` and `candidate_activities`
- The app invokes `send-candidate-notification`.
- The app also invokes `send-custom-email`, but that function is not present in `supabase/functions/` and must be created or the app updated.

## What To Apply After Restore

### Database

Prefer the SQL files in `supabase/migrations/` over `supabase_complete_schema.sql`, because the migrations reflect the newer schema used by the app.

Apply these migrations in order:

1. `supabase/migrations/20251114063555_0c950217-d9aa-4663-b81c-518b7c6a7fd9.sql`
2. `supabase/migrations/20251114064144_b59fb57b-b199-414d-af08-847d9163fca3.sql`
3. `supabase/migrations/20251114064315_75fed0a4-b8fe-4520-bd56-8a693feeffbd.sql`
4. `supabase/migrations/20251117050759_b614eb54-19ef-4e4f-97ad-5475cc0d149e.sql`
5. `supabase/migrations/20251119045625_98ce1812-1282-4d4e-a05a-65db4786309b.sql`
6. `supabase/migrations/20260413090000_add_job_stages_column.sql`

### Storage

The frontend uses the `candidate-files` bucket, not `resumes`.

Create:

- Bucket name: `candidate-files`
- Public: `true`

Then add storage policies that allow:

- public `INSERT`
- public `SELECT`
- authenticated `DELETE`

See `supabase_storage_policies.sql` and the usage in `src/pages/Apply.tsx` and `src/components/candidates/AddCandidateDialog.tsx`.

### Edge Functions

Deploy and configure:

- `send-candidate-notification`
- `send-notification` if you still want to keep it available

Set required secrets for `send-candidate-notification`:

- `RESEND_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Also resolve the custom email path:

- Either add a `send-custom-email` edge function
- Or update the app to call an existing deployed function instead

## Config To Update In This Repo

After the new project is ready, update:

- `.env`
- `supabase/config.toml`

Expected keys:

```env
VITE_SUPABASE_URL=https://your-new-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-new-publishable-key
```

And in `supabase/config.toml`:

```toml
project_id = "your-new-project-ref"
```

## Verification Checklist

After the new credentials are in place, verify these flows:

1. Sign up and sign in.
2. Confirm a `profiles` row is created for the new user.
3. Create a job posting.
4. Open the public apply page for that job.
5. Submit a candidate application with a resume upload.
6. Open the dashboard and candidate list.
7. Move a candidate between stages and verify realtime updates.
8. Open Email Templates and verify reads/writes work.
9. Trigger candidate notification email and confirm the edge function succeeds.
10. Test custom email sending and confirm whether `send-custom-email` exists.

## Known Mismatches To Resolve

- `supabase/config.toml` and `.env` should point to the same Supabase project.
- `supabase_complete_schema.sql` does not match the latest schema represented by the migrations.
- The UI invokes `send-custom-email`, but no matching edge function exists in this repo.
