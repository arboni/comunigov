import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, invalidateEntities, invalidateDashboardStats } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Entity, insertEntitySchema } from "@shared/schema";

interface EditEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: number;
  entity: Entity;
}

const formSchema = insertEntitySchema.extend({
  tags: z.string().optional()
}).transform(data => {
  // Convert string tags to array
  const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()) : [];
  return {
    ...data,
    tags: tagsArray,
  };
});

type FormValues = z.input<typeof formSchema>;

export default function EditEntityDialog({
  open,
  onOpenChange,
  entityId,
  entity,
}: EditEntityDialogProps) {
  const { toast } = useToast();
  
  // Convert tags array to comma-separated string for the form
  const tagsString = entity.tags ? entity.tags.join(', ') : '';
  
  // Set up form with the current entity data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: entity.name,
      type: entity.type,
      headName: entity.headName,
      headPosition: entity.headPosition,
      headEmail: entity.headEmail,
      address: entity.address || '',
      phone: entity.phone || '',
      website: entity.website || '',
      socialMedia: entity.socialMedia || '',
      tags: tagsString,
    },
  });

  const updateEntityMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("PUT", `/api/entities/${entityId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      invalidateEntities();
      invalidateDashboardStats();
      
      toast({
        title: "Entity updated",
        description: "The entity has been successfully updated.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    updateEntityMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Entity</DialogTitle>
          <DialogDescription>
            Update the entity details. All fields are required unless marked as optional.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Finance Department" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entity Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="secretariat">Secretariat</SelectItem>
                      <SelectItem value="administrative_unit">Administrative Unit</SelectItem>
                      <SelectItem value="external_entity">External Entity</SelectItem>
                      <SelectItem value="government_agency">Government Agency</SelectItem>
                      <SelectItem value="association">Association</SelectItem>
                      <SelectItem value="council">Council</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="headName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="headPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head Position</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Director" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="headEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Head Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="e.g. john.smith@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +1 234 567 8901" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. www.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 123 Main St, City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="socialMedia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Social Media (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. @entityhandle" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated, Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. finance, budget, accounting" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateEntityMutation.isPending}
              >
                {updateEntityMutation.isPending ? "Updating..." : "Update Entity"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}