import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [licenseChecked, setLicenseChecked] = useState(false);
  const [hasLicense, setHasLicense] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchLicense = async () => {
      if (!user) {
        setLicenseChecked(false);
        setHasLicense(false);
        return;
      }
      setLicenseChecked(false);
      try {
        const { data, error } = await supabase
          .from("creator_profiles")
          .select("has_license")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!active) return;
        if (error) {
          console.error("Failed to fetch creator license:", error);
          setHasLicense(false);
        } else {
          setHasLicense(Boolean(data?.has_license));
        }
      } finally {
        if (active) {
          setLicenseChecked(true);
        }
      }
    };
    void fetchLicense();
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!licenseChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasLicense) {
    return <Navigate to="/quiz?step=results" replace />;
  }

  if (user.user_metadata?.must_change_password === true) {
    const redirectTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/auth?mode=force-change&redirect=${redirectTo}`} replace />;
  }

  return <>{children}</>;
}
