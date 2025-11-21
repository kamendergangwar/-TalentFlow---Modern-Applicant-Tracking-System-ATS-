import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import StageManager, { Stage } from "./StageManager";

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
    stages?: Stage[];
}

interface EditJobDialogProps {
    job: Job;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onJobUpdated: () => void;
}

const DEFAULT_STAGES: Stage[] = [
    { id: "applied", label: "Applied", color: "bg-blue-500" },
    { id: "screening", label: "Screening", color: "bg-yellow-500" },
    { id: "interview", label: "Interview", color: "bg-purple-500" },
    { id: "offer", label: "Offer", color: "bg-green-500" },
    { id: "rejected", label: "Rejected", color: "bg-red-500" },
];

const EditJobDialog = ({ job, open, onOpenChange, onJobUpdated }: EditJobDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Job>(job);
    const [stages, setStages] = useState<Stage[]>(job.stages || DEFAULT_STAGES);

    useEffect(() => {
        setFormData(job);
        setStages(job.stages || DEFAULT_STAGES);
    }, [job]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from("jobs")
            .update({
                title: formData.title,
                department: formData.department,
                location: formData.location,
                employment_type: formData.employment_type,
                description: formData.description,
                requirements: formData.requirements,
                responsibilities: formData.responsibilities,
                salary_range: formData.salary_range,
                stages: stages as any,
            })
            .eq("id", job.id);

        setLoading(false);

        if (error) {
            toast.error("Failed to update job");
            console.error(error);
        } else {
            toast.success("Job updated successfully!");
            onOpenChange(false);
            onJobUpdated();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Job Posting</DialogTitle>
                    <DialogDescription>
                        Update the details for this job posting
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Job Title</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="employment_type">Employment Type</Label>
                                <Select
                                    name="employment_type"
                                    value={formData.employment_type}
                                    onValueChange={(value) => handleSelectChange("employment_type", value)}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full-time">Full-time</SelectItem>
                                        <SelectItem value="Part-time">Part-time</SelectItem>
                                        <SelectItem value="Contract">Contract</SelectItem>
                                        <SelectItem value="Internship">Internship</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="salary_range">Salary Range</Label>
                                <Input
                                    id="salary_range"
                                    name="salary_range"
                                    value={formData.salary_range || ""}
                                    onChange={handleInputChange}
                                    placeholder="e.g., ₹8L - ₹12L"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows={4}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="requirements">Requirements</Label>
                            <Textarea
                                id="requirements"
                                name="requirements"
                                value={formData.requirements || ""}
                                onChange={handleInputChange}
                                rows={4}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="responsibilities">Responsibilities</Label>
                            <Textarea
                                id="responsibilities"
                                name="responsibilities"
                                value={formData.responsibilities || ""}
                                onChange={handleInputChange}
                                rows={4}
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <StageManager stages={stages} onChange={setStages} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditJobDialog;
