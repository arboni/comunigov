import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Users, BookOpen } from "lucide-react";
import { apiRequest, queryClient, invalidateMeetings, invalidateDashboardStats } from "@/lib/queryClient";
import { SubjectsApi } from "@/lib/api";
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
import { cn } from "@/lib/utils";

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
  name: z.string().min(3, "Meeting name must be at least 3 characters"),
  agenda: z.string().min(10, "Agenda must be at least 10 characters"),
  date: z.date({
    required_error: "Meeting date is required",
  }),
  startTime: z.string({
    required_error: "Start time is required",
  }),
  endTime: z.string({
    required_error: "End time is required",
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  
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
        // Use Promise.all to wait for all attendee additions to complete
        if (attendees.length > 0) {
          await Promise.all(
            attendees.map(async (userId) => {
              return apiRequest("POST", `/api/meetings/${meeting.id}/attendees`, {
                userId,
                meetingId: meeting.id,
                confirmed: false,
                attended: false,
              });
            })
          );
        }
        
        // After all attendees are added, invalidate the queries to refresh the data
        await invalidateMeetings();
        await invalidateDashboardStats();
        
        toast({
          title: "Meeting scheduled",
          description: "The meeting has been successfully scheduled.",
        });
        form.reset();
        onOpenChange(false);
      } catch (error) {
        console.error("Error adding attendees:", error);
        toast({
          title: "Meeting created, but attendee issue",
          description: "The meeting was created but there was an issue adding attendees.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Meeting scheduling error:", error);
      toast({
        title: "Scheduling failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
    console.log("Form data being submitted:", data);
    scheduleMeetingMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting and invite attendees from your organization.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Budget Planning Meeting" {...field} />
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
                  <FormLabel>Agenda</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the purpose and agenda of the meeting" 
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
                    <FormLabel>Date</FormLabel>
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
                              <span>Pick a date</span>
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
                    <FormLabel>Location (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Conference Room A" {...field} />
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
                    <FormLabel>Start Time</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select start time" />
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
                    <FormLabel>End Time</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select end time" />
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
                      Use Registered Subject
                    </FormLabel>
                    <FormDescription>
                      Link this meeting to a registered subject to automatically include relevant participants
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
                        Select Subject
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
                          <SelectValue placeholder="Select a registered subject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.length > 0 ? (
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
                            No subjects available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedSubjectId && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p className="text-blue-600">
                          Relevant users will be automatically selected as attendees
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
                    <FormLabel>Subject/Topic (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Q3 Budget Review" {...field} />
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
                    <FormLabel className="text-base">Select Attendees</FormLabel>
                    <FormDescription>
                      Choose the users who should attend this meeting.
                    </FormDescription>
                  </div>
                  
                  <div className="space-y-4">
                    {users.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-neutral-700 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Users
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
                                    {attendee.fullName} ({attendee.position || "No position"})
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">No users available to invite.</p>
                    )}
                  </div>
                  <FormMessage />
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
                disabled={scheduleMeetingMutation.isPending}
              >
                {scheduleMeetingMutation.isPending ? "Scheduling..." : "Schedule Meeting"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}