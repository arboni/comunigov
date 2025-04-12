import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskListItem from "@/components/dashboard/task-list-item";
import CreateTaskDialog from "@/components/dialogs/create-task-dialog";

export default function TasksPage() {
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["/api/user"]
  });
  
  // Fetch all tasks
  const { data: allTasks, isLoading: isLoadingAll } = useQuery({
    queryKey: ["/api/tasks"],
  });

  // Fetch user's tasks
  const { data: userTasks, isLoading: isLoadingUserTasks } = useQuery({
    queryKey: ["/api/tasks/user", user?.id],
    enabled: !!user?.id,
  });

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">Tasks</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Create, manage and track tasks across your organization
              </p>
            </div>
            
            <Button 
              onClick={() => setCreateTaskOpen(true)}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create Task</span>
            </Button>
          </div>
          
          {/* Tasks Tabs */}
          <Tabs defaultValue="my-tasks" className="w-full">
            <TabsList className="w-full max-w-md mb-6">
              <TabsTrigger value="my-tasks" className="flex-1">My Tasks</TabsTrigger>
              <TabsTrigger value="all-tasks" className="flex-1">All Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-tasks">
              <div className="bg-white shadow rounded-lg">
                <ul className="divide-y divide-neutral-200 px-4 py-2">
                  {isLoadingUserTasks ? (
                    <div className="py-8 text-center text-neutral-500">Loading your tasks...</div>
                  ) : userTasks && userTasks.length > 0 ? (
                    userTasks.map((task) => (
                      <TaskListItem 
                        key={task.id} 
                        task={task}
                        isDetailedView
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <h3 className="text-lg font-medium text-neutral-700">No tasks assigned to you</h3>
                      <p className="mt-2 text-neutral-500">
                        When tasks are assigned to you, they will appear here.
                      </p>
                    </div>
                  )}
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="all-tasks">
              <div className="bg-white shadow rounded-lg">
                <ul className="divide-y divide-neutral-200 px-4 py-2">
                  {isLoadingAll ? (
                    <div className="py-8 text-center text-neutral-500">Loading all tasks...</div>
                  ) : allTasks && allTasks.length > 0 ? (
                    allTasks.map((task) => (
                      <TaskListItem 
                        key={task.id} 
                        task={task}
                        isDetailedView
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <h3 className="text-lg font-medium text-neutral-700">No tasks found</h3>
                      <p className="mt-2 text-neutral-500">
                        Click the 'Create Task' button to create your first task.
                      </p>
                    </div>
                  )}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Create Task Dialog */}
      <CreateTaskDialog 
        open={createTaskOpen} 
        onOpenChange={setCreateTaskOpen} 
      />
    </DashboardLayout>
  );
}
