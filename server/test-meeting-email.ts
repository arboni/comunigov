import { db } from './db';
import { sendMeetingInvitationEmail, sendMeetingInvitationsToAllAttendees } from './email-service';
import { meetings, users, meetingAttendees } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function testMeetingInvitations() {
  console.log('Testing meeting invitation emails...');
  
  try {
    // Get a test meeting
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, 5));
    if (!meeting) {
      console.error('No meeting found with ID 5');
      return false;
    }
    console.log('Found meeting:', meeting.name);
    
    // Get test attendees with users
    const attendeeRecords = await db.select().from(meetingAttendees).where(eq(meetingAttendees.meetingId, meeting.id));
    if (!attendeeRecords.length) {
      console.error('No attendees found for meeting ID 5');
      return false;
    }
    console.log(`Found ${attendeeRecords.length} attendees for meeting`);
    
    // Get organizer info
    const [organizer] = await db.select().from(users).where(eq(users.id, meeting.createdBy));
    if (!organizer) {
      console.error('Could not find meeting organizer');
      return false;
    }
    const organizerName = organizer.fullName || organizer.username;
    console.log(`Meeting organizer: ${organizerName}`);
    
    // Add user info to attendees
    const attendeesWithUsers = await Promise.all(
      attendeeRecords.map(async (attendee) => {
        if (attendee.userId) {
          const [user] = await db.select().from(users).where(eq(users.id, attendee.userId));
          return { ...attendee, user };
        }
        return attendee;
      })
    );
    
    console.log('Sending invitations to all attendees...');
    const result = await sendMeetingInvitationsToAllAttendees(
      meeting,
      attendeesWithUsers,
      organizerName
    );
    
    console.log('Send result:', result);
    return result.success > 0;
  } catch (error) {
    console.error('Error in meeting invitation test:', error);
    return false;
  }
}

// Run the function and exit
testMeetingInvitations()
  .then((result) => {
    console.log('Test completed with result:', result);
    process.exit(result ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });