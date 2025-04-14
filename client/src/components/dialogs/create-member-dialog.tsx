import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, invalidateUsers } from "@/lib/queryClient";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: number;
}

// Form schema for creating a new member
const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  role: z.enum(["entity_head", "entity_member"]).default("entity_member"),
  position: z.string().optional(),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateMemberDialog({
  open,
  onOpenChange,
  entityId,
}: CreateMemberDialogProps) {
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      role: "entity_member",
      position: "",
      phone: "",
    },
  });

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Add entityId and default password to the data
      const memberData = {
        ...data,
        entityId,
        password: "1234" // Default password that will be sent to user to change
      };
      
      console.log('Sending member data:', memberData);
      
      try {
        // Use direct fetch instead of apiRequest for better error handling
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(memberData),
          credentials: 'include',
        });
        
        // Check if response is ok
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create member');
          } else {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error('Server error: ' + response.status);
          }
        }
        
        // Parse response as JSON
        const newUser = await response.json();
        
        // The welcome email is now automatically sent by the server
        // through SendGrid when a new member is added
        setEmailSent(true);
        
        return newUser;
      } catch (error) {
        console.error('Error creating member:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      invalidateUsers();
      
      // Show success message
      toast({
        title: "Member created",
        description: "New member has been successfully created.",
      });
      
      // Reset form
      form.reset();
      
      // Close dialog
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    createMemberMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Member</DialogTitle>
          <DialogDescription>
            Add a new member to this entity. They will receive an email to set up their account.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entity_member">Member</SelectItem>
                        <SelectItem value="entity_head">Entity Head</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Analyst" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 234 567 8901" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {emailSent && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
                <p>A welcome email has been sent to the member with their temporary password and instructions.</p>
                <p className="mt-1 font-medium">The member will need to change their password after first login.</p>
              </div>
            )}
            
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
                disabled={createMemberMutation.isPending}
              >
                {createMemberMutation.isPending ? "Creating..." : "Create Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}