import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Globe,
  FileText,
  Star,
  Briefcase,
  Calendar,
  Download,
  Upload
} from "lucide-react";
import InterviewScheduler from "@/components/interviews/InterviewScheduler";
import ActivityTimeline from "@/components/candidates/ActivityTimeline";
import Scorecard from "@/components/candidates/Scorecard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stage } from "@/components/jobs/StageManager";

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  current_stage: string;
  rating: number;
  linkedin_url: string;
  portfolio_url: string;
  resume_url: string;
  cover_letter: string;
  notes: string;
  created_at: string;
  jobs: {
    title: string;
    department: string;
    location: string;
    stages: Stage[];
  };
}

const DEFAULT_STAGES: Stage[] = [
  { id: "applied", label: "Applied", color: "bg-blue-500" },
  { id: "screening", label: "Screening", color: "bg-yellow-500" },
  { id: "interview", label: "Interview", color: "bg-purple-500" },
  { id: "offer", label: "Offer", color: "bg-green-500" },
  { id: "rejected", label: "Rejected", color: "bg-red-500" },
];

const RESUME_BUCKET = "candidate-files";
const MAX_RESUME_SIZE = 10 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const getResumeStoragePath = (resumeUrl: string | null | undefined) => {
  if (!resumeUrl) {
    return null;
  }

  if (!resumeUrl.startsWith("http")) {
    return resumeUrl.replace(/^\/+/, "");
  }

  try {
    const url = new URL(resumeUrl);
    const markers = [
      `/storage/v1/object/public/${RESUME_BUCKET}/`,
      `/storage/v1/object/sign/${RESUME_BUCKET}/`,
      `/storage/v1/object/authenticated/${RESUME_BUCKET}/`,
    ];

    for (const marker of markers) {
      const index = url.pathname.indexOf(marker);
      if (index !== -1) {
        return decodeURIComponent(url.pathname.slice(index + marker.length));
      }
    }
  } catch {
    return null;
  }

  return null;
};

const getResumeExtension = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const sanitized = value.split("?")[0].split("#")[0];
  const extension = sanitized.split(".").pop();
  return extension ? extension.toLowerCase() : null;
};

