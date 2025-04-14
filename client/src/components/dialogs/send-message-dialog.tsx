import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, MessageSquare, Send, Bell, Users, User, Building, Upload, FileIcon, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useRef } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  channel: z.enum(["email", "whatsapp", "telegram", "system_notification"], {
    required_error: "Channel is required",
  }),
  recipientType: z.enum(["users", "entities"]),
  selectedUsers: z.array(z.number()).optional(),
  selectedEntities: z.array(z.number()).optional(),
}).refine(
  (data) => {
    if (data.recipientType === "users") {
      return (data.selectedUsers?.length || 0) > 0;
    } else {
      return (data.selectedEntities?.length || 0) > 0;
    }
  },
  {
    message: "Please select at least one recipient",
    path: ["selectedUsers"],
  }
);

type FormValues = z.infer<typeof formSchema>;

export default function SendMessageDialog({
  open,
  onOpenChange,
}: SendMessageDialogProps) {
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  
  // Fetch users for recipient selection
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Fetch entities for recipient selection
  const { data: entities } = useQuery({
    queryKey: ["/api/entities"],
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      content: "",
      channel: "email",
      recipientType: "users",
      selectedUsers: [],
      selectedEntities: [],
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Prepare recipients array based on selection
      const recipients = data.recipientType === "users"
        ? (data.selectedUsers || []).map(userId => ({ userId }))
        : (data.selectedEntities || []).map(entityId => ({ entityId }));
      
      const res = await apiRequest("POST", "/api/communications", {
        subject: data.subject,
        content: data.content,
        channel: data.channel,
        sentBy: user?.id,
        recipients,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    sendMessageMutation.mutate(data);
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4 mr-2" />;
      case "whatsapp":
      case "telegram":
        return <MessageSquare className="h-4 w-4 mr-2" />;
      case "system_notification":
        return <Bell className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Compose and send a message to users or entities in your organization.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Important Meeting Reminder" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your message here..." 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Communication Channel</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="telegram">
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Telegram
                        </div>
                      </SelectItem>
                      <SelectItem value="system_notification">
                        <div className="flex items-center">
                          <Bell className="h-4 w-4 mr-2" />
                          System Notification
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="recipientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Type</FormLabel>
                  <FormDescription>
                    Choose to send to individual users or entire entities
                  </FormDescription>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="users" className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Users
                        </TabsTrigger>
                        <TabsTrigger value="entities" className="flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Entities
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="users" className="mt-4">
                        <FormField
                          control={form.control}
                          name="selectedUsers"
                          render={({ field }) => (
                            <FormItem>
                              <div className="mb-4">
                                <FormLabel className="text-base">Select Users</FormLabel>
                                <FormDescription>
                                  Select the users you want to send this message to.
                                </FormDescription>
                              </div>
                              
                              <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                                {users && users.length > 0 ? (
                                  <div className="space-y-2">
                                    {users.map((user) => (
                                      <FormItem
                                        key={user.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(user.id)}
                                            onCheckedChange={(checked) => {
                                              const currentValues = field.value || [];
                                              if (checked) {
                                                field.onChange([...currentValues, user.id]);
                                              } else {
                                                field.onChange(
                                                  currentValues.filter((value) => value !== user.id)
                                                );
                                              }
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal flex items-center justify-between w-full">
                                          <span>{user.fullName}</span>
                                          <Badge variant="outline" className="ml-2">
                                            {user.role === 'master_implementer' ? 'Master Implementer' :
                                             user.role === 'entity_head' ? 'Entity Head' : 'Entity Member'}
                                          </Badge>
                                        </FormLabel>
                                      </FormItem>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-neutral-500">No users available.</p>
                                )}
                              </div>
                              
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                      
                      <TabsContent value="entities" className="mt-4">
                        <FormField
                          control={form.control}
                          name="selectedEntities"
                          render={({ field }) => (
                            <FormItem>
                              <div className="mb-4">
                                <FormLabel className="text-base">Select Entities</FormLabel>
                                <FormDescription>
                                  Select the entities you want to send this message to. All members of the entity will receive it.
                                </FormDescription>
                              </div>
                              
                              <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                                {entities && entities.length > 0 ? (
                                  <div className="space-y-2">
                                    {entities.map((entity) => (
                                      <FormItem
                                        key={entity.id}
                                        className="flex flex-row items-start space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(entity.id)}
                                            onCheckedChange={(checked) => {
                                              const currentValues = field.value || [];
                                              if (checked) {
                                                field.onChange([...currentValues, entity.id]);
                                              } else {
                                                field.onChange(
                                                  currentValues.filter((value) => value !== entity.id)
                                                );
                                              }
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-normal flex items-center justify-between w-full">
                                          <span>{entity.name}</span>
                                          <Badge variant="outline" className="ml-2">
                                            {entity.type.replace("_", " ")}
                                          </Badge>
                                        </FormLabel>
                                      </FormItem>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-neutral-500">No entities available.</p>
                                )}
                              </div>
                              
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex items-center gap-2"
                disabled={sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
