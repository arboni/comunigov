/**
 * Update a user's WhatsApp number and test the WhatsApp integration
 * 
 * Usage:
 * npx tsx update-whatsapp-number.ts <userId> <whatsAppNumber>
 * 
 * Example:
 * npx tsx update-whatsapp-number.ts 2 +1234567890
 */

import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';
import { sendWhatsAppMessage } from './server/whatsapp-service';

// Get command line arguments
const userId = parseInt(process.argv[2]);
const whatsAppNumber = process.argv[3];

if (isNaN(userId) || !whatsAppNumber) {
  console.error('Error: Both userId and whatsAppNumber are required');
  console.log('Usage: npx tsx update-whatsapp-number.ts <userId> <whatsAppNumber>');
  console.log('Example: npx tsx update-whatsapp-number.ts 2 +1234567890');
  process.exit(1);
}

async function updateUserWhatsAppNumber() {
  try {
    // First, get the current user data
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      console.error(`No user found with ID ${userId}`);
      process.exit(1);
    }
    
    console.log('Current user data:');
    console.log(`- Name: ${user.fullName}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Current WhatsApp: ${user.whatsapp || 'None'}`);
    
    // Update the user's WhatsApp number
    await db.update(users)
      .set({ whatsapp: whatsAppNumber })
      .where(eq(users.id, userId));
    
    console.log(`\n✅ Successfully updated WhatsApp number to: ${whatsAppNumber}`);
    
    // Ask if the user wants to test sending a WhatsApp message
    console.log('\nWould you like to test sending a WhatsApp message to this number?');
    console.log('Important: Make sure you have:');
    console.log('1. Joined the Twilio WhatsApp sandbox by sending the join code to the Twilio number');
    console.log('2. Verified the TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER environment variables');
    console.log('\nTo test, run:');
    console.log(`npx tsx test-whatsapp.ts ${whatsAppNumber}`);
    
    console.log('\nTo send a message through the application:');
    console.log('1. Log in to ComuniGov');
    console.log('2. Go to Communications tab');
    console.log('3. Create a new communication');
    console.log('4. Select "WhatsApp" as the channel');
    console.log('5. Choose this user as a recipient');
    console.log('6. Send the message');
    
  } catch (error) {
    console.error('Error updating WhatsApp number:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the update
updateUserWhatsAppNumber();