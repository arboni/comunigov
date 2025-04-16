import nodemailer from 'nodemailer';

// Interface for communication recipient info
export interface CommunicationRecipientInfo {
  userId?: number;
  entityId?: number;
  email: string;
  name: string;
}

// Email configuration
const FROM_EMAIL = process.env.GMAIL_USER || 'notifications@comunigov.app';
const DEFAULT_SUBJECT = 'ComuniGov Notification';

// Create a transporter object
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Verify transporter connection
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter.verify((error: Error | null) => {
    if (error) {
      console.error('Email service configuration error:', error);
    } else {
      console.log('Email service ready to send messages');
    }
  });
} else {
  console.warn('GMAIL_USER or GMAIL_APP_PASSWORD is not set. Email notifications will not be sent.');
}

/**
 * Interface for email content
 */
interface EmailContent {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
}

/**
 * Sends an email using Nodemailer with Gmail
 * @param emailContent - The email content to send
 * @returns Promise resolving to true if sent successfully, false otherwise
 */
export async function sendEmail(emailContent: EmailContent): Promise<boolean> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not sent: Gmail credentials are not set');
    return false;
  }

  try {
    // Validate inputs
    if (!emailContent.to || !emailContent.to.includes('@')) {
      console.error('Invalid recipient email address:', emailContent.to);
      return false;
    }

    // Prepare the email message
    const mailOptions = {
      from: `ComuniGov <${FROM_EMAIL}>`,
      to: emailContent.to,
      subject: emailContent.subject || DEFAULT_SUBJECT,
      text: emailContent.text || '',
      html: emailContent.html || ''
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${emailContent.to}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Sends a welcome email to a new entity member with their temporary password
 * @param to - Recipient email
 * @param fullName - Member's full name
 * @param username - Member's username
 * @param tempPassword - Temporary password
 * @param entityName - The name of the entity they've been added to
 */
export async function sendNewMemberWelcomeEmail(
  to: string,
  fullName: string,
  username: string,
  tempPassword: string,
  entityName: string
): Promise<boolean> {
  const subject = 'Welcome to ComuniGov - Your Account Details';
  
  const text = `
Hello ${fullName},

You have been added as a member of ${entityName} on the ComuniGov platform.

Here are your account details:
Username: ${username}
Temporary Password: ${tempPassword}

For security reasons, please change your password after your first login.

Access the platform at: https://comunigov.app

If you have any questions, please contact your entity administrator.

Best regards,
The ComuniGov Team
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
    .credentials { background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to ComuniGov</h1>
    </div>
    <div class="content">
      <p>Hello ${fullName},</p>
      
      <p>You have been added as a member of <strong>${entityName}</strong> on the ComuniGov platform.</p>
      
      <p>Here are your account details:</p>
      <div class="credentials">
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      
      <p><strong>Important:</strong> For security reasons, please change your password after your first login.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://comunigov.app" class="button">Access ComuniGov Platform</a>
      </p>
    </div>
    <div class="footer">
      <p>If you have any questions, please contact your entity administrator.</p>
      <p>&copy; ComuniGov - Institutional Communication Platform</p>
    </div>
  </div>
</body>
</html>
  `;
  
  return await sendEmail({
    to,
    subject,
    text,
    html
  });
}

/**
 * Sends a password reset notification email
 * @param to - Recipient email
 * @param fullName - Member's full name
 * @param username - Member's username
 * @param tempPassword - Temporary password
 */
export async function sendPasswordResetEmail(
  to: string,
  fullName: string,
  username: string,
  tempPassword: string
): Promise<boolean> {
  const subject = 'ComuniGov - Your Password Has Been Reset';
  
  const text = `
Hello ${fullName},

Your password on the ComuniGov platform has been reset.

Here are your updated account details:
Username: ${username}
Temporary Password: ${tempPassword}

For security reasons, please change your password after your next login.

Access the platform at: https://comunigov.app

If you did not request this password reset, please contact your entity administrator immediately.

Best regards,
The ComuniGov Team
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
    .credentials { background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
    .warning { color: #b91c1c; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset</h1>
    </div>
    <div class="content">
      <p>Hello ${fullName},</p>
      
      <p>Your password on the ComuniGov platform has been reset.</p>
      
      <p>Here are your updated account details:</p>
      <div class="credentials">
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      
      <p><strong>Important:</strong> For security reasons, please change your password after your next login.</p>
      
      <p class="warning">If you did not request this password reset, please contact your entity administrator immediately.</p>
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://comunigov.app" class="button">Access ComuniGov Platform</a>
      </p>
    </div>
    <div class="footer">
      <p>If you have any questions, please contact your entity administrator.</p>
      <p>&copy; ComuniGov - Institutional Communication Platform</p>
    </div>
  </div>
</body>
</html>
  `;
  
  return await sendEmail({
    to,
    subject,
    text,
    html
  });
}

/**
 * Sends a communication email to a recipient
 * @param to - Recipient email
 * @param recipientName - Recipient's name
 * @param senderName - Sender's name
 * @param subject - Email subject
 * @param content - Email content (message body)
 * @param hasAttachments - Whether the communication has file attachments 
 * @returns Promise resolving to true if sent successfully, false otherwise
 */
export async function sendCommunicationEmail(
  to: string,
  recipientName: string,
  senderName: string,
  subject: string,
  content: string,
  hasAttachments: boolean = false
): Promise<boolean> {
  const emailSubject = `ComuniGov: ${subject}`;
  
  const text = `
Hello ${recipientName},

You have received a new message from ${senderName} via ComuniGov.

Subject: ${subject}

Message:
${content}

${hasAttachments ? 'This message has attachments. Please log in to the ComuniGov platform to view them.' : ''}

Access the platform at: https://comunigov.app

Best regards,
The ComuniGov Team
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .message { background-color: #fff; padding: 15px; border-left: 4px solid #4f46e5; margin: 15px 0; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
    .attachments-note { background-color: #fef3c7; padding: 10px; border-radius: 5px; margin-top: 15px; }
    .button { display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Message</h1>
    </div>
    <div class="content">
      <p>Hello ${recipientName},</p>
      
      <p>You have received a new message from <strong>${senderName}</strong> via ComuniGov.</p>
      
      <p><strong>Subject:</strong> ${subject}</p>
      
      <div class="message">
        ${content.replace(/\n/g, '<br>')}
      </div>
      
      ${hasAttachments ? `
      <div class="attachments-note">
        <p><strong>Note:</strong> This message has attachments. Please log in to the ComuniGov platform to view them.</p>
      </div>
      ` : ''}
      
      <p style="text-align: center; margin-top: 30px;">
        <a href="https://comunigov.app" class="button">View in ComuniGov</a>
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message from the ComuniGov platform.</p>
      <p>&copy; ComuniGov - Institutional Communication Platform</p>
    </div>
  </div>
</body>
</html>
  `;
  
  return await sendEmail({
    to,
    subject: emailSubject,
    text,
    html
  });
}