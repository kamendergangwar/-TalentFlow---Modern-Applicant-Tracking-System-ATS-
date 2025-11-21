import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface ScorecardProps {
    candidateId: string;
}

const Scorecard = ({ candidateId }: ScorecardProps) => {
    const [ratings, setRatings] = useState({
        technical: 0,
        communication: 0,
        experience: 0,
        culture: 0,
    });
    const [feedback, setFeedback] = useState("");
    const [saved, setSaved] = useState(false);

    const handleRate = (category: keyof typeof ratings, value: number) => {
        setRatings((prev) => ({ ...prev, [category]: value }));
    };

    const calculateAverage = () => {
        const values = Object.values(ratings);
        const sum = values.reduce((a, b) => a + b, 0);
        return (sum / values.length).toFixed(1);
    };

    const handleSave = () => {
        // In a real app, this would save to the database
        setSaved(true);
        toast.success("Scorecard saved successfully");
    };

    const renderStars = (category: keyof typeof ratings) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => handleRate(category, star)}
                        className={`focus:outline-none transition-colors ${star <= ratings[category] ? "text-yellow-400" : "text-muted"
                            }`}
                    >
                        <Star
                            className={`h-6 w-6 ${star <= ratings[category] ? "fill-current" : "stroke-muted-foreground"
                                }`}
                        />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Interview Scorecard</CardTitle>
                        <div className="text-2xl font-bold text-primary">
                            {calculateAverage()} <span className="text-sm text-muted-foreground font-normal">/ 5.0</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Technical Skills</Label>
                            <div className="flex items-center justify-between">
                                {renderStars("technical")}
                                <span className="text-sm font-medium">{ratings.technical}/5</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Proficiency in required technologies and coding ability.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Communication</Label>
                            <div className="flex items-center justify-between">
                                {renderStars("communication")}
                                <span className="text-sm font-medium">{ratings.communication}/5</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Clarity of thought, articulation, and listening skills.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Relevant Experience</Label>
                            <div className="flex items-center justify-between">
                                {renderStars("experience")}
                                <span className="text-sm font-medium">{ratings.experience}/5</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Depth of experience in similar roles and industries.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Culture Fit</Label>
                            <div className="flex items-center justify-between">
                                {renderStars("culture")}
                                <span className="text-sm font-medium">{ratings.culture}/5</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Alignment with company values and team dynamics.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <Label>Detailed Feedback</Label>
                        <Textarea
                            placeholder="Enter detailed feedback about the candidate..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saved}>
                            {saved ? "Saved" : "Save Scorecard"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Scorecard;
