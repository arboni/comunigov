import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import SimpleAuthPage from "@/pages/simple-auth-page";
import DashboardPage from "@/pages/dashboard-page";
import EntitiesPage from "@/pages/entities-page";
import CommunicationsPage from "@/pages/communications-page";
import CommunicationDetailPage from "@/pages/communication-detail-page";
import MeetingsPage from "@/pages/meetings-page";
import MeetingDetailPage from "@/pages/meeting-detail-page";
import EntityDetailPage from "@/pages/entity-detail-page";
import EntityImportPage from "@/pages/entity-import-page";
import EntityMemberImportPage from "@/pages/entity-member-import-page";
import TasksPage from "@/pages/tasks-page";
import UsersPage from "@/pages/users-page";
import UserDetailPage from "@/pages/user-detail-page";
import UserEditPage from "@/pages/user-edit-page";
import SettingsPage from "@/pages/settings-page";
import SubjectsPage from "@/pages/subjects-page";
import AnalyticsPage from "@/pages/analytics-page";

// This is a simpler implementation that doesn't rely on the auth context
function ProtectedRoute({ component: Component, path }: { component: () => JSX.Element, path: string }) {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    gcTime: 0
  });

  // Always declare all hooks regardless of conditions
  useEffect(() => {
    if (!user && !isLoading) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

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
          <p>Redirecting to login...</p>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/entities" component={EntitiesPage} />
      <ProtectedRoute path="/entities/import" component={EntityImportPage} />
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
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
