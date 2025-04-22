import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import NoWhatsAppDialog from "@/components/communication/no-whatsapp-dialog";
import CallMeBotReminder from "@/components/communication/callmebot-reminder";
import { reloadPage } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  User,
  Mail,
  Bell,
  MessageSquare,
  Upload,
  X,
  FileIcon,
  Send,
} from "lucide-react";

const formSchema = z.object({
  subject: z.string().min(2, {
    message: "O assunto deve ter pelo menos 2 caracteres.",
  }),
  content: z.string().min(10, {
    message: "O conteúdo da mensagem deve ter pelo menos 10 caracteres.",
  }),
  channel: z.enum(["email", "whatsapp", "telegram", "system_notification"]),
  recipientType: z.enum(["users", "entities"]),
  selectedUsers: z.array(z.number()).optional(),
  selectedEntities: z.array(z.number()).optional(),
  files: z.array(z.any()).optional(),
});

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormValues = z.infer<typeof formSchema>;

export default function SendMessageDialog({
  open,
  onOpenChange,
}: SendMessageDialogProps) {
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  const { t } = useTranslation();
  
  // State to manage the no-whatsapp dialog
  const [noWhatsAppDialogOpen, setNoWhatsAppDialogOpen] = useState(false);
  const [recipientsWithoutWhatsApp, setRecipientsWithoutWhatsApp] = useState<string[]>([]);
  const [pendingSubmission, setPendingSubmission] = useState<FormValues | null>(null);
  
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
        title: t('communications.send_success'),
        description: t('notifications.success.sent', { item: t('communications.subject').toLowerCase() }),
      });
      form.reset();
      onOpenChange(false);
      
      // Reload page to show updated communications
      reloadPage(1500, "/communications");
    },
    onError: (error: Error) => {
      toast({
        title: t('communications.send_error'),
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
  
  // Function to process the actual submission
  const processSubmission = (data: FormValues) => {
    data.files = selectedFiles;
    sendMessageMutation.mutate(data);
  };
  
  // Handle form submission with WhatsApp validation
  function onSubmit(data: FormValues) {
    // If channel is WhatsApp, verify that recipients have WhatsApp numbers
    if (data.channel === "whatsapp") {
      const missingWhatsAppRecipients: string[] = [];
      
      // Check users for missing WhatsApp numbers
      if (data.recipientType === "users" && data.selectedUsers && data.selectedUsers.length > 0) {
        data.selectedUsers.forEach(userId => {
          const user = users?.find((u: any) => u.id === userId);
          if (user && (!user.whatsapp || user.whatsapp.trim() === '')) {
            missingWhatsAppRecipients.push(user.fullName || user.username);
          }
        });
      }
      
      // Check entities members for missing WhatsApp numbers
      // Note: This is a simplified check - in a real app you'd want to check all entity members
      else if (data.recipientType === "entities" && data.selectedEntities && data.selectedEntities.length > 0) {
        data.selectedEntities.forEach(entityId => {
          const entity = entities?.find((e: any) => e.id === entityId);
          if (entity) {
            missingWhatsAppRecipients.push(`${entity.name} (${t('common.entity')})`);
          }
        });
      }
      
      // If some recipients don't have WhatsApp, show the warning dialog
      if (missingWhatsAppRecipients.length > 0) {
        setRecipientsWithoutWhatsApp(missingWhatsAppRecipients);
        setPendingSubmission(data);
        setNoWhatsAppDialogOpen(true);
        return;
      }
    }
    
    // If not WhatsApp or all recipients have WhatsApp numbers, proceed with submission
    processSubmission(data);
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

  // Handle dialog closure
  const handleNoWhatsAppDialogClose = () => {
    setNoWhatsAppDialogOpen(false);
  };
  
  // Handle continuing with the send anyway
  const handleContinueAnyway = () => {
    if (pendingSubmission) {
      processSubmission(pendingSubmission);
    }
    setNoWhatsAppDialogOpen(false);
  };
  
  return (
    <div>
      {/* Dialog to warn about recipients without WhatsApp */}
      <NoWhatsAppDialog 
        open={noWhatsAppDialogOpen} 
        onClose={handleNoWhatsAppDialogClose}
        recipientsWithoutWhatsApp={recipientsWithoutWhatsApp}
      />
      
      {/* Main message sending dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90%] sm:w-[80%] md:w-[70%] max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>{t('communications.send_communication')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.send_message')}
            </DialogDescription>
          </DialogHeader>
          
          {/* Show CallMeBot reminder when WhatsApp is selected */}
          {form.watch("channel") === "whatsapp" && (
            <CallMeBotReminder />
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Two-column grid layout for desktop, single column for mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('communications.subject')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('entities.head_name_placeholder')} {...field} />
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
                      <FormLabel>{t('communications.channel')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('communications.select_channel')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2" />
                              {t('communications.channels.email')}
                            </div>
                          </SelectItem>
                          <SelectItem value="whatsapp">
                            <div className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {t('communications.channels.whatsapp')}
                            </div>
                          </SelectItem>
                          <SelectItem value="telegram">
                            <div className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {t('communications.channels.telegram')}
                            </div>
                          </SelectItem>
                          <SelectItem value="system_notification">
                            <div className="flex items-center">
                              <Bell className="h-4 w-4 mr-2" />
                              {t('communications.channels.system_notification')}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Display CallMeBot reminder when WhatsApp is selected */}
                {form.watch("channel") === "whatsapp" && (
                  <div className="mt-3">
                    <CallMeBotReminder />
                  </div>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('communications.content')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('communications.write_message')} 
                        className="min-h-40"
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
                        <FormLabel>{t('communications.attachments')}</FormLabel>
                        <FormDescription>
                          {t('communications.add_attachments')}
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
                          {t('communications.add_files')}
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
                    <FormLabel>{t('communications.recipient_type')}</FormLabel>
                    <FormDescription>
                      {t('communications.choose_recipients')}
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
                            {t('common.users')}
                          </TabsTrigger>
                          <TabsTrigger value="entities" className="flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            {t('common.entities')}
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="users" className="mt-4">
                          <FormField
                            control={form.control}
                            name="selectedUsers"
                            render={({ field }) => (
                              <FormItem>
                                <div className="mb-4">
                                  <FormLabel className="text-base">{t('communications.select_users')}</FormLabel>
                                  <FormDescription>
                                    {t('communications.select_users_description')}
                                  </FormDescription>
                                </div>
                                
                                <div className="border rounded-md p-4 max-h-80 overflow-y-auto">
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
                                          <FormLabel className="text-sm font-normal flex items-center justify-between w-full flex-wrap">
                                            <span className="mr-auto">{user.fullName}</span>
                                            <Badge variant="outline" className="ml-1 flex-shrink-0">
                                              {user.role === 'master_implementer' ? t('users.roles.master_implementer') :
                                               user.role === 'entity_head' ? t('users.roles.entity_head') : t('users.roles.entity_member')}
                                            </Badge>
                                          </FormLabel>
                                        </FormItem>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-neutral-500">{t('communications.no_users_available')}</p>
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
                                  <FormLabel className="text-base">{t('communications.select_entities')}</FormLabel>
                                  <FormDescription>
                                    {t('communications.select_entities_description')}
                                  </FormDescription>
                                </div>
                                
                                <div className="border rounded-md p-4 max-h-80 overflow-y-auto">
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
                                          <FormLabel className="text-sm font-normal flex items-center justify-between w-full flex-wrap">
                                            <span className="mr-auto">{entity.name}</span>
                                            <Badge variant="outline" className="ml-1 flex-shrink-0">
                                              {t(`entities.types.${entity.type}`)}
                                            </Badge>
                                          </FormLabel>
                                        </FormItem>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-neutral-500">{t('communications.no_entities_available')}</p>
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
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className="flex items-center gap-2"
                  disabled={sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    t('communications.sending')
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {t('communications.send_message')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}