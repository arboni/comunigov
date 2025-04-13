import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { insertSubjectSchema } from "@shared/schema";
import { apiRequest, invalidateSubjects } from "@/lib/queryClient";

// Components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// Extended schema with validations
const formSchema = insertSubjectSchema
  .omit({ createdBy: true }) // Remove createdBy from validation requirements
  .extend({
    name: z.string().min(3, {
      message: "Subject name must be at least 3 characters",
    }),
    description: z.string().optional(),
  });

type FormValues = z.infer<typeof formSchema>;

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubjectDialog({
  open,
  onOpenChange,
}: SubjectDialogProps) {
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!user) {
        throw new Error("You must be logged in to create a subject");
      }
      
      // Add the current user's ID to the data
      const payload = {
        ...data,
        createdBy: user.id
      };
      
      console.log("Creating subject with data:", payload);
      
      // Use apiRequest which handles errors internally
      const response = await apiRequest("POST", "/api/subjects", payload);
      const result = await response.json();
      console.log("Subject created successfully:", result);
      return result;
    },
    onSuccess: (result) => {
      console.log("Mutation success with result:", result);
      toast({
        title: "Success",
        description: "Subject created successfully",
      });
      // Use the helper function to invalidate subjects cache
      invalidateSubjects();
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error("Create subject mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create subject. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    console.log("Subject form submitted with data:", data);
    console.log("Current user:", user);
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a subject",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Add the user ID directly here too for extra safety
      const payload = {
        ...data,
        createdBy: user.id
      };
      console.log("Submitting payload:", payload);
      
      await createSubjectMutation.mutateAsync(payload);
      console.log("Subject creation was successful");
      
      // Direct API fallback if mutation doesn't work for some reason
      /* 
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Subject created with direct fetch:", result);
      
      // Manual success handling
      toast({
        title: "Success",
        description: "Subject created successfully",
      });
      invalidateSubjects();
      form.reset();
      onOpenChange(false);
      */
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create subject",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Subject</DialogTitle>
          <DialogDescription>
            Add a new subject area for organizing tasks
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="p-4 text-center">
            <p className="text-red-500 mb-4">You must be logged in to create a subject.</p>
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
                
                {/* Authentication info - for debugging */}
                <div className="p-2 bg-blue-50 border border-blue-100 rounded-md text-sm">
                  <p className="font-medium text-blue-700">Authentication Status:</p>
                  <p className="text-blue-600">Logged in as: {user.username} (ID: {user.id})</p>
                  <p className="text-blue-600">Role: {user.role}</p>
                </div>
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
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    if (!user) {
                      toast({
                        title: "Error",
                        description: "You must be logged in to create a subject",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    console.log("Submit button clicked directly");
                    
                    // Get form values
                    const formData = form.getValues();
                    console.log("Form values:", formData);
                    
                    // Direct API call without going through form validation
                    try {
                      setIsSubmitting(true);
                      
                      // Create payload manually with required fields
                      const payload = {
                        name: formData.name,
                        description: formData.description || "",
                        createdBy: user.id,
                      };
                      
                      console.log("Sending direct request with payload:", payload);
                      
                      // Direct fetch request for maximum control
                      const response = await fetch("/api/subjects", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                        credentials: "include",
                      });
                      
                      if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`Server error: ${response.status} - ${errorText}`);
                      }
                      
                      const result = await response.json();
                      console.log("Subject created with direct fetch:", result);
                      
                      // Success handling
                      toast({
                        title: "Success!",
                        description: "Subject created successfully",
                      });
                      
                      // Update cache and UI
                      invalidateSubjects();
                      form.reset();
                      onOpenChange(false);
                    } catch (error) {
                      console.error("Direct API request failed:", error);
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to create subject",
                        variant: "destructive",
                      });
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Subject
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}