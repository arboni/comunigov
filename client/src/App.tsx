import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import NotFound from "@/pages/not-found";
import SimpleAuthPage from "@/pages/simple-auth-page";
import ChangePasswordPage from "@/pages/change-password-page";
import DashboardPage from "@/pages/dashboard-page";
import EntitiesPage from "@/pages/entities-page";
import CommunicationsPage from "@/pages/communications-page";
import CommunicationDetailPage from "@/pages/communication-detail-page";
import MeetingsPage from "@/pages/meetings-page";
import MeetingDetailPage from "@/pages/meeting-detail-page";
import EntityDetailPage from "@/pages/entity-detail-page";
import EntityImportPage from "@/pages/entity-import-page";
import EntityMemberImportPage from "@/pages/entity-member-import-page";
import EntityMembersImportPage from "@/pages/entity-members-import-page";
import TasksPage from "@/pages/tasks-page";
import UsersPage from "@/pages/users-page";
import UserDetailPage from "@/pages/user-detail-page";
import UserEditPage from "@/pages/user-edit-page";
import SettingsPage from "@/pages/settings-page";
import SubjectsPage from "@/pages/subjects-page";
import AnalyticsPage from "@/pages/analytics-page";
import { useTranslation } from "@/hooks/use-translation";
import i18n from "./lib/i18n";
import { I18nProvider } from "@/components/ui/i18n-provider";
import { PasswordChangeRoute } from "@/components/password-change-route";

// This is a simpler implementation that doesn't rely on the auth context
function ProtectedRoute({ component: Component, path }: { component: () => JSX.Element, path: string }) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    gcTime: 0
  });

  // Check if the user needs to change their password
  const { data: passwordStatus, isLoading: isPasswordStatusLoading } = useQuery({
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

  const isLoading = isUserLoading || (!!user && isPasswordStatusLoading);

  // Always declare all hooks regardless of conditions
  useEffect(() => {
    if (!user && !isUserLoading) {
      setLocation("/auth");
    }
  }, [user, isUserLoading, setLocation]);

  // Redirect to change password page if needed
  useEffect(() => {
    if (user && !isPasswordStatusLoading && passwordStatus?.requirePasswordChange) {
      setLocation("/change-password");
    }
  }, [user, passwordStatus, isPasswordStatusLoading, setLocation]);

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

  // If the user needs to change their password, show loading while redirecting
  if (passwordStatus?.requirePasswordChange) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <p>{t('common.redirecting')}</p>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

function Router() {
  return (
    <Switch>
      <PasswordChangeRoute path="/change-password" component={ChangePasswordPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/entities" component={EntitiesPage} />
      <ProtectedRoute path="/entities/import" component={EntityImportPage} />
      <ProtectedRoute path="/entities/members/import" component={EntityMembersImportPage} />
      <ProtectedRoute path="/entities/:entityId/members/import" component={EntityMemberImportPage} />
      <ProtectedRoute path="/communications" component={CommunicationsPage} />
      <ProtectedRoute path="/communications/:id" component={CommunicationDetailPage} />
      <ProtectedRoute path="/meetings" component={MeetingsPage} />
      <ProtectedRoute path="/meeting/:id" component={MeetingDetailPage} />
      <ProtectedRoute path="/entity/:id" component={EntityDetailPage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/subjects" component={SubjectsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/users/:id/edit" component={UserEditPage} />
      <ProtectedRoute path="/users/:id" component={UserDetailPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={SimpleAuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Força a mudança de idioma para português ao iniciar
  useEffect(() => {
    i18n.changeLanguage('pt-BR');
  }, []);

  return (
    <I18nProvider>
      <Router />
      <Toaster />
    </I18nProvider>
  );
}

export default App;
