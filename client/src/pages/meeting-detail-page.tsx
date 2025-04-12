import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { format, isValid } from "date-fns";
import { Clock, Users, MapPin, Calendar, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function MeetingDetailPage() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  
  // Fetch meeting details
  const { data: meeting, isLoading } = useQuery({
    queryKey: [`/api/meetings/${id}`],
  });

  // Fetch meeting attendees
  const { data: attendees = [], isLoading: loadingAttendees } = useQuery({
    queryKey: [`/api/meetings/${id}/attendees`],
  });
  
  // Fetch tasks related to this meeting
  const { data: relatedTasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: [`/api/tasks/meeting/${id}`],
    enabled: !!id
  });
  
  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/meetings")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Meetings
              </Button>
            </div>
            
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-neutral-200 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto mb-8"></div>
                <div className="h-24 bg-neutral-200 rounded mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-12 bg-neutral-200 rounded"></div>
                  <div className="h-12 bg-neutral-200 rounded"></div>
                  <div className="h-12 bg-neutral-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Meeting not found
  if (!meeting) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/meetings")}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Meetings
              </Button>
            </div>
            
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <h1 className="text-2xl font-semibold text-neutral-800 mb-2">Meeting Not Found</h1>
              <p className="text-neutral-500 mb-6">
                The meeting you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Link href="/meetings">
                <Button>Return to Meetings</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Format the date
  const meetingDate = new Date(meeting.date);
  const isValidDate = isValid(meetingDate);
  const formattedDate = isValidDate ? format(meetingDate, "PPP") : "TBD";

  // Rendering Tasks
  const renderTasks = () => {
    if (loadingTasks) {
      return (
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-neutral-100 rounded"></div>
          <div className="h-8 bg-neutral-100 rounded"></div>
        </div>
      );
    }
    
    if (!relatedTasks || relatedTasks.length === 0) {
      return (
        <p className="text-neutral-500 text-sm text-center py-4">
          No tasks associated with this meeting
        </p>
      );
    }
    
    return (
      <ul className="space-y-2">
        {relatedTasks.map((task: any) => (
          <li key={task.id} className="flex items-center justify-between p-2 rounded-md bg-neutral-50">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-800">
                {task.title}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {task.description}
              </p>
            </div>
            <Badge 
              variant={task.status === 'completed' ? 'default' : 'outline'}
              className={
                task.status === 'completed' 
                  ? "bg-emerald-100 text-emerald-800" 
                  : task.status === 'in_progress'
                    ? "bg-blue-100 text-blue-800"
                    : ""
              }
            >
              {task.status === 'completed' 
                ? 'Completed' 
                : task.status === 'in_progress'
                  ? 'In Progress'
                  : 'Pending'
              }
            </Badge>
          </li>
        ))}
      </ul>
    );
  };

  // Rendering Attendees
  const renderAttendees = () => {
    if (loadingAttendees) {
      return (
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-neutral-100 rounded"></div>
          <div className="h-10 bg-neutral-100 rounded"></div>
        </div>
      );
    }
    
    if (attendees.length === 0) {
      return <p className="text-neutral-500 text-sm">No attendees added yet</p>;
    }
    
    return (
      <ul className="space-y-2">
        {attendees.map((attendee: any) => (
          <li key={attendee.id} className="flex items-center p-2 rounded-md bg-neutral-50">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarFallback className="bg-primary-100 text-primary">
                {attendee.user?.fullName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-800">
                {attendee.user?.fullName || `User ID: ${attendee.userId}`}
              </p>
              <p className="text-xs text-neutral-500">
                {attendee.user?.position || 'No position'}
              </p>
            </div>
            <Badge
              variant={attendee.confirmed ? "default" : "outline"}
              className={attendee.confirmed ? "bg-emerald-100 text-emerald-800" : ""}
            >
              {attendee.confirmed ? "Confirmed" : "Pending"}
            </Badge>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <Link href="/meetings">
              <Button 
                variant="ghost" 
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Meetings
              </Button>
            </Link>
            
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">{meeting.name}</h1>
              <p className="text-neutral-500">{meeting.subject || "No subject"}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Meeting Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Agenda</h3>
                      <p className="text-neutral-700 whitespace-pre-line">{meeting.agenda}</p>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-2">Date & Time</h3>
                        <div className="flex items-center text-neutral-700 mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                          {formattedDate}
                        </div>
                        <div className="flex items-center text-neutral-700">
                          <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                          {meeting.startTime} - {meeting.endTime}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-2">Location</h3>
                        <div className="flex items-center text-neutral-700">
                          <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
                          {meeting.location || "No location specified"}
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-neutral-500">Attendees</h3>
                        <Badge variant="outline" className="text-primary">
                          <Users className="h-3 w-3 mr-1" />
                          {attendees.length} Attendees
                        </Badge>
                      </div>
                      
                      {renderAttendees()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Meeting Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-500 text-sm text-center py-4">
                    No files available for this meeting
                  </p>
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Related Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderTasks()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}