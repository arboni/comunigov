import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { insertSubjectSchema, Subject } from "@shared/schema";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useTranslation } from "@/hooks/use-translation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Extended schema with validations
// Type to hold only the fields we want to edit
const editSubjectSchema = z.object({
  name: z.string().min(3, {
    message: "Subject name must be at least 3 characters",
  }),
  description: z.string().optional(),
});

// Use this schema for the form
const formSchema = editSubjectSchema;

type FormValues = z.infer<typeof formSchema>;

interface SubjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject;
}

export default function SubjectEditDialog({
  open,
  onOpenChange,
  subject,
}: SubjectEditDialogProps) {
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntityIds, setSelectedEntityIds] = useState<number[]>([]);
  const { t } = useTranslation();

  // Fetch all entities for selection
  const { data: entities, isLoading: isLoadingEntities } = useQuery({
    queryKey: ["/api/entities"],
    enabled: open,
  });

  // Fetch entities currently associated with this subject
  const { data: subjectEntities, isLoading: isLoadingSubjectEntities } = useQuery({
    queryKey: [`/api/subjects/${subject.id}/entities`],
    enabled: open && !!subject.id,
  });

  // Initialize selected entities when data loads
  useEffect(() => {
    if (subjectEntities && Array.isArray(subjectEntities)) {
      const entityIds = subjectEntities.map((entity: any) => entity.id);
      setSelectedEntityIds(entityIds);
    }
  }, [subjectEntities]);
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subject.name,
      description: subject.description || "",
    },
  });

  // Update subject mutation
  const updateSubjectMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!user) {
        throw new Error("You must be logged in to update a subject");
      }
      
      console.log("Updating subject with data:", data);
      
      // Direct fetch request for maximum control
      const response = await fetch(`/api/subjects/${subject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      // Invalidate subjects query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: "Success",
        description: "Subject updated successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Update subject mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await updateSubjectMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Update the subject information
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="p-4 text-center">
            <p className="text-red-500 mb-4">You must be logged in to edit a subject.</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 py-4">
                {/* Subject Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter subject name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name for this category of tasks
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subject Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe this subject area"
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}