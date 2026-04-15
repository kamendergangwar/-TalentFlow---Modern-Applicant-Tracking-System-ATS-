import {
  findUserByEmail,
  getAdminClient,
  getArgValue,
  printUsage,
} from "./supabase-admin/shared.mjs";

const email = getArgValue("--email");
const password = getArgValue("--password");

if (!email || !password) {
  printUsage([
    "Usage: npm run auth:reset-password -- --email user@example.com --password 'NewStrongPass123!'",
    "",
    "Required env:",
    "  VITE_SUPABASE_URL",
    "  SUPABASE_SERVICE_ROLE_KEY",
  ]);
  process.exit(1);
}

const supabase = getAdminClient();
const user = await findUserByEmail(supabase, email);

if (!user) {
  console.error(`No Supabase user found for ${email}.`);
  process.exit(1);
}

const { error } = await supabase.auth.admin.updateUserById(user.id, {
  password,
});

if (error) {
  throw error;
}

console.log(`Password updated for ${email}.`);
