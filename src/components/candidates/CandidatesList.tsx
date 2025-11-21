import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, FileText, Star, Search, Download, FileSpreadsheet, Trash2, Edit, Send } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { utils, writeFile } from "xlsx";
import { toast } from "sonner";
import SendEmailDialog from "@/components/candidates/SendEmailDialog";


interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  current_stage: string;
  rating: number;
  created_at: string;
  job_id: string;
  jobs: {
    id: string;
    title: string;
  };
}

interface Job {
  id: string;
  title: string;
}

const CandidatesList = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState<string>("");
  const [bulkRating, setBulkRating] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedCandidateForEmail, setSelectedCandidateForEmail] = useState<Candidate | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCandidates();
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [candidates, searchQuery, selectedJob, selectedStage, selectedRating]);

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidates")
      .select("*, jobs(id, title)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCandidates(data);
    }
    setLoading(false);
  };

  const fetchJobs = async () => {
    const { data } = await supabase
      .from("jobs")
      .select("id, title")
      .order("title");

    if (data) {
      setJobs(data);
    }
  };

  const applyFilters = () => {
    let filtered = [...candidates];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.full_name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    // Job filter
    if (selectedJob !== "all") {
      filtered = filtered.filter((c) => c.job_id === selectedJob);
    }

    // Stage filter
    if (selectedStage !== "all") {
      filtered = filtered.filter((c) => c.current_stage === selectedStage);
    }

    // Rating filter
    if (selectedRating !== "all") {
      const rating = parseInt(selectedRating);
      filtered = filtered.filter((c) => c.rating >= rating);
    }

    setFilteredCandidates(filtered);
  };

  const exportToCSV = () => {
    if (filteredCandidates.length === 0) {
      toast.error("No candidates to export");
      return;
    }

    const csvData = filteredCandidates.map((candidate) => ({
      Name: candidate.full_name,
      Email: candidate.email,
      Phone: candidate.phone || "N/A",
      Job: candidate.jobs?.title || "N/A",
      Stage: candidate.current_stage,
      Rating: candidate.rating || 0,
      "Applied Date": new Date(candidate.created_at).toLocaleDateString(),
    }));

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidates-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredCandidates.length} candidates to CSV`);
  };

  const exportToExcel = () => {
    if (filteredCandidates.length === 0) {
      toast.error("No candidates to export");
      return;
    }

    const excelData = filteredCandidates.map((candidate) => ({
      Name: candidate.full_name,
      Email: candidate.email,
      Phone: candidate.phone || "N/A",
      Job: candidate.jobs?.title || "N/A",
      Stage: candidate.current_stage,
      Rating: candidate.rating || 0,
      "Applied Date": new Date(candidate.created_at).toLocaleDateString(),
    }));

    const worksheet = utils.json_to_sheet(excelData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Candidates");

    writeFile(workbook, `candidates-${new Date().toISOString().split("T")[0]}.xlsx`);

    toast.success(`Exported ${filteredCandidates.length} candidates to Excel`);
  };

  const toggleSelectAll = () => {
    if (selectedCandidates.size === filteredCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
    }
  };

  const toggleSelectCandidate = (id: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const sendStageUpdateEmail = async (candidateId: string, newStage: string) => {
    try {
      const candidate = filteredCandidates.find(c => c.id === candidateId) ||
        candidates.find(c => c.id === candidateId);

      if (!candidate) return;

      await supabase.functions.invoke('send-candidate-notification', {
        body: {
          candidateName: candidate.full_name,
          candidateEmail: candidate.email,
          oldStage: candidate.current_stage,
          newStage: newStage,
          jobTitle: candidate.jobs?.title || 'Position'
        }
      });
    } catch (error) {
      console.error("Failed to send email notification:", error);
      // Don't fail the whole operation if email fails
    }
  };

  const handleBulkStageUpdate = async () => {
    if (selectedCandidates.size === 0 || !bulkStage) {
      toast.error("Please select candidates and a stage");
      return;
    }

    const { error } = await supabase
      .from("candidates")
      .update({ current_stage: bulkStage })
      .in("id", Array.from(selectedCandidates));

    if (error) {
      toast.error("Failed to update stages");
      console.error(error);
    } else {
      toast.success(`Updated ${selectedCandidates.size} candidate(s)`);

      // Send email notifications to all updated candidates
      const emailPromises = Array.from(selectedCandidates).map(id =>
        sendStageUpdateEmail(id, bulkStage)
      );
      await Promise.allSettled(emailPromises);

      setSelectedCandidates(new Set());
      setBulkStage("");
      fetchCandidates();
    }
  };

  const handleBulkRatingUpdate = async () => {
    if (selectedCandidates.size === 0 || !bulkRating) {
      toast.error("Please select candidates and a rating");
      return;
    }

    const { error } = await supabase
      .from("candidates")
      .update({ rating: parseInt(bulkRating) })
      .in("id", Array.from(selectedCandidates));

    if (error) {
      toast.error("Failed to update ratings");
      console.error(error);
    } else {
      toast.success(`Updated ${selectedCandidates.size} candidate(s)`);
      setSelectedCandidates(new Set());
      setBulkRating("");
      fetchCandidates();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCandidates.size === 0) {
      toast.error("Please select candidates to delete");
      return;
    }

    const { error } = await supabase
      .from("candidates")
      .delete()
      .in("id", Array.from(selectedCandidates));

    if (error) {
      toast.error("Failed to delete candidates");
      console.error(error);
    } else {
      toast.success(`Deleted ${selectedCandidates.size} candidate(s)`);
      setSelectedCandidates(new Set());
      setShowDeleteDialog(false);
      fetchCandidates();
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      applied: "bg-blue-500",
      screening: "bg-yellow-500",
      interview: "bg-purple-500",
      offer: "bg-green-500",
      rejected: "bg-red-500",
    };
    return colors[stage] || "bg-gray-500";
  };

  const handleSendEmail = (candidate: Candidate) => {
    setSelectedCandidateForEmail(candidate);
    setEmailDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading candidates...</div>;
  }

  if (candidates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No candidates yet</p>
          <p className="text-muted-foreground">Applications will appear here once received</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Search & Filter</CardTitle>
              <CardDescription>
                Showing {filteredCandidates.length} of {candidates.length} candidates
                {selectedCandidates.size > 0 && ` • ${selectedCandidates.size} selected`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={filteredCandidates.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={filteredCandidates.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="2">2+ Stars</SelectItem>
                <SelectItem value="1">1+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Showing {filteredCandidates.length} of {candidates.length} candidates
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCandidates.size > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Bulk Actions ({selectedCandidates.size} selected)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Select value={bulkStage} onValueChange={setBulkStage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkStageUpdate} disabled={!bulkStage}>
                  <Edit className="mr-2 h-4 w-4" />
                  Update Stage
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Select value={bulkRating} onValueChange={setBulkRating}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Update Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Star</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkRatingUpdate} disabled={!bulkRating}>
                  <Star className="mr-2 h-4 w-4" />
                  Update Rating
                </Button>
              </div>

              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Select All Checkbox */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0}
          onCheckedChange={toggleSelectAll}
        />
        <span className="text-sm text-muted-foreground">Select All</span>
      </div>

      {/* Candidates List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredCandidates.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No candidates found</p>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredCandidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-md transition-all hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Checkbox
                      checked={selectedCandidates.has(candidate.id)}
                      onCheckedChange={() => toggleSelectCandidate(candidate.id)}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-1 flex items-center gap-1.5">
                        <span className="truncate">{candidate.full_name}</span>
                        {candidate.rating > 0 && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">{candidate.rating}</span>
                          </div>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-1">
                        {candidate.jobs?.title || "Unknown Position"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getStageColor(candidate.current_stage)} shrink-0 text-xs`}>
                    {candidate.current_stage}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{candidate.email}</span>
                    </div>
                    {candidate.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{candidate.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => navigate(`/candidates/${candidate.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleSendEmail(candidate)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      < AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCandidates.size} candidate(s). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog >

      {/* Send Email Dialog */}
      {
        selectedCandidateForEmail && (
          <SendEmailDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            candidateId={selectedCandidateForEmail.id}
            candidateName={selectedCandidateForEmail.full_name}
            candidateEmail={selectedCandidateForEmail.email}
            jobTitle={selectedCandidateForEmail.jobs?.title}
          />
        )
      }
    </div >
  );
};

export default CandidatesList;
