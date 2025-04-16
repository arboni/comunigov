/**
 * Test script for sending an email via SendGrid
 * 
 * This file is for testing purposes only and should be removed after verification
 */

import { sendCommunicationEmail } from './email-service';

async function testSendEmail() {
  console.log('Testing email sending...');
  console.log('FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
  console.log('API_KEY exists:', !!process.env.SENDGRID_API_KEY);
  
  try {
    // Attempt to send a test email
    const result = await sendCommunicationEmail(
      'admin@comunigov.test', // Replace with the recipient email address
      'Admin User',
      'System',
      'Test Email from ComuniGov',
      'This is a test email to verify the SendGrid integration is working correctly.\n\nIf you can read this, the email service is functioning properly!',
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