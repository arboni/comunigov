import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import StatsCard from "@/components/dashboard/stats-card";
import QuickActionButton from "@/components/dashboard/quick-action-button";
import MeetingListItem from "@/components/dashboard/meeting-list-item";
import TaskListItem from "@/components/dashboard/task-list-item";
import EntityCard from "@/components/dashboard/entity-card";
import CommunicationsTable from "@/components/dashboard/communications-table";
import RegisterEntityDialog from "@/components/dialogs/register-entity-dialog";
import SendMessageDialog from "@/components/dialogs/send-message-dialog";
import ScheduleMeetingDialog from "@/components/dialogs/schedule-meeting-dialog";
import CreateTaskDialog from "@/components/dialogs/create-task-dialog";
import { Building2, Send, CalendarPlus, ListTodo } from "lucide-react";

export default function DashboardPage() {
  const [registerEntityOpen, setRegisterEntityOpen] = useState(false);
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch recent entities
  const { data: entities, isLoading: isLoadingEntities } = useQuery({
    queryKey: ["/api/entities"],
  });

  // Fetch upcoming meetings
  const { data: meetings, isLoading: isLoadingMeetings } = useQuery({
    queryKey: ["/api/meetings/upcoming"],
  });

  // Fetch recent tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  // Fetch recent communications
  const { data: communications, isLoading: isLoadingCommunications } = useQuery({
    queryKey: ["/api/communications"],
  });

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          
          {/* Dashboard Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Welcome back! Here's an overview of your institutional communication system.
            </p>
          </div>
          
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Entities"
              value={isLoadingStats ? "-" : stats?.entityCount.toString() || "0"}
              icon={<Building2 />}
              color="primary"
              linkText="View all"
              linkHref="/entities"
            />
            
            <StatsCard
              title="Registered Users"
              value={isLoadingStats ? "-" : stats?.userCount.toString() || "0"}
              icon={<Building2 />}
              color="secondary"
              linkText="View all"
              linkHref="/users"
            />
            
            <StatsCard
              title="Upcoming Meetings"
              value={isLoadingStats ? "-" : stats?.upcomingMeetings.toString() || "0"}
              icon={<CalendarPlus />}
              color="accent"
              linkText="View all"
              linkHref="/meetings"
            />
            
            <StatsCard
              title="Pending Tasks"
              value={isLoadingStats ? "-" : stats?.pendingTasks.toString() || "0"}
              icon={<ListTodo />}
              color="warning"
              linkText="View all"
              linkHref="/tasks"
            />
          </div>
          
          {/* Quick Actions */}
          <div className="mt-6">
            <h2 className="text-lg font-medium text-neutral-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <QuickActionButton
                title="Register Entity"
                icon={<Building2 />}
                color="primary"
                onClick={() => setRegisterEntityOpen(true)}
              />
              
              <QuickActionButton
                title="Send Message"
                icon={<Send />}
                color="secondary"
                onClick={() => setSendMessageOpen(true)}
              />
              
              <QuickActionButton
                title="Schedule Meeting"
                icon={<CalendarPlus />}
                color="accent"
                onClick={() => setScheduleMeetingOpen(true)}
              />
              
              <QuickActionButton
                title="Create Task"
                icon={<ListTodo />}
                color="success"
                onClick={() => setCreateTaskOpen(true)}
              />
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Upcoming Meetings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-neutral-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-800">Upcoming Meetings</h3>
                  <a href="/meetings" className="text-sm font-medium text-primary hover:text-primary-600">View all</a>
                </div>
              </div>
              <ul className="divide-y divide-neutral-200 px-4 py-2">
                {isLoadingMeetings ? (
                  <div className="py-4 text-center text-neutral-500">Loading meetings...</div>
                ) : meetings && meetings.length > 0 ? (
                  meetings.slice(0, 3).map((meeting) => (
                    <MeetingListItem key={meeting.id} meeting={meeting} />
                  ))
                ) : (
                  <div className="py-4 text-center text-neutral-500">No upcoming meetings</div>
                )}
              </ul>
            </div>
            
            {/* Recent Tasks */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-neutral-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-neutral-800">Recent Tasks</h3>
                  <a href="/tasks" className="text-sm font-medium text-primary hover:text-primary-600">View all</a>
                </div>
              </div>
              <ul className="divide-y divide-neutral-200 px-4 py-2">
                {isLoadingTasks ? (
                  <div className="py-4 text-center text-neutral-500">Loading tasks...</div>
                ) : tasks && tasks.length > 0 ? (
                  tasks.slice(0, 3).map((task) => (
                    <TaskListItem key={task.id} task={task} />
                  ))
                ) : (
                  <div className="py-4 text-center text-neutral-500">No tasks available</div>
                )}
              </ul>
            </div>
          </div>
          
          {/* Registered Entities */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-neutral-800">Registered Entities</h2>
              <a href="/entities" className="text-sm font-medium text-primary hover:text-primary-600">View all</a>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isLoadingEntities ? (
                <div className="col-span-full py-4 text-center text-neutral-500">Loading entities...</div>
              ) : entities && entities.length > 0 ? (
                entities.slice(0, 3).map((entity) => (
                  <EntityCard key={entity.id} entity={entity} />
                ))
              ) : (
                <div className="col-span-full py-4 text-center text-neutral-500">No entities registered</div>
              )}
            </div>
          </div>
          
          {/* Recent Communications */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-neutral-800">Recent Communications</h2>
              <a href="/communications" className="text-sm font-medium text-primary hover:text-primary-600">View all</a>
            </div>
            
            <CommunicationsTable 
              communications={communications || []} 
              isLoading={isLoadingCommunications} 
            />
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <RegisterEntityDialog 
        open={registerEntityOpen} 
        onOpenChange={setRegisterEntityOpen} 
      />
      
      <SendMessageDialog 
        open={sendMessageOpen} 
        onOpenChange={setSendMessageOpen} 
      />
      
      <ScheduleMeetingDialog 
        open={scheduleMeetingOpen} 
        onOpenChange={setScheduleMeetingOpen} 
      />
      
      <CreateTaskDialog 
        open={createTaskOpen} 
        onOpenChange={setCreateTaskOpen} 
      />
    </DashboardLayout>
  );
}
