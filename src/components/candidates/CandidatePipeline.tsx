import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, Phone, Eye, Star, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SendEmailDialog from "@/components/candidates/SendEmailDialog";

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  current_stage: string;
  rating: number;
  created_at: string;
  jobs: {
    title: string;
  };
}

const stages = [
  { id: "applied", label: "Applied", color: "bg-blue-500" },
  { id: "screening", label: "Screening", color: "bg-yellow-500" },
  { id: "interview", label: "Interview", color: "bg-purple-500" },
  { id: "offer", label: "Offer", color: "bg-green-500" },
  { id: "rejected", label: "Rejected", color: "bg-red-500" },
];

const CandidatePipeline = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCandidate, setDraggedCandidate] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedCandidateForEmail, setSelectedCandidateForEmail] = useState<Candidate | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCandidates();

    // Set up realtime subscription
    const channel = supabase
      .channel('candidates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates'
        },
        () => {
          fetchCandidates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("candidates")
      .select("*, jobs(title)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCandidates(data);
    }
    setLoading(false);
  };

  const handleDragStart = (candidateId: string) => {
    setDraggedCandidate(candidateId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: string) => {
    if (!draggedCandidate) return;

    const { error } = await supabase
      .from("candidates")
      .update({ current_stage: stage })
      .eq("id", draggedCandidate);

    if (error) {
      toast.error("Failed to update candidate stage");
    } else {
      toast.success("Candidate moved successfully");
      fetchCandidates();
    }

    setDraggedCandidate(null);
  };

  const getCandidatesByStage = (stageId: string) => {
    return candidates.filter((c) => c.current_stage === stageId);
  };

  const handleSendEmail = (candidate: Candidate) => {
    setSelectedCandidateForEmail(candidate);
    setEmailDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading pipeline...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stages.map((stage) => (
        <div
          key={stage.id}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(stage.id)}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${stage.color}`} />
              <h3 className="font-semibold">{stage.label}</h3>
            </div>
            <Badge variant="secondary">{getCandidatesByStage(stage.id).length}</Badge>
          </div>

          <div className="space-y-2 min-h-[400px] p-2 bg-muted/30 rounded-lg">
            {getCandidatesByStage(stage.id).map((candidate) => (
              <Card
                key={candidate.id}
                draggable
                onDragStart={() => handleDragStart(candidate.id)}
                className="cursor-move hover:shadow-md transition-all"
              >
                <CardHeader className="p-3">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm leading-tight">{candidate.full_name}</h4>
                      {candidate.rating > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs">{candidate.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {candidate.jobs?.title || "Unknown Position"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{candidate.email}</span>
                    </div>
                    {candidate.phone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {candidate.phone}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => navigate(`/candidates/${candidate.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => handleSendEmail(candidate)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Send Email Dialog */}
      {selectedCandidateForEmail && (
        <SendEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          candidateId={selectedCandidateForEmail.id}
          candidateName={selectedCandidateForEmail.full_name}
          candidateEmail={selectedCandidateForEmail.email}
          jobTitle={selectedCandidateForEmail.jobs?.title}
        />
      )}
    </div>
  );
};

export default CandidatePipeline;
