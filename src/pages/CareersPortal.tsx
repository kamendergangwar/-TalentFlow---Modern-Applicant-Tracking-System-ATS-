import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Briefcase,
    MapPin,
    Clock,
    DollarSign,
    Search,
    Building2,
    Sparkles,
    TrendingUp,
    Users
} from "lucide-react";

interface Job {
    id: string;
    title: string;
    department: string;
    location: string;
    employment_type: string;
    salary_range: string;
    description: string;
    requirements: string;
    created_at: string;
    status: string;
}

const CareersPortal = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [jobs, searchQuery, selectedDepartment]);

    const fetchJobs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("status", "open")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setJobs(data);
        }
        setLoading(false);
    };

    const applyFilters = () => {
        let filtered = [...jobs];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (job) =>
                    job.title.toLowerCase().includes(query) ||
                    job.department.toLowerCase().includes(query) ||
                    job.location.toLowerCase().includes(query)
            );
        }

        if (selectedDepartment !== "all") {
            filtered = filtered.filter((job) => job.department === selectedDepartment);
        }

        setFilteredJobs(filtered);
    };

    const departments = Array.from(new Set(jobs.map((job) => job.department)));

    const getEmploymentTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            "full-time": "bg-green-500",
            "part-time": "bg-blue-500",
            contract: "bg-purple-500",
            internship: "bg-orange-500",
        };
        return colors[type] || "bg-gray-500";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
            {/* Hero Section */}
            <header className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent py-20 px-4">
                <div className="absolute inset-0 bg-grid-white/10"></div>
                <div className="container mx-auto relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-6 animate-in fade-in slide-in-from-top duration-700">
                        <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                            <img
                                src="/favicon.svg"
                                alt="TalentFlow Logo"
                                className="h-12 w-12"
                            />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white">
                            TalentFlow
                        </h1>
                    </div>
                    <p className="text-xl md:text-2xl text-white/90 text-center mb-4 animate-in fade-in slide-in-from-top duration-700 delay-100">
                        Join Our Team & Shape the Future
                    </p>
                    <p className="text-white/80 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-top duration-700 delay-200">
                        Discover exciting career opportunities and be part of something amazing.
                        We're looking for talented individuals to join our growing team.
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                            <Briefcase className="h-8 w-8 text-white mx-auto mb-2" />
                            <div className="text-3xl font-bold text-white">{jobs.length}</div>
                            <div className="text-white/80 text-sm">Open Positions</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom duration-700 delay-[400ms]">
                            <Users className="h-8 w-8 text-white mx-auto mb-2" />
                            <div className="text-3xl font-bold text-white">50+</div>
                            <div className="text-white/80 text-sm">Team Members</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                            <TrendingUp className="h-8 w-8 text-white mx-auto mb-2" />
                            <div className="text-3xl font-bold text-white">95%</div>
                            <div className="text-white/80 text-sm">Employee Satisfaction</div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Search and Filter Section */}
            <div className="container mx-auto px-4 -mt-8 relative z-20">
                <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search by job title, department, or location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-12 text-base"
                                />
                            </div>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="h-12 px-4 rounded-md border border-input bg-background text-base"
                            >
                                <option value="all">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Showing {filteredJobs.length} of {jobs.length} positions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Jobs Listing */}
            <main className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
                        <p className="text-muted-foreground mt-4">Loading opportunities...</p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No positions found</h3>
                            <p className="text-muted-foreground">
                                {searchQuery || selectedDepartment !== "all"
                                    ? "Try adjusting your filters"
                                    : "Check back soon for new opportunities!"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {filteredJobs.map((job, index) => (
                            <Card
                                key={job.id}
                                className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1 border-0 bg-card/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-700"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className={`${getEmploymentTypeColor(job.employment_type)} text-white`}>
                                                    {job.employment_type}
                                                </Badge>
                                                <Badge variant="outline" className="border-primary/50 text-primary">
                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                    New
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                                                {job.title}
                                            </CardTitle>
                                            <CardDescription className="mt-2 flex flex-wrap items-center gap-4 text-base">
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="h-4 w-4" />
                                                    {job.department}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-4 w-4" />
                                                    {job.location}
                                                </span>
                                                {job.salary_range && (
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="h-4 w-4" />
                                                        {job.salary_range}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    Posted {new Date(job.created_at).toLocaleDateString()}
                                                </span>
                                            </CardDescription>
                                        </div>
                                        <Button
                                            size="lg"
                                            onClick={() => navigate(`/apply/${job.id}`)}
                                            className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
                                        >
                                            Apply Now
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-muted-foreground line-clamp-3">
                                            {job.description}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => navigate(`/jobs/${job.id}`)}
                                        className="mt-4 text-primary hover:text-primary/80"
                                    >
                                        View Details →
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-card border-t mt-20">
                <div className="container mx-auto px-4 py-8 text-center">
                    <p className="text-muted-foreground">
                        © 2025 TalentFlow. All rights reserved.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Building the future of recruitment, one hire at a time.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default CareersPortal;
