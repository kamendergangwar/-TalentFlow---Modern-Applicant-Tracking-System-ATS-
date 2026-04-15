import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Apply from "./pages/Apply";
import JobDetails from "./pages/JobDetails";
import CandidateDetail from "./pages/CandidateDetail";
import Auth from "./pages/Auth";
import Analytics from "./pages/Analytics";
import EmailTemplates from "./pages/EmailTemplates";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { ThemeProvider } from "@/components/theme-provider";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <TooltipProvider>
        <div className="app-shell">
          <div className="app-content">
            <Toaster />
            <Sonner />
            <BrowserRouter basename={import.meta.env.BASE_URL}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/jobs/:jobId" element={<JobDetails />} />
                <Route path="/apply/:jobId" element={<Apply />} />
                <Route path="/candidates/:candidateId" element={<CandidateDetail />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/email-templates" element={<EmailTemplates />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </div>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
