import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Upload, Send, CheckCircle } from "lucide-react";

interface Job {
    id: string;
    title: string;
    department: string;
    location: string;
    employment_type: string;
}

const JobApplication = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        linkedin_url: "",
        portfolio_url: "",
        cover_letter: "",
        years_of_experience: "",
    });

    useEffect(() => {
        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    const fetchJob = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("jobs")
            .select("id, title, department, location, employment_type")
            .eq("id", jobId)
            .eq("status", "open")
            .single();

        if (!error && data) {
            setJob(data);
        } else {
            toast.error("Job not found or no longer available");
            navigate("/careers");
        }
        setLoading(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!job) return;

        // Validation
        if (!formData.full_name || !formData.email || !formData.phone) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);

        try {
            const { error } = await supabase.from("candidates").insert({
                full_name: formData.full_name,
                email: formData.email,
                phone: formData.phone,
                linkedin_url: formData.linkedin_url || null,
                portfolio_url: formData.portfolio_url || null,
                cover_letter: formData.cover_letter || null,
                years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
                job_id: job.id,
                current_stage: "applied",
                rating: 0,
            });

            if (error) throw error;

            setSubmitted(true);
            toast.success("Application submitted successfully!");

            // Reset form
            setFormData({
                full_name: "",
                email: "",
                phone: "",
                linkedin_url: "",
                portfolio_url: "",
                cover_letter: "",
                years_of_experience: "",
            });
        } catch (error: any) {
            console.error("Error submitting application:", error);
            toast.error(error.message || "Failed to submit application");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading job details...</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full text-center shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
                    <CardContent className="pt-12 pb-12">
                        <div className="mb-6 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-24 w-24 bg-green-500/20 rounded-full animate-ping"></div>
                            </div>
                            <CheckCircle className="h-24 w-24 text-green-500 mx-auto relative z-10" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Application Submitted!
                        </h2>
                        <p className="text-lg text-muted-foreground mb-2">
                            Thank you for applying to <strong>{job?.title}</strong>
                        </p>
                        <p className="text-muted-foreground mb-8">
                            We've received your application and will review it shortly.
                            You'll hear from us within 5-7 business days.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Button
                                onClick={() => navigate("/careers")}
                                variant="outline"
                                size="lg"
                            >
                                Browse More Jobs
                            </Button>
                            <Button
                                onClick={() => setSubmitted(false)}
                                size="lg"
                                className="bg-gradient-to-r from-primary to-accent"
                            >
                                Submit Another Application
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
            {/* Header */}
            <header className="bg-gradient-to-r from-primary to-accent py-8 px-4">
                <div className="container mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/careers")}
                        className="text-white hover:bg-white/10 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Careers
                    </Button>
                    <div className="flex items-center gap-3 mb-2">
                        <img src="/favicon.svg" alt="TalentFlow" className="h-8 w-8" />
                        <h1 className="text-3xl font-bold text-white">TalentFlow</h1>
                    </div>
                    <p className="text-white/90 text-lg">Apply for {job?.title}</p>
                </div>
            </header>

            {/* Application Form */}
            <main className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl">Application Form</CardTitle>
                            <CardDescription className="text-base">
                                Fill out the form below to apply for <strong>{job?.title}</strong> in the {job?.department} department.
                                Fields marked with * are required.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</span>
                                        Personal Information
                                    </h3>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name">Full Name *</Label>
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
                                            <Label htmlFor="email">Email Address *</Label>
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
                                            <Label htmlFor="phone">Phone Number *</Label>
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

                                {/* Professional Links */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</span>
                                        Professional Links
                                    </h3>

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

                                {/* Cover Letter */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</span>
                                        Cover Letter
                                    </h3>

                                    <div className="space-y-2">
                                        <Label htmlFor="cover_letter">Tell us why you're a great fit</Label>
                                        <Textarea
                                            id="cover_letter"
                                            name="cover_letter"
                                            value={formData.cover_letter}
                                            onChange={handleInputChange}
                                            placeholder="Share your motivation, relevant experience, and why you want to join our team..."
                                            rows={6}
                                            className="resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Optional but recommended - this helps us understand your interest better
                                        </p>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/careers")}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Submit Application
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default JobApplication;
