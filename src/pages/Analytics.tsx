import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, Users, Clock, Target, ArrowLeft, Briefcase, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PipelineData {
  stage: string;
  count: number;
  fill?: string;
}

interface ConversionData {
  stage: string;
  rate: number;
}

interface TimeToHireData {
  month: string;
  days: number;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState<PipelineData[]>([]);
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [timeToHireData, setTimeToHireData] = useState<TimeToHireData[]>([]);
  const [avgTimeToHire, setAvgTimeToHire] = useState(0);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [hiredCount, setHiredCount] = useState(0);
  const [activeJobs, setActiveJobs] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        fetchAnalytics();
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchAnalytics = async () => {
    setLoading(true);

    // Fetch all candidates
    const { data: candidates } = await supabase
      .from("candidates")
      .select("*");

    if (candidates) {
      setTotalCandidates(candidates.length);
      setRejectedCount(candidates.filter(c => c.current_stage === 'rejected').length);

      // Pipeline distribution
      const stageCount: Record<string, number> = {};
      candidates.forEach((c) => {
        stageCount[c.current_stage] = (stageCount[c.current_stage] || 0) + 1;
      });

      const stageColors: Record<string, string> = {
        applied: "hsl(var(--primary))",
        screening: "hsl(var(--chart-2))",
        interview: "hsl(var(--chart-3))",
        offer: "hsl(var(--chart-4))",
        hired: "hsl(var(--success))",
        rejected: "hsl(var(--destructive))",
      };

      const pipeline = Object.entries(stageCount).map(([stage, count]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count,
        fill: stageColors[stage] || "hsl(var(--muted))",
      }));
      setPipelineData(pipeline);

      // Calculate conversion rates
      const stages = ["applied", "screening", "interview", "offer", "hired"];
      const conversions: ConversionData[] = [];

      for (let i = 0; i < stages.length - 1; i++) {
        const currentStage = stages[i];
        const nextStage = stages[i + 1];
        const currentCount = stageCount[currentStage] || 0;

        // Count candidates who have passed this stage (are in this stage or any later stage)
        // This is a simplified approximation
        const passedCount = candidates.filter(
          (c) => stages.indexOf(c.current_stage) >= i
        ).length;

        const nextPassedCount = candidates.filter(
          (c) => stages.indexOf(c.current_stage) >= i + 1
        ).length;

        const rate = passedCount > 0 ? (nextPassedCount / passedCount) * 100 : 0;
        conversions.push({
          stage: `${currentStage.charAt(0).toUpperCase() + currentStage.slice(1)} → ${nextStage.charAt(0).toUpperCase() + nextStage.slice(1)}`,
          rate: Math.round(rate),
        });
      }
      setConversionData(conversions);

      // Calculate time-to-hire
      const offeredCandidates = candidates.filter(c => c.current_stage === "hired" || c.current_stage === "offer");
      setHiredCount(offeredCandidates.length);

      if (offeredCandidates.length > 0) {
        const times = offeredCandidates.map((c) => {
          const start = new Date(c.created_at);
          const end = new Date(c.updated_at);
          return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        });

        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        setAvgTimeToHire(avg);

        // Group by month
        const monthlyData: Record<string, number[]> = {};
        offeredCandidates.forEach((c) => {
          const month = new Date(c.updated_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          const days = Math.floor(
            (new Date(c.updated_at).getTime() - new Date(c.created_at).getTime()) /
            (1000 * 60 * 60 * 24)
          );
          if (!monthlyData[month]) monthlyData[month] = [];
          monthlyData[month].push(days);
        });

        const timeData = Object.entries(monthlyData)
          .map(([month, days]) => ({
            month,
            days: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
          }))
          .slice(-6);

        setTimeToHireData(timeData);
      }
    }

    // Fetch active jobs
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id")
      .eq("status", "active");

    if (jobs) {
      setActiveJobs(jobs.length);
    }

    setLoading(false);
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-primary">
            {payload[0].name}: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time recruitment insights
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="px-3 py-1">
                Last 30 Days
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-accent/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="h-24 w-24" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Candidates</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCandidates}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="text-green-500 font-medium flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> +12%
                </span>
                from last month
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-primary/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Briefcase className="h-24 w-24" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Target className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeJobs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently open positions
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-orange-500/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock className="h-24 w-24" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Time to Hire</CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-full">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgTimeToHire} <span className="text-lg font-normal text-muted-foreground">days</span></div>
              <p className="text-xs text-muted-foreground mt-1">
                Application to Offer
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-card to-green-500/5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 className="h-24 w-24" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hired Candidates</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{hiredCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Successful placements
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="pipeline" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-card border">
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="conversion">Conversion</TabsTrigger>
              <TabsTrigger value="time-to-hire">Time to Hire</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pipeline" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 shadow-sm">
                <CardHeader>
                  <CardTitle>Pipeline Distribution</CardTitle>
                  <CardDescription>Candidates across all recruitment stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="stage" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {pipelineData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Stage Breakdown</CardTitle>
                  <CardDescription>Proportion by stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={pipelineData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {pipelineData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conversion" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Funnel Conversion Rates</CardTitle>
                <CardDescription>Percentage of candidates moving to the next stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={conversionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time-to-hire" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Time to Hire Trend</CardTitle>
                <CardDescription>Average days to hire over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {timeToHireData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={timeToHireData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="days"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 6, fill: "hsl(var(--background))", strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Clock className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No data available yet</p>
                    <p className="text-sm">Hire more candidates to see trends over time.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Analytics;
