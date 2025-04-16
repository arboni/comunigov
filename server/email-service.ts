import { MailService } from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import { storage } from './storage';

// Interface for communication recipient info
export interface CommunicationRecipientInfo {
  userId?: number;
  entityId?: number;
  email: string;
  name: string;
}

// Email configuration
const DEFAULT_SUBJECT = 'ComuniGov Notification';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'notifications@comunigov.app';
const FROM_NAME = 'ComuniGov Notifications';

// Create a SendGrid mail service instance
let mailService: MailService | null = null;

/**
 * Initialize the SendGrid mail service
 */
function initializeMailService() {
  if (mailService) {
    return;
  }
  
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY environment variable is not set. Email functionality will not be available.');
    return;
  }

  try {
    // Initialize SendGrid mail service
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('SendGrid email service is ready to send messages');
  } catch (error) {
    console.error('Error initializing SendGrid mail service:', error);
    mailService = null;
  }
}

// Initialize the mail service on module load
initializeMailService();

/**
 * Interface for email content
 */
interface EmailContent {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content?: Buffer | string;
    path?: string;
    filename: string;
    type?: string;
    disposition?: string;
    contentId?: string;
  }>;
}

/**
 * Sends an email using SendGrid
 * @param emailContent - The email content to send
 * @returns Promise resolving to true if sent successfully, false otherwise
 */
export async function sendEmail(emailContent: EmailContent): Promise<boolean> {
  try {
    // Validate inputs
    if (!emailContent.to || !emailContent.to.includes('@')) {
      console.error('Invalid recipient email address:', emailContent.to);
      return false;
    }

    // Make sure mail service is initialized
    if (!mailService) {
      console.warn('Email not sent: SendGrid email service is not configured');
      initializeMailService(); // Try to initialize again
      if (!mailService) {
        return false;
      }
    }

    // Prepare the email message
    const message: any = {
      to: emailContent.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: emailContent.subject || DEFAULT_SUBJECT,
      text: emailContent.text || '',
      html: emailContent.html || ''
    };
    
    // Add attachments if they exist
    if (emailContent.attachments && emailContent.attachments.length > 0) {
      message.attachments = emailContent.attachments;
      console.log(`Including ${emailContent.attachments.length} attachments in email`);
    }

    // Log email details
    console.log('Sending email with details:');
    console.log(`To: ${emailContent.to}`);
    console.log(`Subject: ${emailContent.subject}`);
    
    if (message.attachments) {
      console.log(`Attachments: ${message.attachments.length}`);
      message.attachments.forEach((att: any, idx: number) => {
        console.log(`  Attachment ${idx+1}: ${att.filename}, type: ${att.type}, size: ${att.content.length} bytes`);
      });
    } else {
      console.log('No attachments included');
    }
    
    // Send the email
    await mailService.send(message);
    console.log(`Email sent to ${emailContent.to} using SendGrid`);
    return true;
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
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
 * @param communicationId - The ID of the communication (for fetching attachments) 
 * @param hasAttachments - Whether the communication has file attachments 
 * @returns Promise resolving to true if sent successfully, false otherwise
 */
export async function sendCommunicationEmail(
  to: string,
  recipientName: string,
  senderName: string,
  subject: string,
  content: string,
  communicationId?: number,
  hasAttachments: boolean = false
): Promise<boolean> {
  const emailSubject = `ComuniGov: ${subject}`;
  
  const text = `
Hello ${recipientName},

You have received a new message from ${senderName} via ComuniGov.

Subject: ${subject}

Message:
${content}

${hasAttachments ? 'This message has attachments included in this email. You can also log in to the ComuniGov platform to view them.' : ''}

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
        <p><strong>Note:</strong> This message has attachments included in this email. You can also log in to the ComuniGov platform to view them.</p>
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
  
  // Prepare email data
  const emailData: EmailContent = {
    to,
    subject: emailSubject,
    text,
    html
  };
  
  // If this communication has attachments and we have its ID, try to fetch and attach them
  console.log(`Checking attachments for communication ID: ${communicationId}, hasAttachments flag: ${hasAttachments}`);
  
  if (hasAttachments && communicationId) {
    try {
      // Fetch files for this communication
      console.log(`Fetching files for communication ID: ${communicationId}`);
      const files = await storage.getCommunicationFilesByCommunicationId(communicationId);
      console.log(`Found ${files?.length || 0} files for communication ID: ${communicationId}`);
      
      if (files && files.length > 0) {
        // Read each file and add it as an attachment
        const attachments = [];
        console.log(`Processing ${files.length} files as attachments`);
        
        for (const file of files) {
          console.log(`Processing file: ${file.name}, path: ${file.filePath}`);
          if (fs.existsSync(file.filePath)) {
            const fileBuffer = fs.readFileSync(file.filePath);
            console.log(`File read successfully, size: ${fileBuffer.length} bytes`);
            
            // Convert buffer to base64 string as required by SendGrid
            const content = fileBuffer.toString('base64');
            
            attachments.push({
              filename: file.name,
              content: content,
              type: file.type,
              disposition: 'attachment',
              contentId: `attachment-${file.id}`
            });
            console.log(`Added file ${file.name} as an attachment`);
          } else {
            console.warn(`File not found: ${file.filePath}`);
          }
        }
        
        if (attachments.length > 0) {
          console.log(`Adding ${attachments.length} attachments to email for communication ${communicationId}`);
          emailData.attachments = attachments;
        }
      }
    } catch (err) {
      console.error('Error fetching or adding attachments:', err);
    }
  }
  
  return await sendEmail(emailData);
}