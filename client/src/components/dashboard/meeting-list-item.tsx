import { format, isValid } from "date-fns";
import { Eye, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Meeting } from "@shared/schema";

interface MeetingListItemProps {
  meeting: Meeting;
  isDetailedView?: boolean;
}

export default function MeetingListItem({ meeting, isDetailedView = false }: MeetingListItemProps) {
  const meetingDate = new Date(meeting.date);
  const isValidDate = isValid(meetingDate);
  const month = isValidDate ? format(meetingDate, "MMM") : "TBD";
  const day = isValidDate ? format(meetingDate, "dd") : "--";
  
  // Mock attendee count since we don't have that data immediately available
  // In a real implementation, you would fetch this from the API
  const attendeeCount = 0;

  return (
    <li className={isDetailedView ? "px-4 py-3" : "py-3"}>
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 text-center">
          <p className="text-sm font-medium text-neutral-900">{month}</p>
          <p className="text-2xl font-bold text-primary">{day}</p>
        </div>
        
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {meeting.name}
          </p>
          <div className="flex mt-1">
            <div className="flex items-center text-sm text-neutral-500 mr-4">
              <Clock className="mr-1.5 h-4 w-4 text-neutral-400" />
              <span>{meeting.startTime} - {meeting.endTime}</span>
            </div>
            <div className="flex items-center text-sm text-neutral-500">
              <Users className="mr-1.5 h-4 w-4 text-neutral-400" />
              <span>{attendeeCount}</span> Attendees
            </div>
          </div>
          
          {isDetailedView && (
            <div className="mt-2">
              <p className="text-sm text-neutral-600 truncate">
                <span className="font-medium">Agenda:</span> {meeting.agenda}
              </p>
              {meeting.location && (
                <p className="text-sm text-neutral-600 truncate mt-1">
                  <span className="font-medium">Location:</span> {meeting.location}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-primary hover:text-primary-dark"
            onClick={() => {
              // Navigate to meeting detail page using location hook
              window.location.href = `/meeting/${meeting.id}`;
            }}
            aria-label="View meeting details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}
