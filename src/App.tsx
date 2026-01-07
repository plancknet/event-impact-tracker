import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import SearchTerms from "@/pages/SearchTerms";
import GoogleAlerts from "@/pages/GoogleAlerts";
import ExtractedResults from "@/pages/ExtractedResults";
import FullContent from "@/pages/FullContent";
import AnalysisResults from "@/pages/AnalysisResults";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<SearchTerms />} />
            <Route path="/queries" element={<GoogleAlerts />} />
            <Route path="/results" element={<ExtractedResults />} />
            <Route path="/full-content" element={<FullContent />} />
            <Route path="/analysis" element={<AnalysisResults />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
