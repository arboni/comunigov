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
    content?: string;
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
        console.log(`  Attachment ${idx+1}: ${att.filename}, type: ${att.type}`);
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ComuniGov</title>
  <style>
    /* Base styles - these work in most email clients */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      color: white;
      padding: 25px 20px;
      text-align: center;
    }
    .logo {
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    .greeting {
      font-weight: 600;
      font-size: 18px;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .info-text {
      margin-bottom: 25px;
      color: #4b5563;
    }
    .credentials {
      background-color: #f3f4f6;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #60a5fa;
    }
    .credentials p {
      margin: 10px 0;
      color: #1f2937;
    }
    .important-notice {
      background-color: #fffbeb;
      border: 1px solid #fcd34d;
      padding: 15px;
      border-radius: 6px;
      margin-top: 25px;
      display: flex;
      align-items: center;
    }
    .important-notice svg {
      margin-right: 10px;
      flex-shrink: 0;
    }
    .important-notice p {
      margin: 0;
      color: #92400e;
    }
    .cta {
      text-align: center;
      margin: 35px 0 25px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      color: white;
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: transform 0.3s ease;
      box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 25px 0;
    }
    .footer {
      padding: 20px;
      text-align: center;
      background-color: #f9fafb;
      color: #6b7280;
      font-size: 13px;
    }
    .footer p {
      margin: 5px 0;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #3b82f6;
      text-decoration: none;
    }
    /* Responsive adjustments */
    @media only screen and (max-width: 650px) {
      .container {
        width: 100% !important;
        border-radius: 0;
      }
      .content {
        padding: 20px !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <!-- Simple text logo since images might be blocked -->
        <div style="font-size: 22px; font-weight: bold; letter-spacing: 1px;">ComuniGov</div>
      </div>
      <h1>Welcome to ComuniGov</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${fullName},</div>
      
      <div class="info-text">
        You have been added as a member of <strong>${entityName}</strong> on the ComuniGov institutional communication platform.
      </div>
      
      <div class="info-text">
        Here are your account details:
      </div>
      
      <div class="credentials">
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      
      <div class="important-notice">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p><strong>Important:</strong> For security reasons, please change your password immediately after your first login.</p>
      </div>
      
      <div class="cta">
        <a href="https://comunigov.app" class="button">Access ComuniGov Platform</a>
      </div>
      
      <div class="divider"></div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 5px;">
        Please keep your login credentials secure and do not share them with others.
      </div>
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="#">Facebook</a> • 
        <a href="#">Twitter</a> • 
        <a href="#">LinkedIn</a>
      </div>
      <p>If you have any questions, please contact your entity administrator.</p>
      <p>&copy; 2025 ComuniGov - Institutional Communication Platform</p>
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ComuniGov Password Reset</title>
  <style>
    /* Base styles - these work in most email clients */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      color: white;
      padding: 25px 20px;
      text-align: center;
    }
    .logo {
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    .greeting {
      font-weight: 600;
      font-size: 18px;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .info-text {
      margin-bottom: 25px;
      color: #4b5563;
    }
    .credentials {
      background-color: #f3f4f6;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #60a5fa;
    }
    .credentials p {
      margin: 10px 0;
      color: #1f2937;
    }
    .important-notice {
      background-color: #fffbeb;
      border: 1px solid #fcd34d;
      padding: 15px;
      border-radius: 6px;
      margin-top: 25px;
      display: flex;
      align-items: center;
    }
    .important-notice svg {
      margin-right: 10px;
      flex-shrink: 0;
    }
    .important-notice p {
      margin: 0;
      color: #92400e;
    }
    .warning-notice {
      background-color: #fee2e2;
      border: 1px solid #ef4444;
      padding: 15px;
      border-radius: 6px;
      margin-top: 25px;
      display: flex;
      align-items: center;
    }
    .warning-notice svg {
      margin-right: 10px;
      flex-shrink: 0;
    }
    .warning-notice p {
      margin: 0;
      color: #b91c1c;
      font-weight: 500;
    }
    .cta {
      text-align: center;
      margin: 35px 0 25px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      color: white;
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: transform 0.3s ease;
      box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 25px 0;
    }
    .footer {
      padding: 20px;
      text-align: center;
      background-color: #f9fafb;
      color: #6b7280;
      font-size: 13px;
    }
    .footer p {
      margin: 5px 0;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #3b82f6;
      text-decoration: none;
    }
    /* Responsive adjustments */
    @media only screen and (max-width: 650px) {
      .container {
        width: 100% !important;
        border-radius: 0;
      }
      .content {
        padding: 20px !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <!-- Simple text logo since images might be blocked -->
        <div style="font-size: 22px; font-weight: bold; letter-spacing: 1px;">ComuniGov</div>
      </div>
      <h1>Password Reset</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${fullName},</div>
      
      <div class="info-text">
        Your password on the ComuniGov platform has been reset. Please use the credentials below to access your account.
      </div>
      
      <div class="info-text">
        Here are your updated account details:
      </div>
      
      <div class="credentials">
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      
      <div class="important-notice">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p><strong>Important:</strong> For security reasons, please change your password immediately after your next login.</p>
      </div>
      
      <div class="warning-notice">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <p>If you did not request this password reset, please contact your entity administrator immediately.</p>
      </div>
      
      <div class="cta">
        <a href="https://comunigov.app" class="button">Access ComuniGov Platform</a>
      </div>
      
      <div class="divider"></div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 5px;">
        Please keep your login credentials secure and do not share them with others.
      </div>
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="#">Facebook</a> • 
        <a href="#">Twitter</a> • 
        <a href="#">LinkedIn</a>
      </div>
      <p>If you have any questions, please contact your entity administrator.</p>
      <p>&copy; 2025 ComuniGov - Institutional Communication Platform</p>
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ComuniGov Message: ${subject}</title>
  <style>
    /* Base styles - these work in most email clients */
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      color: white;
      padding: 25px 20px;
      text-align: center;
    }
    .logo {
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    .greeting {
      font-weight: 600;
      font-size: 18px;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .sender-info {
      margin-bottom: 25px;
      color: #4b5563;
    }
    .subject {
      background-color: #f3f4f6;
      padding: 12px 15px;
      border-radius: 6px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .message {
      background-color: #fff;
      padding: 20px;
      border-left: 4px solid #60a5fa;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      color: #374151;
      line-height: 1.7;
    }
    .attachments-note {
      background-color: #fffbeb;
      border: 1px solid #fcd34d;
      padding: 15px;
      border-radius: 6px;
      margin-top: 25px;
      display: flex;
      align-items: center;
    }
    .attachments-note svg {
      margin-right: 10px;
      flex-shrink: 0;
    }
    .attachments-note p {
      margin: 0;
      color: #92400e;
    }
    .cta {
      text-align: center;
      margin: 35px 0 25px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      color: white;
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      transition: transform 0.3s ease;
      box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 25px 0;
    }
    .footer {
      padding: 20px;
      text-align: center;
      background-color: #f9fafb;
      color: #6b7280;
      font-size: 13px;
    }
    .footer p {
      margin: 5px 0;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #3b82f6;
      text-decoration: none;
    }
    /* Responsive adjustments */
    @media only screen and (max-width: 650px) {
      .container {
        width: 100% !important;
        border-radius: 0;
      }
      .content {
        padding: 20px !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <!-- Simple text logo since images might be blocked -->
        <div style="font-size: 22px; font-weight: bold; letter-spacing: 1px;">ComuniGov</div>
      </div>
      <h1>New Institutional Communication</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${recipientName},</div>
      
      <div class="sender-info">
        You have received a new message from <strong>${senderName}</strong> through the ComuniGov platform.
      </div>
      
      <div class="subject">
        <span style="color: #6b7280; display: inline-block; width: 80px;">Subject:</span> ${subject}
      </div>
      
      <div class="message">
        ${content.replace(/\n/g, '<br>')}
      </div>
      
      ${hasAttachments ? `
      <div class="attachments-note">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
        </svg>
        <p><strong>Files attached:</strong> This message includes file attachments. You can also view them by logging into the ComuniGov platform.</p>
      </div>
      ` : ''}
      
      <div class="cta">
        <a href="https://comunigov.app" class="button">View in ComuniGov Platform</a>
      </div>
      
      <div class="divider"></div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 5px;">
        For better security and features, please access all your communications through the platform.
      </div>
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="#">Facebook</a> • 
        <a href="#">Twitter</a> • 
        <a href="#">LinkedIn</a>
      </div>
      <p>This is an automated message. Please do not reply directly to this email.</p>
      <p>&copy; 2025 ComuniGov - Institutional Communication Platform</p>
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
            try {
              const fileBuffer = fs.readFileSync(file.filePath);
              console.log(`File read successfully, size: ${fileBuffer.length} bytes`);
              
              // Convert buffer to base64 string as required by SendGrid
              const content = fileBuffer.toString('base64');
              
              // Create metadata for the attachment
              const attachmentData = {
                filename: file.name,
                content,
                type: file.type || 'application/octet-stream', // Default MIME type if not specified
                disposition: 'attachment',
                contentId: `attachment-${file.id}@comunigov`
              };
              
              console.log(`Attachment metadata created for ${file.name}, content type: ${attachmentData.type}`);
              attachments.push(attachmentData);
              console.log(`Added file ${file.name} as an attachment`);
            } catch (attachError) {
              console.error(`Error processing attachment ${file.name}:`, attachError);
            }
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