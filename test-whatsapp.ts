/**
 * Test script for sending a WhatsApp message using Twilio
 * To run this script: npx tsx test-whatsapp.ts +YOUR_PHONE_NUMBER
 */

import { sendWhatsAppMessage } from './server/whatsapp-service';

// Get the phone number from command line arguments
const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('Error: Phone number is required');
  console.log('Usage: npx tsx test-whatsapp.ts +123456789');
  process.exit(1);
}

async function testWhatsAppMessage() {
  console.log(`Attempting to send WhatsApp message directly to ${phoneNumber}...`);
  console.log('Make sure you have connected to the Twilio WhatsApp Sandbox:');
  console.log('1. Find the WhatsApp Sandbox join code in your Twilio console');
  console.log(`2. Send that code to the Twilio WhatsApp number (+${process.env.TWILIO_WHATSAPP_NUMBER})`);
  console.log('3. Only after joining the sandbox, you can receive messages from Twilio');

  try {
    // Send a test message directly via the whatsapp service
    const success = await sendWhatsAppMessage(
      phoneNumber,               // to
      'Test User',               // recipientName  
      'ComuniGov Admin',         // senderName
      'Test WhatsApp Message',   // subject
      'This is a test message sent from ComuniGov using Twilio WhatsApp API.\n\nIf you received this message, the WhatsApp integration is working correctly!', // content
      false                      // hasAttachments
    );

    if (success) {
      console.log('💬 WhatsApp message sent successfully!');
    } else {
      console.error('❌ Failed to send WhatsApp message');
    }
  } catch (error) {
    console.error('❌ Error in testWhatsAppMessage:', error);
  }
}

// Run the test
testWhatsAppMessage();