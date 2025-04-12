import { apiRequest, queryClient } from "./queryClient";

// Meeting-related API functions
export const MeetingsApi = {
  // Fetch a single meeting by ID
  getMeeting: async (id: number) => {
    const res = await apiRequest("GET", `/api/meetings/${id}`);
    return await res.json();
  },
  
  // Fetch attendees for a meeting
  getMeetingAttendees: async (meetingId: number) => {
    const res = await apiRequest("GET", `/api/meetings/${meetingId}/attendees`);
    return await res.json();
  },
  
  // Add an attendee to a meeting
  addAttendee: async (meetingId: number, userId: number, confirmed: boolean = false) => {
    const res = await apiRequest("POST", `/api/meetings/${meetingId}/attendees`, {
      userId,
      confirmed
    });
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/attendees`] });
    return await res.json();
  },
  
  // Update an attendee's status
  updateAttendeeStatus: async (meetingId: number, attendeeId: number, status: { confirmed?: boolean, attended?: boolean }) => {
    const res = await apiRequest(
      "PUT", 
      `/api/meetings/${meetingId}/attendees/${attendeeId}`, 
      status
    );
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/meetings/${meetingId}/attendees`] });
    return await res.json();
  }
};

// Entity-related API functions
export const EntitiesApi = {
  // Fetch a single entity by ID
  getEntity: async (id: number) => {
    const res = await apiRequest("GET", `/api/entities/${id}`);
    return await res.json();
  }
};

// Task-related API functions
export const TasksApi = {
  // Fetch a single task by ID
  getTask: async (id: number) => {
    const res = await apiRequest("GET", `/api/tasks/${id}`);
    return await res.json();
  },
  
  // Fetch tasks related to a meeting
  getTasksByMeeting: async (meetingId: number) => {
    const res = await apiRequest("GET", `/api/tasks/meeting/${meetingId}`);
    return await res.json();
  }
};

// User-related API functions
export const UsersApi = {
  // Fetch a single user by ID
  getUser: async (id: number) => {
    const res = await apiRequest("GET", `/api/users/${id}`);
    return await res.json();
  }
};

// Communication-related API functions
export const CommunicationsApi = {
  // Fetch a single communication by ID
  getCommunication: async (id: number) => {
    const res = await apiRequest("GET", `/api/communications/${id}`);
    return await res.json();
  }
};