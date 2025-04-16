import { sendEmail } from './email-service';

/**
 * Test email sending
 */
async function testEmailSending() {
  // Get recipient email from command line arguments or use default
  const recipientEmail = process.argv[2] || process.env.GMAIL_USER;
  
  if (!recipientEmail) {
    console.error('Error: No recipient email specified.');
    console.error('Usage: npm run test:email <recipient-email>');
    process.exit(1);
  }
  
  console.log(`Sending test email to ${recipientEmail}`);
  
  // Try to send a test email
  const result = await sendEmail({
    to: recipientEmail,
    subject: 'ComuniGov - Test Email',
    text: 'This is a test email from ComuniGov to verify that email sending is working correctly.',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #4f46e5;">ComuniGov - Email Test</h2>
        <p>This is a test email from ComuniGov to verify that email sending is working correctly.</p>
        <p>If you received this email, it means the setup is working!</p>
        <hr>
        <p style="color: #6b7280; font-size: 12px;">ComuniGov - Institutional Communication Platform</p>
      </div>
    `
  });
  
  if (result) {
    console.log('Email sent successfully!');
    process.exit(0);
  } else {
    console.error('Failed to send email.');
    process.exit(1);
  }
}

// Run the test
testEmailSending();