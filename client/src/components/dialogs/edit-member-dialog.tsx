import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest, invalidateUsers } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
      
      // If reset password is checked, send a request to reset password
      if (data.resetPassword) {
        // Note: We don't add the password here, we'll make a separate API call
        // to reset the password, which will trigger the email notification
        setPasswordReset(true);
      }
      
      const res = await apiRequest("PUT", `/api/users/${member.id}`, updateData);
      return await res.json();
    },
    onSuccess: async (updatedUser) => {
      // If password reset was requested, make a separate API call
      if (form.getValues("resetPassword")) {
        try {
          // Use the reset password API endpoint with a default password
          await apiRequest("POST", `/api/user/${member.id}/reset-password`, {
            newPassword: "1234" // Default password
          });
          
          // Keep track of password reset for UI notification
          setPasswordReset(true);
        } catch (error) {
          console.error("Failed to reset password:", error);
          toast({
            title: t("entities.members.reset_password_failed"),
            description: t("entities.members.member_updated_but_reset_failed"),
            variant: "destructive",
          });
        }
      }
      
      // Invalidate relevant queries
      invalidateUsers();
      
      // Show success message
      toast({
        title: t("entities.members.member_updated"),
        description: passwordReset 
          ? t("entities.members.password_reset_description") 
          : t("entities.members.member_updated_description"),
      });
      
      // Close dialog
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("entities.members.update_failed"),
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
          <DialogTitle>{t("entities.members.edit_member")}</DialogTitle>
          <DialogDescription>
            {t("entities.members.edit_member_description")}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("entities.members.full_name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("auth.full_name_placeholder")} {...field} />
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
                  <FormLabel>{t("common.email")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t("auth.email_placeholder")} {...field} />
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
                    <FormLabel>{t("entities.members.role")}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("entities.members.select_role")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entity_member">{t("entities.members.role_member")}</SelectItem>
                        <SelectItem value="entity_head">{t("entities.members.role_head")}</SelectItem>
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
                    <FormLabel>{t("entities.members.position")} ({t("common.optional")})</FormLabel>
                    <FormControl>
                      <Input placeholder={t("entities.members.position_placeholder")} {...field} value={field.value || ''} />
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
                  <FormLabel>{t("common.phone")} ({t("common.optional")})</FormLabel>
                  <FormControl>
                    <Input placeholder="+55 11 98765-4321" {...field} value={field.value || ''} />
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
                    <FormLabel>{t("entities.members.reset_password")}</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      {t("entities.members.reset_password_description")}
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            {passwordReset && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
                <p>{t("entities.members.welcome_email_sent")}</p>
                <p className="mt-1 font-medium">{t("entities.members.password_change_required")}</p>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={editMemberMutation.isPending}
              >
                {editMemberMutation.isPending ? t("entities.members.updating") : t("entities.members.update_member")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}