import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Studio from "@/pages/Studio";
import Auth from "@/pages/Auth";
import Premium from "@/pages/Premium";
import PremiumSuccess from "@/pages/PremiumSuccess";
import Quiz from "@/pages/Quiz";
import QuizAnalytics from "@/pages/QuizAnalytics";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/quiz/analytics" element={
            <AdminRoute>
              <QuizAnalytics />
            </AdminRoute>
          } />
          <Route path="/auth" element={<Auth />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/premium/success" element={<PremiumSuccess />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Studio />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
