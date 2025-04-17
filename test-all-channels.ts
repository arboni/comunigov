/**
 * Test script for sending messages through all communication channels
 * 
 * This script tests all available messaging channels (Email, WhatsApp, Telegram)
 * to verify they are working correctly.
 * 
 * Usage:
 * npx tsx test-all-channels.ts <email> [whatsAppNumber] [telegramUsername]
 * 
 * Examples:
 * npx tsx test-all-channels.ts user@example.com
 * npx tsx test-all-channels.ts user@example.com +1234567890
 * npx tsx test-all-channels.ts user@example.com +1234567890 @telegramuser
 */

import { sendMessage } from './server/messaging-service';
import { sendEmail } from './server/email-service';
import { sendWhatsAppMessage } from './server/whatsapp-service';
import { sendTelegramMessage } from './server/telegram-service';

// Get command line arguments
const [email, whatsAppNumber, telegramUsername] = process.argv.slice(2);

if (!email) {
  console.error('Error: Email address is required');
  console.log('Usage: npx tsx test-all-channels.ts <email> [whatsAppNumber] [telegramUsername]');
  process.exit(1);
}

async function runTests() {
  console.log('======== ComuniGov Communication Channels Test ========\n');
  
  // Common message data for all tests
  const recipientName = 'Test User';
  const senderName = 'ComuniGov Admin';
  const subject = 'Test Message from ComuniGov';
  const content = 'This is a test message sent from ComuniGov.\n\nIf you received this message, the communication channel is working correctly!';
  
  // Test configuration check
  console.log('Communication Channels Status:');
  console.log(`Email: ${process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`WhatsApp: ${process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Telegram: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Not configured'}`);
  console.log();
  
  // Email Test
  console.log('1. Testing Email Channel:');
  console.log(`   Sending email to: ${email}`);
  try {
    // Use the service's sendEmail function
    const emailResult = await sendEmail({
      to: email,
      subject: `ComuniGov: ${subject}`,
      text: `Hello ${recipientName},\n\n${content}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #3b82f6;">ComuniGov: ${subject}</h2>
          <p>Hello ${recipientName},</p>
          <p>${content}</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>For more information, visit <a href="https://comunigov.app" style="color: #3b82f6;">comunigov.app</a></p>
          </div>
        </div>
      `
    });
    console.log(`   Result: ${emailResult ? '✅ Email sent successfully' : '❌ Failed to send email'}`);
  } catch (error) {
    console.error(`   ❌ Error sending email:`, error);
  }
  console.log();
  
  // WhatsApp Test (if number provided)
  if (whatsAppNumber) {
    console.log('2. Testing WhatsApp Channel:');
    console.log(`   Sending WhatsApp message to: ${whatsAppNumber}`);
    try {
      const whatsAppResult = await sendWhatsAppMessage(
        whatsAppNumber,
        recipientName,
        senderName,
        subject,
        content,
        false
      );
      console.log(`   Result: ${whatsAppResult ? '✅ WhatsApp message sent successfully' : '❌ Failed to send WhatsApp message'}`);
      if (!whatsAppResult) {
        console.log('   Note: Make sure you have joined the Twilio WhatsApp sandbox by sending the join code to the Twilio number.');
      }
    } catch (error) {
      console.error(`   ❌ Error sending WhatsApp message:`, error);
    }
  } else {
    console.log('2. Skipping WhatsApp Test: No phone number provided');
  }
  console.log();
  
  // Telegram Test (if username provided)
  if (telegramUsername) {
    console.log('3. Testing Telegram Channel:');
    console.log(`   Sending Telegram message to: ${telegramUsername}`);
    try {
      const telegramResult = await sendTelegramMessage(
        telegramUsername,
        recipientName,
        senderName,
        subject,
        content,
        false
      );
      console.log(`   Result: ${telegramResult ? '✅ Telegram message sent successfully' : '❌ Failed to send Telegram message'}`);
      if (!telegramResult) {
        console.log('   Note: Make sure the Telegram bot token is configured and the user has started a conversation with your bot.');
      }
    } catch (error) {
      console.error(`   ❌ Error sending Telegram message:`, error);
    }
  } else {
    console.log('3. Skipping Telegram Test: No username provided');
  }
  console.log();
  
  // Messaging Service Unified Test
  console.log('4. Testing Unified Messaging Service:');
  
  // Test Email channel
  console.log('   Testing messaging service with Email channel:');
  try {
    const emailMessageResult = await sendMessage(
      'email',
      email,
      recipientName,
      senderName,
      subject,
      content,
      undefined,
      false
    );
    console.log(`   Result: ${emailMessageResult.success ? '✅ Success' : `❌ Failed: ${emailMessageResult.error}`}`);
  } catch (error) {
    console.error(`   ❌ Error using messaging service with email:`, error);
  }
  
  // Test WhatsApp channel if provided
  if (whatsAppNumber) {
    console.log('   Testing messaging service with WhatsApp channel:');
    try {
      const whatsAppMessageResult = await sendMessage(
        'whatsapp',
        whatsAppNumber,
        recipientName,
        senderName,
        subject,
        content,
        undefined,
        false
      );
      console.log(`   Result: ${whatsAppMessageResult.success ? '✅ Success' : `❌ Failed: ${whatsAppMessageResult.error}`}`);
    } catch (error) {
      console.error(`   ❌ Error using messaging service with WhatsApp:`, error);
    }
  }
  
  // Test Telegram channel if provided
  if (telegramUsername) {
    console.log('   Testing messaging service with Telegram channel:');
    try {
      const telegramMessageResult = await sendMessage(
        'telegram',
        telegramUsername,
        recipientName,
        senderName,
        subject,
        content,
        undefined,
        false
      );
      console.log(`   Result: ${telegramMessageResult.success ? '✅ Success' : `❌ Failed: ${telegramMessageResult.error}`}`);
    } catch (error) {
      console.error(`   ❌ Error using messaging service with Telegram:`, error);
    }
  }
  
  console.log('\n========================================================');
  console.log('Test completed! Check your devices for messages.');
  console.log('For troubleshooting, refer to WHATSAPP_INTEGRATION_GUIDE.md');
}

// Run the tests
runTests();