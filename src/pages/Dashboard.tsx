import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  LogOut,
  Plus,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import JobsList from "@/components/jobs/JobsList";
import CandidatesList from "@/components/candidates/CandidatesList";
import CandidatePipeline from "@/components/candidates/CandidatePipeline";
import CreateJobDialog from "@/components/jobs/CreateJobDialog";
import AddCandidateDialog from "@/components/candidates/AddCandidateDialog";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  status: string;
  created_at: string;
}

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  current_stage: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCandidateDialog, setShowAddCandidateDialog] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCandidates: 0,
    activeInterviews: 0,
    newApplications: 0,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchStats();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchStats = async () => {
    const { data: jobs } = await supabase.from("jobs").select("id");
    const { data: candidates } = await supabase.from("candidates").select("id");
    const { data: interviews } = await supabase
      .from("interviews")
      .select("id")
      .eq("status", "scheduled");

    setStats({
      totalJobs: jobs?.length || 0,
      totalCandidates: candidates?.length || 0,
      activeInterviews: interviews?.length || 0,
      newApplications: candidates?.filter((c: any) => {
        const createdAt = new Date(c.created_at);
        const now = new Date();
        const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }).length || 0,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Enhanced Header with Gradient */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-2 bg-white dark:bg-card rounded-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <img
                    src="/favicon.svg"
                    alt="ATS Platform Logo"
                    className="h-10 w-10"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  TalentFlow
                </h1>
                <p className="text-sm text-muted-foreground font-medium">Streamline Your Hiring</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => setShowAddCandidateDialog(true)}
                size="sm"
                className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Candidate
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/email-templates")}
                size="sm"
                className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Templates
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/analytics")}
                size="sm"
                className="hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-300"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <ModeToggle />
              <Button
                variant="ghost"
                onClick={handleSignOut}
                size="sm"
                className="hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-3xl font-bold mb-2">Welcome back! 👋</h2>
          <p className="text-muted-foreground">Here's what's happening with your recruitment today.</p>
        </div>

        {/* Enhanced Stats Cards with Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Jobs Card */}
          <div className="group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <Card className="relative overflow-hidden border border-blue-500/20 shadow-sm shadow-blue-500/10 bg-gradient-to-br from-blue-500/10 via-card to-card hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Total Jobs</CardTitle>
                <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                  <Briefcase className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    {stats.totalJobs}
                  </div>
                  <div className="flex items-center text-xs font-medium text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>12%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Active job postings</p>
              </CardContent>
            </Card>
          </div>

          {/* Candidates Card */}
          <div className="group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <Card className="relative overflow-hidden border border-purple-500/20 shadow-sm shadow-purple-500/10 bg-gradient-to-br from-purple-500/10 via-card to-card hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Candidates</CardTitle>
                <div className="p-2.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors duration-300">
                  <Users className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    {stats.totalCandidates}
                  </div>
                  <div className="flex items-center text-xs font-medium text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>8%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Total applications</p>
              </CardContent>
            </Card>
          </div>

          {/* Interviews Card */}
          <div className="group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Card className="relative overflow-hidden border border-emerald-500/20 shadow-sm shadow-emerald-500/10 bg-gradient-to-br from-emerald-500/10 via-card to-card hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Interviews</CardTitle>
                <div className="p-2.5 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <Calendar className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                    {stats.activeInterviews}
                  </div>
                  <div className="flex items-center text-xs font-medium text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>5%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Scheduled this week</p>
              </CardContent>
            </Card>
          </div>

          {/* New Applications Card */}
          <div className="group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[400ms]">
            <Card className="relative overflow-hidden border border-amber-500/20 shadow-sm shadow-amber-500/10 bg-gradient-to-br from-amber-500/10 via-card to-card hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">New This Week</CardTitle>
                <div className="p-2.5 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors duration-300">
                  <TrendingUp className="h-5 w-5 text-amber-500 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-amber-400 bg-clip-text text-transparent">
                    {stats.newApplications}
                  </div>
                  <div className="flex items-center text-xs font-medium text-green-600">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>24%</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Recent applications</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Tabs Section */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          <Tabs defaultValue="jobs" className="space-y-6">
            <div className="flex items-center justify-between bg-card/50 backdrop-blur-sm p-4 rounded-xl border shadow-sm">
              <TabsList className="bg-muted/50">
                <TabsTrigger
                  value="jobs"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white transition-all duration-300"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Jobs
                </TabsTrigger>
                <TabsTrigger
                  value="pipeline"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-accent/80 data-[state=active]:text-white transition-all duration-300"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Pipeline
                </TabsTrigger>
                <TabsTrigger
                  value="candidates"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-400 data-[state=active]:text-white transition-all duration-300"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Candidates
                </TabsTrigger>
              </TabsList>
              <CreateJobDialog onJobCreated={fetchStats} />
            </div>

            <TabsContent value="jobs" className="space-y-4 mt-0">
              <JobsList />
            </TabsContent>

            <TabsContent value="pipeline" className="space-y-4 mt-0">
              <CandidatePipeline />
            </TabsContent>

            <TabsContent value="candidates" className="space-y-4 mt-0">
              <CandidatesList />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Add Candidate Dialog */}
      <AddCandidateDialog
        open={showAddCandidateDialog}
        onOpenChange={setShowAddCandidateDialog}
        onSuccess={fetchStats}
      />
    </div>
  );
};

export default Dashboard;
