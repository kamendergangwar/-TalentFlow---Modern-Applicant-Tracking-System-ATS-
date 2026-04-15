# Auth Admin Guide

This project now supports three auth recovery/admin paths:

## 1. User self-service password reset

Open the app and use **Sign In** -> **Forgot your password?**.

- The app sends a Supabase password reset email.
- The reset link returns to `/auth`.
- After the recovery link opens, the app shows a **Update Password** form.

## 2. Direct password reset with a service-role key

Use this when you need to reset a user's password manually without email.

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here npm run auth:reset-password -- --email user@example.com --password 'NewStrongPass123!'
```

Notes:

- `VITE_SUPABASE_URL` is loaded from `.env`.
- Do not commit `SUPABASE_SERVICE_ROLE_KEY` to the repo.

## 3. Create or promote an admin account

This script creates a new Supabase auth user if the email does not exist yet.
If the user already exists, it updates the password and promotes the related `profiles.role` to `admin`.

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here npm run auth:create-admin -- --email admin@example.com --password 'StrongPass123!' --name 'Admin User'
```

The script:

- creates or updates the auth user
- confirms the email
- upserts the `profiles` row
- sets `profiles.role = 'admin'`
