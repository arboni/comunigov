import { format, isValid, isPast } from "date-fns";
import { CalendarDays, User } from "lucide-react";
import { Task } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface TaskListItemProps {
  task: Task;
  isDetailedView?: boolean;
}

export default function TaskListItem({ task, isDetailedView = false }: TaskListItemProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState(task.status);
  const isCompleted = status === "completed";
  
  const deadlineDate = new Date(task.deadline);
  const isValidDate = isValid(deadlineDate);
  const formattedDate = isValidDate ? format(deadlineDate, "MMM dd, yyyy") : "No deadline";
  
  // Determine deadline status
  const isOverdue = isValidDate && isPast(deadlineDate) && !isCompleted;
  const isDueSoon = isValidDate && 
    !isPast(deadlineDate) && 
    new Date().getTime() + 3 * 24 * 60 * 60 * 1000 > deadlineDate.getTime() && 
    !isCompleted;
  
  const updateTaskMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest("PUT", `/api/tasks/${task.id}`, {
        status: newStatus
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/user", task.assignedTo] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: isCompleted ? "Task reopened" : "Task completed",
        description: `The task has been marked as ${isCompleted ? "pending" : "completed"}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      // Revert optimistic update
      setStatus(task.status);
    },
  });

  const handleStatusChange = (checked: boolean) => {
    const newStatus = checked ? "completed" : "pending";
    setStatus(newStatus); // Optimistic update
    updateTaskMutation.mutate(newStatus);
  };

  let statusBadge;
  if (isCompleted) {
    statusBadge = (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
        Complete
      </Badge>
    );
  } else if (isOverdue) {
    statusBadge = (
      <Badge variant="outline" className="bg-red-100 text-red-800">
        Overdue
      </Badge>
    );
  } else if (isDueSoon) {
    statusBadge = (
      <Badge variant="outline" className="bg-amber-100 text-amber-800">
        Due Soon
      </Badge>
    );
  } else if (status === "in_progress") {
    statusBadge = (
      <Badge variant="outline" className="bg-blue-100 text-blue-800">
        In Progress
      </Badge>
    );
  }

  return (
    <li className={isDetailedView ? "px-4 py-3" : "py-3"}>
      <div className="flex items-center">
        <Checkbox 
          id={`task-${task.id}`} 
          checked={isCompleted}
          onCheckedChange={handleStatusChange}
          className="h-4 w-4 text-primary border-neutral-300 rounded"
        />
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <label 
              htmlFor={`task-${task.id}`}
              className={`text-sm font-medium ${
                isCompleted 
                  ? "text-neutral-500 line-through" 
                  : "text-neutral-900"
              }`}
            >
              {task.title}
            </label>
            {statusBadge}
          </div>
          
          {isDetailedView && (
            <p className={`mt-1 text-sm ${isCompleted ? "text-neutral-400" : "text-neutral-600"}`}>
              {task.description}
            </p>
          )}
          
          <div className="flex mt-1">
            <div className="flex items-center text-sm text-neutral-500 mr-4">
              <CalendarDays className="mr-1.5 h-4 w-4 text-neutral-400" />
              <span className={isCompleted ? "text-neutral-400" : ""}>{formattedDate}</span>
            </div>
            <div className="flex items-center text-sm text-neutral-500">
              <User className="mr-1.5 h-4 w-4 text-neutral-400" />
              <span className={isCompleted ? "text-neutral-400" : ""}>
                {task.assignedTo ? `ID: ${task.assignedTo}` : "Unassigned"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
