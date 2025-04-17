import { sendEmail } from './email-service';

async function testEmailService() {
  console.log('Testing email service...');
  console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
  console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
  
  try {
    const result = await sendEmail({
      to: process.env.SENDGRID_FROM_EMAIL || 'test@example.com', // Send to the same email as the from email
      subject: 'ComuniGov Test Email',
      text: 'This is a test email to verify the SendGrid email service is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #3b82f6;">ComuniGov Test Email</h2>
          <p>This is a test email to verify the SendGrid email service is working correctly.</p>
          <p>If you're seeing this, the email service is working!</p>
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
            Sent from ComuniGov at ${new Date().toLocaleString()}
          </p>
        </div>
      `
    });
    
    console.log('Email sending result:', result);
    return result;
  } catch (error) {
    console.error('Error in test email function:', error);
    return false;
  }
}

// Run the function and exit
testEmailService()
  .then((result) => {
    console.log('Test completed with result:', result);
    process.exit(result ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });