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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: number;
  member: any; // The member/user to edit
}

// Form schema for editing a member
const formSchema = z.object({
  email: z.string().email("Invalid email format"),
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  role: z.enum(["entity_head", "entity_member"]).default("entity_member"),
  position: z.string().optional(),
  phone: z.string().optional(),
  resetPassword: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditMemberDialog({
  open,
  onOpenChange,
  entityId,
  member,
}: EditMemberDialogProps) {
  const { toast } = useToast();
  const [passwordReset, setPasswordReset] = useState(false);
  
  // Form setup with member data as default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: member?.email || "",
      fullName: member?.fullName || "",
      role: (member?.role as "entity_head" | "entity_member") || "entity_member",
      position: member?.position || "",
      phone: member?.phone || "",
      resetPassword: false,
    },
  });

  // Edit member mutation
  const editMemberMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Prepare the update data
      const updateData: any = {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        position: data.position || null,
        phone: data.phone || null,
      };
      
      // If reset password is checked, set a default password
      if (data.resetPassword) {
        updateData.password = "1234"; // Default password that will be sent to user to change
        setPasswordReset(true);
      }
      
      const res = await apiRequest("PUT", `/api/users/${member.id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      invalidateUsers();
      
      // Show success message
      toast({
        title: "Member updated",
        description: passwordReset 
          ? "Member has been updated and their password has been reset." 
          : "Member has been successfully updated.",
      });
      
      // Close dialog
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    editMemberMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Update member information or reset their password.
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
            
            <FormField
              control={form.control}
              name="resetPassword"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Reset Password</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This will reset the member's password to a default value and they will be notified to change it.
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            {passwordReset && (
              <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                <p>An email would be sent to the member with instructions to reset their password.</p>
                <p className="mt-1 font-medium">Note: In this demo, emails are not actually sent.</p>
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
                disabled={editMemberMutation.isPending}
              >
                {editMemberMutation.isPending ? "Updating..." : "Update Member"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}