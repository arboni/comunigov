/**
 * Test script for sending a WhatsApp message using Twilio
 * To run this script: npx tsx test-whatsapp.ts +YOUR_PHONE_NUMBER
 */

import { sendMessage } from './server/messaging-service';

// Get the phone number from command line arguments
const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('Error: Phone number is required');
  console.log('Usage: npx tsx test-whatsapp.ts +123456789');
  process.exit(1);
}

async function testWhatsAppMessage() {
  console.log(`Attempting to send WhatsApp message to ${phoneNumber}...`);

  try {
    // Send a test message
    const result = await sendMessage(
      'whatsapp',                // channel
      phoneNumber,               // to
      'Test User',               // recipientName  
      'ComuniGov Admin',         // senderName
      'Test WhatsApp Message',   // subject
      'This is a test message sent from ComuniGov using Twilio WhatsApp API.\n\nIf you received this message, the WhatsApp integration is working correctly!', // content
      undefined,                 // communicationId
      false                      // hasAttachments
    );

    if (result.success) {
      console.log('WhatsApp message sent successfully!');
    } else {
      console.error('Failed to send WhatsApp message:', result.error);
    }
  } catch (error) {
    console.error('Error in testWhatsAppMessage:', error);
  }
}

// Run the test
testWhatsAppMessage();