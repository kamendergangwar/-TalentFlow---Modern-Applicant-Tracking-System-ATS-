import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Mail, Send } from "lucide-react";

interface SendEmailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    jobTitle?: string;
}

interface EmailTemplate {
    id: string;
    stage: string;
    subject: string;
    body_html: string;
}

const SendEmailDialog = ({
    open,
    onOpenChange,
    candidateId,
    candidateName,
    candidateEmail,
    jobTitle = "Position"
}: SendEmailDialogProps) => {
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (open) {
            fetchTemplates();
        }
    }, [open]);

    const fetchTemplates = async () => {
        const { data, error } = await supabase
            .from("email_templates")
            .select("*")
            .eq("is_active", true);

        if (!error && data) {
            setTemplates(data);
        }
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);

        if (templateId === "none") {
            // Clear fields when starting from scratch
            setSubject("");
            setBody("");
            return;
        }

        const template = templates.find(t => t.id === templateId);

        if (template) {
            // Replace placeholders with actual values
            const processedSubject = template.subject
                .replace(/{{candidateName}}/g, candidateName)
                .replace(/{{jobTitle}}/g, jobTitle);

            const processedBody = template.body_html
                .replace(/{{candidateName}}/g, candidateName)
                .replace(/{{jobTitle}}/g, jobTitle);

            setSubject(processedSubject);
            setBody(processedBody);
        }
    };

    const handleSendEmail = async () => {
        if (!subject.trim() || !body.trim()) {
            toast.error("Please fill in both subject and body");
            return;
        }

        setSending(true);

        try {
            // Call Supabase Edge Function to send email
            const { data, error } = await supabase.functions.invoke('send-custom-email', {
                body: {
                    to: candidateEmail,
                    subject: subject,
                    html: body,
                    candidateName: candidateName,
                    candidateId: candidateId
                }
            });

            if (error) {
                console.error("Error sending email:", error);
                toast.error("Failed to send email. Please try again.");
            } else {
                toast.success(`Email sent successfully to ${candidateName}`);

                // Reset form and close dialog
                setSubject("");
                setBody("");
                setSelectedTemplate("");
                onOpenChange(false);
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("An error occurred while sending the email");
        } finally {
            setSending(false);
        }
    };

    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            ["clean"],
        ],
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Send Email to {candidateName}
                    </DialogTitle>
                    <DialogDescription>
                        Compose and send a custom email to {candidateEmail}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Template Selection - Enhanced */}
                    <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="template" className="text-base font-semibold">
                                📧 Choose Email Template
                            </Label>
                            {selectedTemplate && selectedTemplate !== "none" && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedTemplate("none");
                                        setSubject("");
                                        setBody("");
                                    }}
                                    className="h-7 text-xs"
                                >
                                    Clear Template
                                </Button>
                            )}
                        </div>
                        <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                            <SelectTrigger id="template" className="bg-background">
                                <SelectValue placeholder="Select a template to get started..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <div className="flex items-center gap-2">
                                        <span>✍️ Start from scratch</span>
                                    </div>
                                </SelectItem>
                                {templates.map((template) => (
                                    <SelectItem key={template.id} value={template.id}>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                                {template.stage.charAt(0).toUpperCase() + template.stage.slice(1)}
                                            </span>
                                            <span className="truncate">{template.subject}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {templates.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No templates available. You can create templates in the Email Templates page.
                            </p>
                        )}
                        {selectedTemplate && selectedTemplate !== "none" && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-400">
                                ✓ Template applied! Subject and body have been populated with placeholders replaced.
                            </div>
                        )}
                        {(!selectedTemplate || selectedTemplate === "none") && (
                            <p className="text-xs text-muted-foreground italic">
                                💡 Tip: Select a template to quickly compose professional emails with pre-filled content.
                            </p>
                        )}
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject..."
                        />
                    </div>

                    {/* Body */}
                    <div className="space-y-2">
                        <Label htmlFor="body">Email Body *</Label>
                        <div className="border rounded-md">
                            <ReactQuill
                                theme="snow"
                                value={body}
                                onChange={setBody}
                                modules={modules}
                                className="min-h-[250px]"
                            />
                        </div>
                    </div>

                    {/* Recipient Info */}
                    <div className="bg-muted p-3 rounded-md text-sm">
                        <p className="font-medium mb-1">Recipient:</p>
                        <p className="text-muted-foreground">
                            {candidateName} ({candidateEmail})
                        </p>
                        {jobTitle && (
                            <p className="text-muted-foreground mt-1">
                                Position: {jobTitle}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSendEmail} disabled={sending || !subject.trim() || !body.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        {sending ? "Sending..." : "Send Email"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendEmailDialog;
