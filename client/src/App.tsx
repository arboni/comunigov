import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import SimpleAuthPage from "@/pages/simple-auth-page";
import DashboardPage from "@/pages/dashboard-page";
import EntitiesPage from "@/pages/entities-page";
import CommunicationsPage from "@/pages/communications-page";
import MeetingsPage from "@/pages/meetings-page";
import TasksPage from "@/pages/tasks-page";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/entities" component={EntitiesPage} />
      <ProtectedRoute path="/communications" component={CommunicationsPage} />
      <ProtectedRoute path="/meetings" component={MeetingsPage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
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
