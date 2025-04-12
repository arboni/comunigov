import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Users } from "lucide-react";
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
  
  // Fetch entities for the attendee selection
  const { data: entities } = useQuery({
    queryKey: ["/api/entities"],
  });
  
  // Fetch users for the attendee selection
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
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
      attendees: [],
    },
  });

  const scheduleMeetingMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/meetings", {
        ...data,
        createdBy: user?.id,
      });
      return await res.json();
    },
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      // If attendees were selected, add them to the meeting
      if (form.getValues().attendees && form.getValues().attendees.length > 0) {
        form.getValues().attendees?.forEach(async (userId) => {
          await apiRequest("POST", `/api/meetings/${meeting.id}/attendees`, {
            userId,
            meetingId: meeting.id,
            confirmed: false,
            attended: false,
          });
        });
      }
      
      toast({
        title: "Meeting scheduled",
        description: "The meeting has been successfully scheduled.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Scheduling failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: FormValues) {
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
                  
                  {/* Note: In a real implementation, you would fetch users grouped by entity and display 
                      them in a more user-friendly way with search and filtering. This is simplified. */}
                  <div className="space-y-4">
                    {users && users.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-neutral-700 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Users
                        </h4>
                        {users.map((attendee) => (
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
