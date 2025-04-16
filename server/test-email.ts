/**
 * Test script for sending an email via Gmail SMTP
 * 
 * This file is for testing purposes only and should be removed after verification
 */

import { sendCommunicationEmail } from './email-service';

async function testSendEmail() {
  console.log('Testing email sending...');
  console.log('Gmail user:', process.env.GMAIL_USER);
  console.log('Gmail app password exists:', !!process.env.GMAIL_APP_PASSWORD);
  
  try {
    // Attempt to send a test email
    const result = await sendCommunicationEmail(
      process.env.GMAIL_USER || '', // Send test email to yourself
      'Admin User',
      'System',
      'Test Email from ComuniGov',
      'This is a test email to verify the Gmail SMTP integration is working correctly.\n\nIf you can read this, the email service is functioning properly!',
      false
    );
    
    console.log('Email send result:', result);
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

// Run the test
testSendEmail()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed with error:', err));