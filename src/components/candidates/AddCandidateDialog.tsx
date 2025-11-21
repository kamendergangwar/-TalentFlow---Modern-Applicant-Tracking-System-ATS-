import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Loader2, Upload, FileText, X } from "lucide-react";

interface Job {
    id: string;
    title: string;
    department: string;
}

interface AddCandidateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const AddCandidateDialog = ({ open, onOpenChange, onSuccess }: AddCandidateDialogProps) => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [uploadingResume, setUploadingResume] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        job_id: "",
        linkedin_url: "",
        portfolio_url: "",
        cover_letter: "",
        years_of_experience: "",
        current_stage: "applied",
        rating: "0",
    });

    useEffect(() => {
        if (open) {
            fetchJobs();
        }
    }, [open]);

    const fetchJobs = async () => {
        const { data, error } = await supabase
            .from("jobs")
            .select("id, title, department")
            .eq("status", "active")
            .order("title");

        if (!error && data) {
            setJobs(data);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(file.type)) {
                toast.error("Please upload a PDF or Word document");
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }

            setResumeFile(file);
        }
    };

    const removeResume = () => {
        setResumeFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: "",
            email: "",
            phone: "",
            job_id: "",
            linkedin_url: "",
            portfolio_url: "",
            cover_letter: "",
            years_of_experience: "",
            current_stage: "applied",
            rating: "0",
        });
        setResumeFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.full_name || !formData.email || !formData.phone || !formData.job_id) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        setLoading(true);

        try {
            let resumeUrl = null;

            // Upload resume if provided
            if (resumeFile) {
                setUploadingResume(true);
                const fileExt = resumeFile.name.split('.').pop();
                const fileName = `${Date.now()}_${formData.full_name.replace(/\s+/g, '_')}.${fileExt}`;
                const filePath = `resumes/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('candidate-files')
                    .upload(filePath, resumeFile);

                if (uploadError) {
                    console.error("Resume upload error:", uploadError);
                    toast.error("Failed to upload resume. Continuing without it.");
                } else {
                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from('candidate-files')
                        .getPublicUrl(filePath);

                    resumeUrl = urlData.publicUrl;
                }
                setUploadingResume(false);
            }

            const { error } = await supabase.from("candidates").insert({
                full_name: formData.full_name,
                email: formData.email,
                phone: formData.phone,
                job_id: formData.job_id,
                linkedin_url: formData.linkedin_url || null,
                portfolio_url: formData.portfolio_url || null,
                cover_letter: formData.cover_letter || null,
                years_of_experience: formData.years_of_experience
                    ? parseInt(formData.years_of_experience)
                    : null,
                current_stage: formData.current_stage,
                rating: parseInt(formData.rating),
                resume_url: resumeUrl,
            });

            if (error) throw error;

            toast.success("Candidate added successfully!");
            resetForm();
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("Error adding candidate:", error);
            toast.error(error.message || "Failed to add candidate");
        } finally {
            setLoading(false);
            setUploadingResume(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <UserPlus className="h-6 w-6 text-primary" />
                        Add New Candidate
                    </DialogTitle>
                    <DialogDescription>
                        Manually add a candidate to your recruitment pipeline. Fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                1
                            </span>
                            Basic Information
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">
                                    Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email Address <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">
                                    Phone Number <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 (555) 123-4567"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="years_of_experience">Years of Experience</Label>
                                <Input
                                    id="years_of_experience"
                                    name="years_of_experience"
                                    type="number"
                                    min="0"
                                    value={formData.years_of_experience}
                                    onChange={handleInputChange}
                                    placeholder="5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Job & Stage */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                2
                            </span>
                            Position & Status
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="job_id">
                                    Position <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={formData.job_id}
                                    onValueChange={(value) => handleSelectChange("job_id", value)}
                                    required
                                >
                                    <SelectTrigger id="job_id">
                                        <SelectValue placeholder="Select a position..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {jobs.map((job) => (
                                            <SelectItem key={job.id} value={job.id}>
                                                {job.title} - {job.department}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {jobs.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        No open positions available. Please create a job first.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="current_stage">Current Stage</Label>
                                <Select
                                    value={formData.current_stage}
                                    onValueChange={(value) => handleSelectChange("current_stage", value)}
                                >
                                    <SelectTrigger id="current_stage">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="applied">Applied</SelectItem>
                                        <SelectItem value="screening">Screening</SelectItem>
                                        <SelectItem value="interview">Interview</SelectItem>
                                        <SelectItem value="offer">Offer</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rating">Initial Rating (0-5)</Label>
                            <Select
                                value={formData.rating}
                                onValueChange={(value) => handleSelectChange("rating", value)}
                            >
                                <SelectTrigger id="rating">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">0 - Not rated</SelectItem>
                                    <SelectItem value="1">1 - Poor</SelectItem>
                                    <SelectItem value="2">2 - Fair</SelectItem>
                                    <SelectItem value="3">3 - Good</SelectItem>
                                    <SelectItem value="4">4 - Very Good</SelectItem>
                                    <SelectItem value="5">5 - Excellent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                3
                            </span>
                            Additional Information
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                                <Input
                                    id="linkedin_url"
                                    name="linkedin_url"
                                    type="url"
                                    value={formData.linkedin_url}
                                    onChange={handleInputChange}
                                    placeholder="https://linkedin.com/in/johndoe"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="portfolio_url">Portfolio/Website</Label>
                                <Input
                                    id="portfolio_url"
                                    name="portfolio_url"
                                    type="url"
                                    value={formData.portfolio_url}
                                    onChange={handleInputChange}
                                    placeholder="https://johndoe.com"
                                />
                            </div>
                        </div>

                        {/* Resume Upload */}
                        <div className="space-y-2">
                            <Label htmlFor="resume">Resume / CV</Label>
                            <div className="flex flex-col gap-2">
                                {!resumeFile ? (
                                    <div className="relative">
                                        <Input
                                            ref={fileInputRef}
                                            id="resume"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full justify-start"
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload Resume (PDF or Word)
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                                        <FileText className="h-5 w-5 text-primary" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{resumeFile.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(resumeFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={removeResume}
                                            className="hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Accepted formats: PDF, DOC, DOCX (Max 5MB)
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cover_letter">Notes / Cover Letter</Label>
                            <Textarea
                                id="cover_letter"
                                name="cover_letter"
                                value={formData.cover_letter}
                                onChange={handleInputChange}
                                placeholder="Add any notes, cover letter, or additional information about the candidate..."
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                resetForm();
                                onOpenChange(false);
                            }}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || jobs.length === 0}
                            className="flex-1 bg-gradient-to-r from-primary to-accent"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {uploadingResume ? "Uploading Resume..." : "Adding Candidate..."}
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Candidate
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddCandidateDialog;
