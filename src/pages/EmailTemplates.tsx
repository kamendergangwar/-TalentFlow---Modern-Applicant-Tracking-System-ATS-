import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface EmailTemplate {
  id?: string;
  stage: string;
  subject: string;
  body_html: string;
  is_active: boolean;
}

const stages = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

const defaultTemplates: Record<string, { subject: string; body: string }> = {
  applied: {
    subject: "Application Received - {{jobTitle}}",
    body: "<p>Dear {{candidateName}},</p><p>We have received your application and our team will review it shortly.</p><p><strong>Position:</strong> {{jobTitle}}</p><p>Thank you for your interest!</p>"
  },
  screening: {
    subject: "Application Under Review - {{jobTitle}}",
    body: "<p>Dear {{candidateName}},</p><p>Your application is currently being reviewed by our recruitment team.</p><p><strong>Position:</strong> {{jobTitle}}</p><p>We will update you on the next steps soon.</p>"
  },
  interview: {
    subject: "Interview Stage - {{jobTitle}}",
    body: "<p>Dear {{candidateName}},</p><p>Congratulations! Your application has progressed to the interview stage.</p><p><strong>Position:</strong> {{jobTitle}}</p><p>Our team will contact you soon to schedule an interview.</p>"
  },
  offer: {
    subject: "Job Offer - Congratulations!",
    body: "<p>Dear {{candidateName}},</p><p>We are delighted to extend an offer for this position.</p><p><strong>Position:</strong> {{jobTitle}}</p><p>Our team will contact you with the details shortly.</p>"
  },
  hired: {
    subject: "Welcome to the Team!",
    body: "<p>Dear {{candidateName}},</p><p>Welcome aboard! We're excited to have you join our team.</p><p><strong>Position:</strong> {{jobTitle}}</p><p>You'll receive onboarding information soon.</p>"
  },
  rejected: {
    subject: "Application Update - {{jobTitle}}",
    body: "<p>Dear {{candidateName}},</p><p>Thank you for your interest in this position. While we have decided to move forward with other candidates, we appreciate the time you invested in the application process.</p><p><strong>Position:</strong> {{jobTitle}}</p><p>We encourage you to apply for future openings.</p>"
  }
};

const EmailTemplates = () => {
  const navigate = useNavigate();
  const [selectedStage, setSelectedStage] = useState("applied");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({});
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
    fetchTemplates();
  }, []);

  useEffect(() => {
    loadTemplate(selectedStage);
  }, [selectedStage, templates]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*");

    if (error) {
      console.error("Error fetching templates:", error);
    } else if (data) {
      const templateMap: Record<string, EmailTemplate> = {};
      data.forEach((template) => {
        templateMap[template.stage] = template;
      });
      setTemplates(templateMap);
    }
    setLoading(false);
  };

  const loadTemplate = (stage: string) => {
    if (templates[stage]) {
      setSubject(templates[stage].subject);
      setBodyHtml(templates[stage].body_html);
    } else {
      const defaultTemplate = defaultTemplates[stage];
      setSubject(defaultTemplate.subject);
      setBodyHtml(defaultTemplate.body);
    }
  };

  const handleSave = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error("Please fill in both subject and body");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to save templates");
      return;
    }

    const templateData = {
      stage: selectedStage,
      subject: subject.trim(),
      body_html: bodyHtml,
      is_active: true,
      created_by: userId
    };

    if (templates[selectedStage]) {
      // Update existing template
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: templateData.subject,
          body_html: templateData.body_html,
          updated_at: new Date().toISOString()
        })
        .eq("id", templates[selectedStage].id);

      if (error) {
        toast.error("Failed to update template");
        console.error(error);
      } else {
        toast.success("Template updated successfully");
        fetchTemplates();
      }
    } else {
      // Create new template
      const { error } = await supabase
        .from("email_templates")
        .insert([templateData]);

      if (error) {
        toast.error("Failed to save template");
        console.error(error);
      } else {
        toast.success("Template saved successfully");
        fetchTemplates();
      }
    }
  };

  const handleReset = () => {
    const defaultTemplate = defaultTemplates[selectedStage];
    setSubject(defaultTemplate.subject);
    setBodyHtml(defaultTemplate.body);
  };

  const getPreviewHtml = () => {
    return bodyHtml
      .replace(/{{candidateName}}/g, "John Doe")
      .replace(/{{jobTitle}}/g, "Senior Software Engineer")
      .replace(/{{oldStage}}/g, "screening")
      .replace(/{{newStage}}/g, selectedStage);
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["clean"],
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground mt-1">
              Customize notification emails for each candidate stage
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Template Editor</CardTitle>
              <CardDescription>
                Use {"{{candidateName}}"}, {"{{jobTitle}}"}, {"{{oldStage}}"}, and {"{{newStage}}"} as placeholders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger id="stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Email Body</Label>
                <div className="border rounded-md">
                  <ReactQuill
                    theme="snow"
                    value={bodyHtml}
                    onChange={setBodyHtml}
                    modules={modules}
                    className="min-h-[300px]"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset to Default
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Placeholders</CardTitle>
              <CardDescription>Use these in your templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {"{{candidateName}}"}
                </code>
                <p className="text-sm text-muted-foreground mt-1">
                  Candidate's full name
                </p>
              </div>
              <div>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {"{{jobTitle}}"}
                </code>
                <p className="text-sm text-muted-foreground mt-1">
                  Job position title
                </p>
              </div>
              <div>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {"{{oldStage}}"}
                </code>
                <p className="text-sm text-muted-foreground mt-1">
                  Previous stage (optional)
                </p>
              </div>
              <div>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {"{{newStage}}"}
                </code>
                <p className="text-sm text-muted-foreground mt-1">
                  New/current stage
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Saved Templates</CardTitle>
            <CardDescription>Manage your custom email templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stages.map((stage) => (
                <Card key={stage.value} className={templates[stage.value] ? "border-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="text-base">{stage.label}</CardTitle>
                    <CardDescription>
                      {templates[stage.value] ? "Custom template" : "Using default"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedStage(stage.value)}
                    >
                      {templates[stage.value] ? "Edit" : "Customize"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Email Preview</AlertDialogTitle>
            <AlertDialogDescription>
              Preview with sample data
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Subject:</Label>
              <p className="text-sm mt-1">
                {subject.replace(/{{candidateName}}/g, "John Doe").replace(/{{jobTitle}}/g, "Senior Software Engineer")}
              </p>
            </div>
            <div>
              <Label className="text-sm font-semibold">Body:</Label>
              <div 
                className="mt-2 p-4 border rounded-md bg-card"
                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmailTemplates;
