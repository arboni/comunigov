import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useToast } from "@/hooks/use-toast";
import { insertSubjectSchema, insertSubjectEntitySchema } from "@shared/schema";
import { apiRequest, invalidateSubjects } from "@/lib/queryClient";
import { reloadPage } from "@/lib/utils";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [selectedEntityIds, setSelectedEntityIds] = useState<number[]>([]);
  
  // Define entity interface
  interface Entity {
    id: number;
    name: string;
    type: string;
    headName: string;
    headPosition: string;
    address: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    headEmail: string | null;
    socialMedia: string | null;
    tags: string[] | null;
  }
  
  // Helper function to decode HTML entities and fix encoding issues
  function decodeEntities(text: string): string {
    if (!text) return '';
    
    // Replace common encoding issues with proper characters
    return text
      .replace(/Associa��o/g, 'Associação')
      .replace(/��/g, 'ção');
  }
  
  // Fetch entities
  const { data: entities, isLoading: isLoadingEntities } = useQuery<Entity[]>({
    queryKey: ['/api/entities'],
    enabled: open, // Only fetch when dialog is open
    select: (data) => {
      if (!data) return [];
      
      return data.map((entity) => ({
        ...entity,
        // Ensure entity name is properly decoded if it contains special characters
        name: entity.name ? decodeEntities(entity.name) : entity.name,
      }));
    }
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Create subject mutation
  // Create subject-entity relationship mutation
  const createSubjectEntityMutation = useMutation({
    mutationFn: async ({ subjectId, entityIds }: { subjectId: number; entityIds: number[] }) => {
      if (!entityIds.length) return { success: true };
      
      // Use the correct endpoint to create subject-entity relationships
      const payload = { entityIds };
      const response = await apiRequest("POST", `/api/subjects/${subjectId}/entities`, payload);
      const result = await response.json();
      return { success: true, result };
    }
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
      
      // If we have selected entities, create the subject-entity relationships
      if (selectedEntityIds.length > 0) {
        await createSubjectEntityMutation.mutateAsync({ 
          subjectId: result.id, 
          entityIds: selectedEntityIds 
        });
      }
      
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
      setSelectedEntityIds([]);
      onOpenChange(false);
      
      // Reload page to show updated subjects
      reloadPage(1500, "/subjects");
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
      <DialogContent className="sm:max-w-[700px] md:max-w-[800px] max-h-[90vh]">
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
                
                {/* Entity Selection */}
                <FormItem>
                  <FormLabel>Involved Entities</FormLabel>
                  <FormDescription>
                    Select entities that are involved with this subject
                  </FormDescription>
                  
                  {isLoadingEntities ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !entities || entities.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2 bg-slate-50 rounded-md">
                      No entities available.
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <ScrollArea className="h-[200px] p-2">
                        <div className="space-y-2">
                          {entities.map((entity) => (
                            <div key={entity.id} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-md">
                              <Checkbox 
                                id={`entity-${entity.id}`}
                                checked={selectedEntityIds.includes(entity.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedEntityIds([...selectedEntityIds, entity.id]);
                                  } else {
                                    setSelectedEntityIds(selectedEntityIds.filter(id => id !== entity.id));
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`entity-${entity.id}`}
                                className="flex-1 text-sm cursor-pointer"
                              >
                                <span className="font-medium">{entity.name}</span>
                                <div className="text-xs text-slate-500">
                                  {entity.type} • {entity.headName && `Head: ${entity.headName}`}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  {/* Selected entities badges */}
                  {selectedEntityIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedEntityIds.map(entityId => {
                        const entity = entities?.find(e => e.id === entityId);
                        return entity ? (
                          <Badge 
                            key={entityId} 
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {entity.name}
                            <button 
                              onClick={() => setSelectedEntityIds(selectedEntityIds.filter(id => id !== entityId))}
                              className="h-3 w-3 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 flex items-center justify-center"
                            >
                              <span className="sr-only">Remove</span>
                              ×
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </FormItem>
                
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
                      
                      // Create subject-entity relationships if there are selected entities
                      if (selectedEntityIds.length > 0) {
                        console.log(`Creating subject-entity relationships for subject ${result.id} with entities:`, selectedEntityIds);
                        
                        // Use the correct endpoint to create relationships
                        const entityPayload = {
                          entityIds: selectedEntityIds
                        };
                        
                        try {
                          const entityResponse = await fetch(`/api/subjects/${result.id}/entities`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(entityPayload),
                            credentials: "include",
                          });
                          
                          if (!entityResponse.ok) {
                            console.warn(`Failed to create subject-entity relationships: ${entityResponse.status}`);
                          } else {
                            const entityResults = await entityResponse.json();
                            console.log("Created subject-entity relationships:", entityResults);
                          }
                        } catch (error) {
                          console.error("Error creating subject-entity relationships:", error);
                        }
                      }
                      
                      // Success handling
                      toast({
                        title: "Success!",
                        description: "Subject created successfully",
                      });
                      
                      // Update cache and UI
                      invalidateSubjects();
                      form.reset();
                      onOpenChange(false);
                      
                      // Reload page to show updated subjects
                      reloadPage(1500, "/subjects");
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