const CandidateDetail = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [resolvedResumeUrl, setResolvedResumeUrl] = useState<string | null>(null);
  const [resumeAccessError, setResumeAccessError] = useState<string | null>(null);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchCandidate();
  }, [candidateId]);

  useEffect(() => {
    const resolveResumeUrl = async () => {
      if (!candidate?.resume_url) {
        setResolvedResumeUrl(null);
        setResumeAccessError(null);
        return;
      }

      const storagePath = getResumeStoragePath(candidate.resume_url);

      if (!storagePath) {
        setResolvedResumeUrl(candidate.resume_url);
        setResumeAccessError(null);
        return;
      }

      const { data, error } = await supabase.storage
        .from(RESUME_BUCKET)
        .createSignedUrl(storagePath, 60 * 60);

      if (error) {
        console.error("Failed to create signed resume URL:", error);
        setResolvedResumeUrl(candidate.resume_url);
        setResumeAccessError(
          "Resume file exists, but this app may not have permission to preview it. Check the Supabase storage bucket and SELECT policy."
        );
        return;
      }

      setResolvedResumeUrl(data.signedUrl);
      setResumeAccessError(null);
    };

    void resolveResumeUrl();
  }, [candidate?.resume_url]);

  const fetchCandidate = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select("*, jobs(title, department, location)")
      .eq("id", candidateId)
      .single();

    if (error) {
      toast.error("Failed to load candidate");
      navigate("/");
      return;
    }

    setCandidate(data as any);
    setNotes(data.notes || "");
    setRating(data.rating || 0);
    setLoading(false);
  };

  const handleUpdateNotes = async () => {
    const { error } = await supabase
      .from("candidates")
      .update({ notes })
      .eq("id", candidateId);

    if (error) {
      toast.error("Failed to update notes");
    } else {
      toast.success("Notes updated");
    }
  };

  const handleUpdateRating = async (newRating: number) => {
    setRating(newRating);
    const { error } = await supabase
      .from("candidates")
      .update({ rating: newRating })
      .eq("id", candidateId);

    if (error) {
      toast.error("Failed to update rating");
    } else {
      toast.success("Rating updated");
    }
  };

  const handleStageChange = async (newStage: string) => {
    const oldStage = candidate?.current_stage;

    const { error } = await supabase
      .from("candidates")
      .update({ current_stage: newStage })
      .eq("id", candidateId);

    if (error) {
      toast.error("Failed to update stage");
    } else {
      toast.success("Stage updated");

      // Send email notification
      try {
        await supabase.functions.invoke('send-candidate-notification', {
          body: {
            candidateName: candidate?.full_name,
            candidateEmail: candidate?.email,
            oldStage: oldStage,
            newStage: newStage,
            jobTitle: candidate?.jobs?.title || 'Position'
          }
        });
        toast.success("Email notification sent");
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        toast.error("Stage updated but email notification failed");
      }

      fetchCandidate();
    }
  };

  const getJobStages = () => {
    return candidate?.jobs?.stages || DEFAULT_STAGES;
  };

  const getCurrentStage = () => {
    const stages = getJobStages();
    return stages.find(s => s.id === candidate?.current_stage) || stages[0];
  };

  // Simulated Match Score (In a real app, this would be calculated based on skills/keywords)
  const getMatchScore = () => {
    if (!candidate) return 0;
    // Deterministic pseudo-random score based on name length for demo
    const baseScore = 70;
    const variance = (candidate.full_name.length * 3) % 25;
    return Math.min(98, baseScore + variance);
  };

  const handleDownloadResume = async () => {
    if (!candidate?.resume_url) {
      return;
    }

    const storagePath = getResumeStoragePath(candidate.resume_url);

    if (!storagePath) {
      window.open(resolvedResumeUrl ?? candidate.resume_url, "_blank", "noopener,noreferrer");
      return;
    }

    setDownloadingResume(true);

    const { data, error } = await supabase.storage
      .from(RESUME_BUCKET)
      .download(storagePath);

    setDownloadingResume(false);

    if (error || !data) {
      console.error("Resume download error:", error);
      toast.error("Unable to download the resume. Check Supabase storage bucket access.");
      return;
    }

    const downloadUrl = URL.createObjectURL(data);
    const link = document.createElement("a");
    const fileName = storagePath.split("/").pop() || "resume";

    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const handleResumePickerClick = () => {
    fileInputRef.current?.click();
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !candidateId || !candidate) {
      return;
    }

    if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
      toast.error("Please upload a PDF or Word document.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_RESUME_SIZE) {
      toast.error("Resume file must be smaller than 10MB.");
      event.target.value = "";
      return;
    }

    setUploadingResume(true);

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const safeName = candidate.full_name.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${Date.now()}_${safeName || "candidate"}.${fileExt}`;
    const filePath = `resumes/${fileName}`;
    const previousStoragePath = getResumeStoragePath(candidate.resume_url);

    const { error: uploadError } = await supabase.storage
      .from(RESUME_BUCKET)
      .upload(filePath, file, {
        upsert: false,
      });

    if (uploadError) {
      console.error("Resume upload error:", uploadError);
      toast.error("Failed to upload resume.");
      setUploadingResume(false);
      event.target.value = "";
      return;
    }

    const { data: urlData } = supabase.storage
      .from(RESUME_BUCKET)
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("candidates")
      .update({ resume_url: urlData.publicUrl })
      .eq("id", candidateId);

    if (updateError) {
      console.error("Candidate resume update error:", updateError);
      toast.error("Resume uploaded, but the candidate record could not be updated.");
      setUploadingResume(false);
      event.target.value = "";
      return;
    }

    if (previousStoragePath && previousStoragePath !== filePath) {
      const { error: removeError } = await supabase.storage
        .from(RESUME_BUCKET)
        .remove([previousStoragePath]);

      if (removeError) {
        console.warn("Previous resume could not be removed:", removeError);
      }
    }

    toast.success(candidate.resume_url ? "Resume replaced successfully." : "Resume uploaded successfully.");
    event.target.value = "";
    setUploadingResume(false);
    fetchCandidate();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Candidate not found</p>
      </div>
    );
  }

  const currentStage = getCurrentStage();
  const matchScore = getMatchScore();
  const jobStages = getJobStages();
  const resumeExtension = getResumeExtension(candidate.resume_url);
  const isPdfResume = resumeExtension === "pdf";
  const canPreviewResume = Boolean(resolvedResumeUrl && isPdfResume);

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{candidate.full_name}</h1>
              <p className="text-muted-foreground">{candidate.jobs?.title || "No position"}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Match Score</span>
                <div className="flex items-center gap-1">
                  <div className={`text-xl font-bold ${matchScore >= 80 ? 'text-green-500' : matchScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {matchScore}%
                  </div>
                  <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${matchScore >= 80 ? 'bg-green-500' : matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${matchScore}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full ${currentStage.color} text-white text-sm`}>
                {currentStage.label}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resume">Resume</TabsTrigger>
                <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${candidate.email}`} className="text-primary hover:underline">
                        {candidate.email}
                      </a>
                    </div>
                    {candidate.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${candidate.phone}`} className="text-primary hover:underline">
                          {candidate.phone}
                        </a>
                      </div>
                    )}
                    {candidate.linkedin_url && (
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    {candidate.portfolio_url && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Portfolio
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{candidate.jobs?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Applied {new Date(candidate.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {candidate.cover_letter && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cover Letter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm">{candidate.cover_letter}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="resume" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>Resume Preview</CardTitle>
                      <CardDescription>
                        Upload a fresh file if the old resume is missing or outdated.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleResumeUpload}
                      />
                      <Button variant="default" size="sm" onClick={handleResumePickerClick} disabled={uploadingResume}>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingResume
                          ? "Uploading..."
                          : candidate.resume_url
                            ? "Replace Resume"
                            : "Upload Resume"}
                      </Button>
                      {candidate.resume_url && (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={resolvedResumeUrl ?? candidate.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Open
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleDownloadResume} disabled={downloadingResume}>
                            <Download className="h-4 w-4 mr-2" />
                            {downloadingResume ? "Downloading..." : "Download"}
                          </Button>
                        </> 
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {resumeAccessError && (
                      <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {resumeAccessError}
                      </div>
                    )}
                    {!candidate.resume_url && (
                      <div className="mb-4 rounded-md border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                        No resume is attached yet. Upload a PDF or Word document to store it against this candidate.
                      </div>
                    )}
                    {canPreviewResume ? (
                      <div className="h-[600px] w-full border rounded-md overflow-hidden bg-muted/10">
                        <iframe
                          src={resolvedResumeUrl ?? candidate.resume_url}
                          className="w-full h-full"
                          title="Resume Preview"
                        />
                      </div>
                    ) : candidate.resume_url ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-30" />
                        <p className="font-medium text-foreground">Inline preview is available for PDF resumes.</p>
                        <p className="mt-2 max-w-md text-sm">
                          This resume looks like a Word document or a protected file URL. Use Open or Download above.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mb-4 opacity-20" />
                        <p>No resume uploaded for this candidate</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scorecard" className="mt-6">
                <Scorecard candidateId={candidate.id} />
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Internal Notes</CardTitle>
                    <CardDescription>Private notes about this candidate</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this candidate..."
                      rows={12}
                    />
                    <Button onClick={handleUpdateNotes}>Save Notes</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-6 w-6 cursor-pointer ${star <= rating
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                        }`}
                      onClick={() => handleUpdateRating(star)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Stage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {jobStages.map((stage) => (
                  <Button
                    key={stage.id}
                    variant={candidate.current_stage === stage.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleStageChange(stage.id)}
                  >
                    <div className={`w-3 h-3 rounded-full ${stage.color} mr-2`} />
                    {stage.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <InterviewScheduler
                  candidateId={candidate.id}
                  candidateName={candidate.full_name}
                  onScheduled={fetchCandidate}
                />
              </CardContent>
            </Card>

            <ActivityTimeline candidateId={candidate.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CandidateDetail;
