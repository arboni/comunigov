import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MeetingListItem from "@/components/dashboard/meeting-list-item";
import ScheduleMeetingDialog from "@/components/dialogs/schedule-meeting-dialog";

export default function MeetingsPage() {
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  
  // Fetch all meetings
  const { data: allMeetings, isLoading: isLoadingAll } = useQuery({
    queryKey: ["/api/meetings"],
  });

  // Fetch upcoming meetings
  const { data: upcomingMeetings, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ["/api/meetings/upcoming"],
  });

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">Meetings</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Schedule and manage meetings with internal and external participants
              </p>
            </div>
            
            <Button 
              onClick={() => setScheduleMeetingOpen(true)}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Schedule Meeting</span>
            </Button>
          </div>
          
          {/* Meetings Tabs */}
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="w-full max-w-md mb-6">
              <TabsTrigger value="upcoming" className="flex-1">Upcoming Meetings</TabsTrigger>
              <TabsTrigger value="all" className="flex-1">All Meetings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming">
              <div className="bg-white shadow rounded-lg">
                <ul className="divide-y divide-neutral-200">
                  {isLoadingUpcoming ? (
                    <div className="py-8 text-center text-neutral-500">Loading upcoming meetings...</div>
                  ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
                    upcomingMeetings.map((meeting) => (
                      <MeetingListItem 
                        key={meeting.id} 
                        meeting={meeting}
                        isDetailedView
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <h3 className="text-lg font-medium text-neutral-700">No upcoming meetings</h3>
                      <p className="mt-2 text-neutral-500">
                        Click the 'Schedule Meeting' button to create a new meeting.
                      </p>
                    </div>
                  )}
                </ul>
              </div>
            </TabsContent>
            
            <TabsContent value="all">
              <div className="bg-white shadow rounded-lg">
                <ul className="divide-y divide-neutral-200">
                  {isLoadingAll ? (
                    <div className="py-8 text-center text-neutral-500">Loading all meetings...</div>
                  ) : allMeetings && allMeetings.length > 0 ? (
                    allMeetings.map((meeting) => (
                      <MeetingListItem 
                        key={meeting.id} 
                        meeting={meeting}
                        isDetailedView
                      />
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <h3 className="text-lg font-medium text-neutral-700">No meetings found</h3>
                      <p className="mt-2 text-neutral-500">
                        Click the 'Schedule Meeting' button to create your first meeting.
                      </p>
                    </div>
                  )}
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Schedule Meeting Dialog */}
      <ScheduleMeetingDialog 
        open={scheduleMeetingOpen} 
        onOpenChange={setScheduleMeetingOpen} 
      />
    </DashboardLayout>
  );
}
