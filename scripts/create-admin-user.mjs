import {
  findUserByEmail,
  getAdminClient,
  getArgValue,
  printUsage,
} from "./supabase-admin/shared.mjs";

const email = getArgValue("--email");
const password = getArgValue("--password");
const fullName = getArgValue("--name") ?? "Admin User";

if (!email || !password) {
  printUsage([
    "Usage: npm run auth:create-admin -- --email admin@example.com --password 'StrongPass123!' [--name 'Admin User']",
    "",
    "Required env:",
    "  VITE_SUPABASE_URL",
    "  SUPABASE_SERVICE_ROLE_KEY",
  ]);
  process.exit(1);
}

const supabase = getAdminClient();
const existingUser = await findUserByEmail(supabase, email);

let user = existingUser;

if (!existingUser) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error) {
    throw error;
  }

  user = data.user;
} else {
  const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    password,
    user_metadata: {
      ...(existingUser.user_metadata ?? {}),
      full_name: fullName,
    },
    email_confirm: true,
  });

  if (error) {
    throw error;
  }
}

const { error: profileError } = await supabase.from("profiles").upsert({
  id: user.id,
  email,
  full_name: fullName,
  role: "admin",
});

if (profileError) {
  throw profileError;
}

console.log(
  existingUser
    ? `Updated existing user ${email} and promoted them to admin.`
    : `Created admin user ${email}.`
);
