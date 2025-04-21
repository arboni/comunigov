import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Users, BookOpen, Upload, FileIcon, X } from "lucide-react";
import { apiRequest, queryClient, invalidateMeetings, invalidateDashboardStats } from "@/lib/queryClient";
import { SubjectsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { useTranslation } from "@/hooks/use-translation";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn, reloadPage } from "@/lib/utils";

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeOptions = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
];

const formSchema = z.object({
  name: z.string().min(3, {
    message: "meetings.form.validation.name_min_length"
  }),
  agenda: z.string().min(10, {
    message: "meetings.form.validation.agenda_min_length"
  }),
  date: z.date({
    required_error: "meetings.form.validation.date_required",
  }),
  startTime: z.string({
    required_error: "meetings.form.validation.start_time_required",
  }),
  endTime: z.string({
    required_error: "meetings.form.validation.end_time_required",
  }),
  location: z.string().optional(),
  subject: z.string().optional(),
  isRegisteredSubject: z.boolean().default(false),
  subjectId: z.number().optional(),
  attendees: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ScheduleMeetingDialog({
  open,
  onOpenChange,
}: ScheduleMeetingDialogProps) {
  const { toast } = useToast();
  const { user } = useSimpleAuth();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Array<{name: string; size: number; type: string; file: File}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  
  // Fetch users for the attendee selection
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Fetch subjects for the subject selection
  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
  });
  
  // Fetch task users when a subject is selected
  const { data: subjectUsers = [] } = useQuery({
    queryKey: ["/api/subjects", selectedSubjectId, "users"],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      return await SubjectsApi.getUsersForSubjectTasks(selectedSubjectId);
    },
    enabled: !!selectedSubjectId,
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      agenda: "",
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      subject: "",
      isRegisteredSubject: false,
      subjectId: undefined,
      attendees: [],
    },
  });
  
  // Effect to update attendees when subject users are loaded
  useEffect(() => {
    if (subjectUsers && subjectUsers.length > 0) {
      const currentAttendees = form.getValues().attendees || [];
      const userIds = subjectUsers.map((user: any) => user.id);
      
      // Combine current attendees with new users from the subject
      const combinedAttendees = [...currentAttendees, ...userIds];
      const uniqueAttendees = Array.from(new Set(combinedAttendees));
      
      form.setValue('attendees', uniqueAttendees);
    }
  }, [subjectUsers, form]);

  const scheduleMeetingMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/meetings", {
        ...data,
        createdBy: user?.id,
      });
      return await res.json();
    },
    onSuccess: async (meeting) => {
      // If attendees were selected, add them to the meeting
      const attendees = form.getValues().attendees || [];
      
      try {
        // Use Promise.allSettled to continue with other attendees even if some fail
        if (attendees.length > 0) {
          const results = await Promise.allSettled(
            attendees.map(async (userId) => {
              try {
                const response = await apiRequest("POST", `/api/meetings/${meeting.id}/attendees`, {
                  userId,
                  meetingId: meeting.id,
                  confirmed: false,
                  attended: false,
                });
                return { status: 'success', userId };
              } catch (err: any) {
                // Check if this is a duplicate attendee (400 status)
                if (err.message && err.message.startsWith('400:')) {
                  console.log(`Attendee ${userId} is already in meeting ${meeting.id}`);
                  return { status: 'duplicate', userId };
                }
                throw err;
              }
            })
          );
          
          // Count successes and duplicates
          const successes = results.filter(r => r.status === 'fulfilled').length;
          const duplicates = results.filter(r => 
            r.status === 'fulfilled' && 
            (r.value as any).status === 'duplicate'
          ).length;
          
          if (duplicates > 0) {
            console.log(`${duplicates} duplicate attendees were skipped`);
          }
        }
        
        // Upload files if any were selected
        if (selectedFiles.length > 0) {
          try {
            await uploadMeetingFiles(meeting.id);
          } catch (error) {
            console.error("Error uploading meeting files:", error);
            toast({
              title: t('meetings.toast.meeting_files_issue'),
              description: t('meetings.toast.meeting_files_issue_description'),
              variant: "destructive",
            });
          }
        }
        
        // After all operations are completed, invalidate the queries to refresh the data
        await invalidateMeetings();
        await invalidateDashboardStats();
        
        toast({
          title: t('meetings.toast.meeting_scheduled'),
          description: t('meetings.toast.meeting_scheduled_description'),
        });
        form.reset();
        setSelectedFiles([]);
        onOpenChange(false);
        
        // Reload the page to reflect changes
        reloadPage(1500, "/meetings");
      } catch (error) {
        console.error("Error adding attendees:", error);
        toast({
          title: t('meetings.toast.meeting_created_attendee_issue'),
          description: t('meetings.toast.meeting_created_attendee_issue_description'),
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Meeting scheduling error:", error);
      toast({
        title: t('meetings.toast.scheduling_failed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const newFiles = Array.from(event.target.files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    
    // Check if adding these files would exceed the 5-file limit
    if (selectedFiles.length + newFiles.length > 5) {
      toast({
        title: t('meetings.toast.file_limit_exceeded'),
        description: t('meetings.toast.file_limit_exceeded_description'),
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFiles([...selectedFiles, ...newFiles]);
    
    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove a file from the selected files
  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
  };
  
  // Upload files after meeting creation
  const uploadMeetingFiles = async (meetingId: number) => {
    if (selectedFiles.length === 0) return;
    
    try {
      const formData = new FormData();
      
      // Add meeting ID to form data
      formData.append('meetingId', meetingId.toString());
      
      // Request that emails be sent with the attachments after upload
      formData.append('sendEmails', 'true');
      
      // Add all files to form data
      selectedFiles.forEach((fileData, index) => {
        formData.append(`file-${index}`, fileData.file);
      });
      
      // Upload files
      const response = await fetch('/api/meeting-documents', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload meeting documents');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading meeting documents:', error);
      throw error;
    }
  };
  
  async function onSubmit(data: FormValues) {
    console.log("Form data being submitted:", data);
    scheduleMeetingMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('meetings.dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('meetings.dialog.description')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('meetings.form.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('meetings.form.name_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="agenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('meetings.form.agenda')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('meetings.form.agenda_placeholder')}
                      className="min-h-24"
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
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('meetings.form.date')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t('meetings.form.pick_a_date')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setSelectedDate(date);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('meetings.form.location')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('meetings.form.location_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('meetings.form.start_time')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('meetings.form.select_start_time')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={`start-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('meetings.form.end_time')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('meetings.form.select_end_time')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isRegisteredSubject"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t('meetings.form.use_registered_subject')}
                    </FormLabel>
                    <FormDescription>
                      {t('meetings.form.use_registered_subject_description')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          // Clear subject-related fields if switching back to free-form subject
                          form.setValue('subjectId', undefined);
                          setSelectedSubjectId(null);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.watch('isRegisteredSubject') ? (
              <FormField
                control={form.control}
                name="subjectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {t('meetings.form.select_subject')}
                      </span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const subjectId = parseInt(value, 10);
                        field.onChange(subjectId);
                        setSelectedSubjectId(subjectId);
                      }}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('meetings.form.select_registered_subject')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects && Array.isArray(subjects) && subjects.length > 0 ? (
                          subjects.map((subject: any) => (
                            <SelectItem
                              key={`subject-${subject.id}`}
                              value={subject.id.toString()}
                            >
                              {subject.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            {t('meetings.form.no_subjects_available')}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedSubjectId && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p className="text-blue-600">
                          {t('meetings.form.auto_select_users_message')}
                        </p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('meetings.form.subject_topic_optional')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('meetings.form.subject_topic_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="attendees"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">{t('meetings.form.select_attendees')}</FormLabel>
                    <FormDescription>
                      {t('meetings.form.select_attendees_description')}
                    </FormDescription>
                  </div>
                  
                  <div className="space-y-4">
                    {users && Array.isArray(users) && users.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-neutral-700 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {t('meetings.form.users')}
                        </h4>
                        {users.map((attendee: any) => (
                          <FormField
                            key={`user-${attendee.id}`}
                            control={form.control}
                            name="attendees"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={attendee.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(attendee.id)}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentValues, attendee.id]);
                                        } else {
                                          field.onChange(
                                            currentValues.filter((value) => value !== attendee.id)
                                          );
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {attendee.fullName} ({attendee.position || t('common.no_position')})
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">{t('meetings.form.no_users_available')}</p>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <div className="mb-2">
                <FormLabel className="text-base">{t('meetings.form.meeting_documents')}</FormLabel>
                <FormDescription>
                  {t('meetings.form.meeting_documents_description')}
                </FormDescription>
              </div>
              
              <div className="mt-2">
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.odt"
                  multiple
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t('meetings.form.upload_documents')}
                </Button>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="border rounded-md p-4 mt-4 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center space-x-2">
                        <FileIcon className="h-4 w-4 text-blue-500" />
                        <div className="text-sm">
                          <div className="font-medium">{file.name}</div>
                          <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeFile(index)} 
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </FormItem>
            
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
                disabled={scheduleMeetingMutation.isPending}
              >
                {scheduleMeetingMutation.isPending ? t('meetings.form.scheduling') : t('meetings.form.schedule_meeting')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}