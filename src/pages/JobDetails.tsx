import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Briefcase, MapPin, IndianRupee, ArrowLeft, Users, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EditJobDialog from "@/components/jobs/EditJobDialog";
import ShareJobDialog from "@/components/jobs/ShareJobDialog";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string;
  responsibilities: string;
  salary_range: string;
  status: string;
  created_by: string;
  created_at: string;
}

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidateCount, setCandidateCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchJob();
    fetchCandidateCount();
  }, [jobId]);

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!error && data) {
      setJob(data);

      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === data.created_by);
    }
    setLoading(false);
  };

  const fetchCandidateCount = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select("id")
      .eq("job_id", jobId);

    if (!error && data) {
      setCandidateCount(data.length);
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId);

    if (error) {
      toast.error("Failed to delete job");
    } else {
      toast.success("Job deleted successfully");
      navigate("/");
    }
  };

  const handleToggleStatus = async () => {
    if (!job) return;

    const newStatus = job.status === "active" ? "closed" : "active";
    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", jobId);

    if (error) {
      toast.error("Failed to update job status");
    } else {
      toast.success(`Job ${newStatus === "active" ? "activated" : "closed"}`);
      fetchJob();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <p className="text-lg font-medium mb-2">Job not found</p>
            <Button onClick={() => navigate("/")}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl">{job.title}</CardTitle>
                  <Badge variant={job.status === "active" ? "default" : "secondary"}>
                    {job.status}
                  </Badge>
                </div>
                <CardDescription className="text-base">{job.department}</CardDescription>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {job.employment_type}
              </div>
              {job.salary_range && (
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  {job.salary_range}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {candidateCount} {candidateCount === 1 ? "Candidate" : "Candidates"}
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleToggleStatus}>
                  {job.status === "active" ? "Close Job" : "Activate Job"}
                </Button>
                <ShareJobDialog jobTitle={job.title} jobId={job.id} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this job posting and all associated candidates.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
            </div>

            {job.responsibilities && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Responsibilities</h3>
                <p className="text-muted-foreground whitespace-pre-line">{job.responsibilities}</p>
              </div>
            )}

            {job.requirements && (
              <div>
                <h3 className="font-semibold text-lg mb-2">Requirements</h3>
                <p className="text-muted-foreground whitespace-pre-line">{job.requirements}</p>
              </div>
            )}

            {job.status === "active" && !isOwner && (
              <div className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate(`/apply/${job.id}`)}
                >
                  Apply for this Position
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <EditJobDialog
        job={job}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onJobUpdated={fetchJob}
      />
    </div>
  );
};

export default JobDetails;
