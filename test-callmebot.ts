/**
 * Test script for sending a WhatsApp message using CallMeBot
 * 
 * Usage: npx tsx test-callmebot.ts <phone-number>
 * Example: npx tsx test-callmebot.ts 555199701152
 */

import { sendWhatsAppMessage } from './server/callmebot-service';

async function testCallMeBot() {
  try {
    // Get phone number from command line arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
      console.error('Please provide a phone number as an argument');
      console.error('Usage: npx tsx test-callmebot.ts <phone-number>');
      process.exit(1);
    }

    const phoneNumber = args[0];
    console.log(`Testing CallMeBot WhatsApp message to ${phoneNumber}`);

    // Send a test message
    const result = await sendWhatsAppMessage(
      phoneNumber,
      'Test User',
      'ComuniGov System',
      'CallMeBot Test Message',
      'This is a test message sent via CallMeBot API. If you receive this, the integration is working correctly!'
    );

    if (result) {
      console.log('✅ Message sent successfully!');
    } else {
      console.error('❌ Failed to send message');
    }

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testCallMeBot();