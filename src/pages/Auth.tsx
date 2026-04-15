import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeToggle } from "@/components/mode-toggle";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { ArrowRight, Briefcase, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

type AuthMode = "tabs" | "forgot-password" | "recovery";

const AuthHeroScene = lazy(() => import("@/components/auth/AuthHeroScene"));

const getSiteBaseUrl = () => {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim();
  const siteUrl = configuredSiteUrl ? new URL(configuredSiteUrl) : new URL(window.location.origin);

  return new URL(import.meta.env.BASE_URL, siteUrl);
};

const getAppUrl = (path = "") => new URL(path, getSiteBaseUrl()).toString();

const getAuthErrorMessage = (error: unknown, fallbackMessage: string) =>
  error instanceof Error && error.message ? error.message : fallbackMessage;

const authInputClassName =
  "border-slate-300/90 bg-white/95 text-slate-950 placeholder:text-slate-500 shadow-sm shadow-slate-200/60 focus-visible:ring-cyan-500 focus-visible:ring-offset-white dark:border-white/[0.14] dark:bg-[rgba(15,23,42,0.86)] dark:text-white dark:placeholder:text-slate-400 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] dark:focus-visible:ring-cyan-400 dark:focus-visible:ring-offset-slate-950";

const authTabTriggerClassName =
  "text-slate-600 dark:text-slate-400 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:data-[state=active]:bg-[rgba(96,165,250,0.14)] dark:data-[state=active]:text-white dark:data-[state=active]:shadow-[0_8px_24px_rgba(8,15,30,0.28)]";

const Auth = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("tabs");
  const [signInEmail, setSignInEmail] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const authRedirectUrl = useMemo(() => getAppUrl("auth"), []);
  const homeRedirectUrl = useMemo(() => getAppUrl(), []);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);
    const recoveryType = searchParams.get("type") ?? hashParams.get("type");
    const hasRecoveryToken =
      searchParams.has("code") ||
      searchParams.has("token") ||
      searchParams.has("token_hash") ||
      hashParams.has("access_token") ||
      hashParams.has("refresh_token");

    if (recoveryType === "recovery" || hasRecoveryToken) {
      setAuthMode("recovery");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("recovery");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyResolvedTheme = () => {
      setResolvedTheme(theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme);
    };

    applyResolvedTheme();

    if (theme !== "system") {
      return;
    }

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", applyResolvedTheme);
      return () => mediaQuery.removeEventListener("change", applyResolvedTheme);
    }

    mediaQuery.addListener(applyResolvedTheme);
    return () => mediaQuery.removeListener(applyResolvedTheme);
  }, [theme]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;
    const fullName = (formData.get("fullName") as string).trim();

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: homeRedirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Account created successfully! Redirecting...");
      navigate("/");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Unable to create your account right now."));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Signed in successfully!");
      navigate("/");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Unable to sign in right now."));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = ((formData.get("email") as string) || forgotEmail).trim();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: authRedirectUrl,
      });

      if (error) {
        throw error;
      }

      setForgotEmail(email);
      toast.success("Password reset link sent. Check your email.");
    } catch (error) {
      toast.error(
        getAuthErrorMessage(
          error,
          "Unable to send the reset link. Check the Supabase site URL and redirect URL settings."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password.length < 6) {
      toast.error("Use a password with at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Password updated successfully.");
      setAuthMode("tabs");
      navigate("/");
    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Unable to update your password right now."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef5ff_0%,#f8fbff_45%,#eef4fb_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_right,rgba(94,184,255,0.12),transparent_28%),linear-gradient(180deg,#040817_0%,#07111f_48%,#050914_100%)] dark:text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-12%] h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-400/20" />
        <div className="absolute right-[-10%] top-[10%] h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute bottom-[-20%] left-[20%] h-96 w-96 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
      </div>

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6 lg:right-8 lg:top-8">
        <ModeToggle />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <div className="pointer-events-none absolute inset-y-0 left-[55%] z-10 hidden -translate-x-1/2 lg:block">
          <div className="h-full w-px bg-gradient-to-b from-transparent via-slate-300/70 to-transparent dark:via-white/[0.08]" />
          <div className="absolute inset-y-[18%] left-1/2 w-20 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent blur-2xl dark:via-cyan-400/[0.12]" />
        </div>

        <section className="relative min-h-[320px] overflow-hidden border-b border-slate-200/80 lg:min-h-screen lg:border-b-0 dark:border-white/10">
          <Suspense
            fallback={
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(94,184,255,0.18),_transparent_36%),linear-gradient(180deg,_#eff7ff_0%,_#edf5ff_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(94,184,255,0.25),_transparent_40%),linear-gradient(180deg,_#061121_0%,_#040817_100%)]" />
            }
          >
            <AuthHeroScene themeMode={resolvedTheme} />
          </Suspense>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#eef5ff] via-[rgba(238,245,255,0.78)] to-transparent dark:from-[#040817] dark:via-[rgba(4,8,23,0.7)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#eef5ff] via-[rgba(238,245,255,0.82)] to-transparent dark:from-[#040817] dark:via-[rgba(4,8,23,0.75)]" />

          <div className="absolute inset-x-0 top-0 p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm shadow-slate-200/70 backdrop-blur-md dark:border-white/[0.15] dark:bg-white/10 dark:text-white/80 dark:shadow-none">
              <div className="rounded-full bg-slate-900/5 p-2 dark:bg-white/10">
                <Briefcase className="h-4 w-4 text-cyan-600 dark:text-cyan-200" />
              </div>
              TalentFlow recruiting workspace
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
            <div className="max-w-xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-100/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-cyan-700 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-100">
                <Sparkles className="h-3.5 w-3.5" />
                3D Workflow Preview
              </div>
              <div className="space-y-3">
                <h1 className="max-w-lg text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl dark:text-white">
                  Bring your hiring workspace to life right from sign in.
                </h1>
                <p className="max-w-lg text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
                  A more cinematic first impression for your ATS, with a floating product scene that still keeps the
                  form fast and readable.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-slate-200/60 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08] dark:shadow-none">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Open Roles</p>
                  <strong className="mt-2 block text-2xl font-semibold text-slate-950 dark:text-white">24</strong>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-slate-200/60 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08] dark:shadow-none">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Response Rate</p>
                  <strong className="mt-2 block text-2xl font-semibold text-slate-950 dark:text-white">81%</strong>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm shadow-slate-200/60 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.08] dark:shadow-none">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Avg. Hire Time</p>
                  <strong className="mt-2 block text-2xl font-semibold text-slate-950 dark:text-white">11d</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center bg-transparent px-4 py-8 sm:px-6 lg:px-10 lg:py-12 dark:bg-[linear-gradient(180deg,rgba(6,11,26,0.08),rgba(6,11,26,0.32))]">
          <div className="pointer-events-none absolute inset-0 hidden dark:block">
            <div className="absolute right-[12%] top-[20%] h-64 w-64 rounded-full bg-cyan-400/[0.08] blur-3xl" />
            <div className="absolute bottom-[16%] right-[18%] h-72 w-72 rounded-full bg-indigo-500/[0.08] blur-3xl" />
          </div>

          <Card className="relative w-full max-w-[430px] overflow-hidden border-slate-200/80 bg-white/80 text-slate-950 shadow-[0_30px_80px_rgba(148,163,184,0.24)] backdrop-blur-2xl dark:border-white/[0.1] dark:bg-[linear-gradient(180deg,rgba(9,16,32,0.92),rgba(8,13,27,0.84))] dark:text-white dark:shadow-[0_36px_90px_rgba(2,6,23,0.78)]">
            <div className="pointer-events-none absolute inset-0 hidden dark:block">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.24] to-transparent" />
              <div className="absolute left-[-12%] top-[-10%] h-40 w-40 rounded-full bg-cyan-300/[0.12] blur-3xl" />
              <div className="absolute bottom-[-18%] right-[-8%] h-48 w-48 rounded-full bg-indigo-500/[0.14] blur-3xl" />
            </div>

            <CardHeader className="relative z-10 space-y-5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-cyan-100 p-3 dark:bg-cyan-400/[0.12] dark:ring-1 dark:ring-cyan-300/[0.12]">
                    <Briefcase className="h-6 w-6 text-cyan-700 dark:text-cyan-200" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-950 dark:text-white">ATS Platform</CardTitle>
                    <CardDescription className="mt-1 text-slate-600 dark:text-slate-300">
                      {authMode === "recovery"
                        ? "Choose a new password for your account"
                        : authMode === "forgot-password"
                          ? "We will email you a secure reset link"
                          : "Sign in to manage jobs, candidates, and interviews."}
                    </CardDescription>
                  </div>
                </div>
              </div>

              {authMode === "tabs" ? (
                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-700 dark:border-white/[0.08] dark:bg-[rgba(255,255,255,0.04)] dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-200" />
                    Secure email authentication with Supabase
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    Built for recruiters, hiring managers, and ops teams
                  </div>
                </div>
              ) : null}
            </CardHeader>

            <CardContent className="relative z-10">
              {authMode === "recovery" ? (
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-password" className="text-slate-700 dark:text-slate-200">
                      New Password
                    </Label>
                    <Input
                      id="recovery-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={authInputClassName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recovery-confirm-password" className="text-slate-700 dark:text-slate-200">
                      Confirm New Password
                    </Label>
                    <Input
                      id="recovery-confirm-password"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={authInputClassName}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-cyan-500 text-white hover:bg-cyan-600 dark:bg-[linear-gradient(90deg,#67e8f9_0%,#38bdf8_55%,#22c55e_100%)] dark:text-slate-950 dark:hover:brightness-105" disabled={loading}>
                    {loading ? "Updating password..." : "Update Password"}
                  </Button>
                </form>
              ) : authMode === "forgot-password" ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-slate-700 dark:text-slate-200">
                      Email
                    </Label>
                    <Input
                      id="forgot-email"
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className={authInputClassName}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-cyan-500 text-white hover:bg-cyan-600 dark:bg-[linear-gradient(90deg,#67e8f9_0%,#38bdf8_55%,#22c55e_100%)] dark:text-slate-950 dark:hover:brightness-105" disabled={loading}>
                    {loading ? "Sending reset link..." : "Send Reset Link"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-white/[0.08] dark:hover:text-white"
                    onClick={() => setAuthMode("tabs")}
                  >
                    Back to sign in
                  </Button>
                </form>
              ) : (
                <Tabs defaultValue="signin">
                  <TabsList className="grid w-full grid-cols-2 border border-slate-200 bg-slate-100/90 dark:border-white/[0.08] dark:bg-[rgba(255,255,255,0.04)]">
                    <TabsTrigger value="signin" className={authTabTriggerClassName}>Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className={authTabTriggerClassName}>Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-6">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-slate-700 dark:text-slate-200">
                          Email
                        </Label>
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          placeholder="you@company.com"
                          value={signInEmail}
                          onChange={(e) => {
                            setSignInEmail(e.target.value);
                            setForgotEmail(e.target.value);
                          }}
                          required
                          className={authInputClassName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-slate-700 dark:text-slate-200">
                          Password
                        </Label>
                        <Input
                          id="signin-password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          required
                          className={authInputClassName}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-cyan-500 text-white hover:bg-cyan-600 dark:bg-[linear-gradient(90deg,#67e8f9_0%,#38bdf8_55%,#22c55e_100%)] dark:text-slate-950 dark:hover:brightness-105"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                        {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                      </Button>
                      <Button
                        type="button"
                        variant="link"
                        className="w-full px-0 text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                        onClick={() => setAuthMode("forgot-password")}
                      >
                        Forgot your password?
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-6">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-slate-700 dark:text-slate-200">
                          Full Name
                        </Label>
                        <Input
                          id="signup-name"
                          name="fullName"
                          type="text"
                          placeholder="John Doe"
                          required
                          className={authInputClassName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-slate-700 dark:text-slate-200">
                          Email
                        </Label>
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="you@company.com"
                          required
                          className={authInputClassName}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-slate-700 dark:text-slate-200">
                          Password
                        </Label>
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          required
                          className={authInputClassName}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-cyan-500 text-white hover:bg-cyan-600 dark:bg-[linear-gradient(90deg,#67e8f9_0%,#38bdf8_55%,#22c55e_100%)] dark:text-slate-950 dark:hover:brightness-105"
                        disabled={loading}
                      >
                        {loading ? "Creating account..." : "Create Account"}
                        {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Auth;
