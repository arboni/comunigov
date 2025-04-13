import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Subject } from "@shared/schema";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SubjectViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject;
}

export default function SubjectViewDialog({
  open,
  onOpenChange,
  subject,
}: SubjectViewDialogProps) {
  // Fetch related tasks
  const { data: relatedTasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks", { subjectId: subject.id }],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?subjectId=${subject.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch related tasks");
      }
      return response.json();
    },
    enabled: open && !!subject.id,
  });

  // Fetch user details of the creator
  const { data: creator, isLoading: isLoadingCreator } = useQuery({
    queryKey: ["/api/users", subject.createdBy],
    queryFn: async () => {
      const response = await fetch(`/api/users/${subject.createdBy}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }
      return response.json();
    },
    enabled: open && !!subject.createdBy,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{subject.name}</DialogTitle>
          <DialogDescription>
            Subject details and related information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Subject Details */}
          <div>
            <h3 className="text-sm font-medium text-neutral-500 mb-2">Description</h3>
            <p className="text-neutral-900">
              {subject.description || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-2">Created By</h3>
              {isLoadingCreator ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <p className="text-neutral-900">
                  {creator?.fullName || `User ID: ${subject.createdBy}`}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-2">Created At</h3>
              <p className="text-neutral-900">
                {format(new Date(subject.createdAt), "PPpp")}
              </p>
            </div>
          </div>

          {/* Related Tasks */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Related Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : relatedTasks.length === 0 ? (
                <p className="text-neutral-500 text-sm">No tasks associated with this subject.</p>
              ) : (
                <ul className="space-y-2">
                  {relatedTasks.map((task: any) => (
                    <li key={task.id} className="flex justify-between items-center p-2 border-b border-neutral-100 last:border-0">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant={
                          task.status === "completed" ? "secondary" : 
                          task.status === "in_progress" ? "outline" : 
                          "default"
                      }>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}