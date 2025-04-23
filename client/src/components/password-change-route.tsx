import { useEffect } from "react";
import { Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/hooks/use-translation";

// This component handles the routing for the password change page
// It checks if the user is authenticated and needs to change their password
export function PasswordChangeRoute({ component: Component, path }: { component: () => JSX.Element, path: string }) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  // First check if the user is authenticated
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    gcTime: 0
  });

  // Then check if the user needs to change their password
  const { data: passwordStatus, isLoading: isStatusLoading } = useQuery({
    queryKey: ["/api/user/password-status"],
    enabled: !!user, // Only run this query if the user is authenticated
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user/password-status");
        return await res.json();
      } catch (error) {
        return { requirePasswordChange: false };
      }
    }
  });

  const isLoading = isUserLoading || (!!user && isStatusLoading);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !isUserLoading) {
      setLocation("/auth");
    }
  }, [user, isUserLoading, setLocation]);
  
  // Redirect to dashboard if authenticated but doesn't need to change password
  useEffect(() => {
    if (user && !isStatusLoading && !passwordStatus?.requirePasswordChange) {
      setLocation("/");
    }
  }, [user, passwordStatus, isStatusLoading, setLocation]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <p>{t('common.redirecting')}</p>
        </div>
      </Route>
    );
  }

  // If the user needs to change their password, render the component
  if (passwordStatus?.requirePasswordChange) {
    return <Route path={path} component={Component} />;
  }

  // Otherwise, show loading while redirecting to dashboard
  return (
    <Route path={path}>
      <div className="flex items-center justify-center min-h-screen">
        <p>{t('common.redirecting')}</p>
      </div>
    </Route>
  );
}