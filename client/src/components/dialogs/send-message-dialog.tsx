import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Mail, MessageSquare, Send, Bell, Users, User, Building, Upload, FileIcon, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { reloadPage } from "@/lib/utils";
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
  files: z.array(z.object({
    file: z.any(), // Actual file object
    name: z.string(),
    size: z.number(),
    type: z.string(),
  })).optional(),
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
  
  const [selectedFiles, setSelectedFiles] = useState<Array<{
    file: File;
    name: string;
    size: number;
    type: string;
  }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      content: "",
      channel: "email",
      recipientType: "users",
      selectedUsers: [],
      selectedEntities: [],
      files: [],
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Prepare recipients array based on selection
      const recipients = data.recipientType === "users"
        ? (data.selectedUsers || []).map(userId => ({ userId }))
        : (data.selectedEntities || []).map(entityId => ({ entityId }));
      
      // Create the communication
      const res = await apiRequest("POST", "/api/communications", {
        subject: data.subject,
        content: data.content,
        channel: data.channel,
        sentBy: user?.id,
        recipients,
      });
      
      const communication = await res.json();
      
      // If we have files, upload them
      if (data.files && data.files.length > 0) {
        const formData = new FormData();
        
        // Add the communication ID
        formData.append('communicationId', communication.id.toString());
        
        // Add each file
        data.files.forEach((fileData, index) => {
          formData.append(`file-${index}`, fileData.file);
        });
        
        // Send the files
        await fetch('/api/communication-files', {
          method: 'POST',
          body: formData,
        });
      }
      
      return communication;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      form.reset();
      onOpenChange(false);
      
      // Reload page to show updated communications
      reloadPage(1500, "/communications");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type
      }));
      
      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);
      
      // Update form value
      form.setValue('files', updatedFiles);
    }
  };
  
  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    form.setValue('files', updatedFiles);
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  function onSubmit(data: FormValues) {
    data.files = selectedFiles;
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
            {/* Two-column grid layout for desktop, single column for mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your message here..." 
                      className="min-h-28"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="files"
              render={() => (
                <FormItem>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
                    <div>
                      <FormLabel>Attachments</FormLabel>
                      <FormDescription>
                        Add files to be attached to the message
                      </FormDescription>
                    </div>
                    
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        multiple
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4" />
                        Add Files
                      </Button>
                    </div>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="border rounded-md p-3 space-y-2 mt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center space-x-2 overflow-hidden">
                              <FileIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                              <div className="text-sm overflow-hidden">
                                <div className="font-medium truncate">{file.name}</div>
                                <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                              </div>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeFile(index)} 
                              className="h-6 w-6 flex-shrink-0 ml-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                                {users && Array.isArray(users) && users.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {users.map((user: any) => (
                                      <FormItem
                                        key={user.id}
                                        className="flex flex-row items-start space-x-3 space-y-0 m-0"
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
                                        <FormLabel className="text-sm font-normal flex items-center justify-between w-full overflow-hidden">
                                          <span className="truncate">{user.fullName}</span>
                                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                                            {user.role === 'master_implementer' ? 'Master' :
                                             user.role === 'entity_head' ? 'Head' : 'Member'}
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
                                {entities && Array.isArray(entities) && entities.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {entities.map((entity: any) => (
                                      <FormItem
                                        key={entity.id}
                                        className="flex flex-row items-start space-x-3 space-y-0 m-0"
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
                                        <FormLabel className="text-sm font-normal flex items-center justify-between w-full overflow-hidden">
                                          <span className="truncate">{entity.name}</span>
                                          <Badge variant="outline" className="ml-2 flex-shrink-0">
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
