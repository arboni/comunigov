import { MailService } from '@sendgrid/mail';
import * as fs from 'fs';
import * as path from 'path';
import { storage } from './storage';
import { Meeting, MeetingAttendee, User, meetingDocuments, PublicHearing, publicHearingFiles } from '@shared/schema';
import { format } from 'date-fns';
import { db } from './db';
import { eq } from 'drizzle-orm';

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
      color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      padding: 25px 20px;
      text-align: center;
    }
    .logo {
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    .greeting {
      font-weight: 700;
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
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
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
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
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
      color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
      font-weight: 700;
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
/**
 * Sends a meeting invitation email to an attendee
 * @param to - Recipient email
 * @param attendeeName - Attendee's full name
 * @param meeting - Meeting information
 * @param organizerName - Name of the meeting organizer
 */
export async function sendMeetingInvitationEmail(
  to: string,
  attendeeName: string,
  meeting: Meeting,
  organizerName: string
): Promise<boolean> {
  const meetingDate = new Date(meeting.date);
  const formattedDate = format(meetingDate, 'PPPP'); // 'Monday, January 1, 2025'
  const subject = `Meeting Invitation: ${meeting.name}`;
  
  // Fetch meeting documents/attachments
  let attachments: Array<{content?: string; path?: string; filename: string; type?: string; disposition?: string; contentId?: string}> = [];
  let hasDocuments = false;
  
  try {
    console.log(`Fetching documents for meeting ID ${meeting.id}`);
    const documents = await db.query.meetingDocuments.findMany({
      where: eq(meetingDocuments.meetingId, meeting.id)
    });
    
    if (documents && documents.length > 0) {
      console.log(`Found ${documents.length} documents for meeting ${meeting.id}`);
      hasDocuments = true;
      
      // Convert documents to email attachments
      const tempAttachments = [];
      
      for (const doc of documents) {
        console.log(`Adding document to email: ${doc.name}, path: ${doc.filePath}`);
        try {
          // Check if file exists
          const fs = await import('fs');
          if (!fs.existsSync(doc.filePath)) {
            console.error(`File not found: ${doc.filePath}`);
            continue;
          }
          
          // Read file synchronously as buffer
          const fileBuffer = fs.readFileSync(doc.filePath);
          console.log(`File ${doc.name} read successfully, size: ${fileBuffer.length} bytes`);
          
          // Convert buffer to base64 string as required by SendGrid
          const content = fileBuffer.toString('base64');
          
          // Get MIME type based on file extension or use the default
          let mimeType = doc.type || 'application/octet-stream';
          const fileExtension = doc.name.split('.').pop()?.toLowerCase();
          
          // Map common file extensions to MIME types
          if (fileExtension && !doc.type) {
            const mimeMap: Record<string, string> = {
              'pdf': 'application/pdf',
              'doc': 'application/msword',
              'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'xls': 'application/vnd.ms-excel',
              'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'png': 'image/png',
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'gif': 'image/gif',
              'odt': 'application/vnd.oasis.opendocument.text'
            };
            mimeType = mimeMap[fileExtension] || mimeType;
          }
          
          // Create attachment object
          const attachment = {
            content: content,
            filename: doc.name,
            type: mimeType,
            disposition: 'attachment'
          };
          
          console.log(`Created attachment for ${doc.name} with MIME type: ${mimeType}`);
          tempAttachments.push(attachment);
        } catch (err) {
          console.error(`Error processing file ${doc.name}:`, err);
        }
      }
      
      attachments = tempAttachments;
    } else {
      console.log(`No documents found for meeting ${meeting.id}`);
    }
  } catch (error) {
    console.error(`Error fetching documents for meeting ${meeting.id}:`, error);
  }
  
  const text = `
Hello ${attendeeName},

You have been invited to attend a meeting on the ComuniGov platform.

Meeting Details:
Name: ${meeting.name}
Date: ${formattedDate}
Time: ${meeting.startTime} - ${meeting.endTime}
Location: ${meeting.location || 'To be determined'}
Organizer: ${organizerName}

Agenda:
${meeting.agenda || 'No agenda provided'}

${hasDocuments ? `This meeting has ${attachments.length} document(s) attached to this email.` : ''}

Please log in to the ComuniGov platform to confirm your attendance.

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
  <title>Meeting Invitation</title>
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
      color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      padding: 25px 20px;
      text-align: center;
    }
    .logo {
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    .greeting {
      font-weight: 700;
      font-size: 18px;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .info-text {
      margin-bottom: 25px;
      color: #4b5563;
    }
    .meeting-details {
      background-color: #f3f4f6;
      padding: 20px;
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
      margin: 20px 0;
      border-left: 4px solid #60a5fa;
    }
    .meeting-details p {
      margin: 10px 0;
      color: #1f2937;
    }
    .meeting-agenda {
      background-color: #f9fafb;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      white-space: pre-line;
    }
    .meeting-agenda h3 {
      margin-top: 0;
      color: #1f2937;
    }
    .meeting-agenda p {
      margin: 10px 0;
      color: #4b5563;
    }
    .attachments-note {
      background-color: #fffbeb;
      border: 1px solid #fcd34d;
      padding: 15px;
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
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
      color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
      font-weight: 700;
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
      <h1>Meeting Invitation</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${attendeeName},</div>
      
      <div class="info-text">
        You have been invited to attend a meeting on the ComuniGov institutional communication platform.
      </div>
      
      <div class="meeting-details">
        <h3 style="margin-top: 0; color: #1f2937; font-size: 16px;">Meeting Details</h3>
        <p><strong>Name:</strong> ${meeting.name}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${meeting.startTime} - ${meeting.endTime}</p>
        <p><strong>Location:</strong> ${meeting.location || 'To be determined'}</p>
        <p><strong>Organizer:</strong> ${organizerName}</p>
      </div>
      
      <div class="meeting-agenda">
        <h3>Agenda</h3>
        <p>${meeting.agenda || 'No agenda provided'}</p>
      </div>
      
      ${hasDocuments ? `
      <div class="attachments-note">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
        </svg>
        <p><strong>Files attached:</strong> This meeting includes ${attachments.length} document(s). They are attached to this email for your convenience.</p>
      </div>
      ` : ''}
      
      <div class="cta">
        <a href="https://comunigov.app" class="button">View Meeting Details</a>
      </div>
      
      <div class="divider"></div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 5px;">
        Please log in to the ComuniGov platform to confirm your attendance.
      </div>
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="#">Facebook</a> • 
        <a href="#">Twitter</a> • 
        <a href="#">LinkedIn</a>
      </div>
      <p>If you have any questions, please contact the meeting organizer.</p>
      <p>&copy; 2025 ComuniGov - Institutional Communication Platform</p>
    </div>
  </div>
</body>
</html>
  `;
  
  // Send email with attachments if they exist
  return await sendEmail({
    to,
    subject,
    text,
    html,
    attachments: attachments.length > 0 ? attachments : undefined
  });
}

/**
 * Sends invitation emails to all attendees of a meeting
 * @param meeting - The meeting object
 * @param attendees - List of attendees with user information
 * @param organizerName - Name of the meeting organizer
 */
/**
 * Sends a public hearing invitation email
 * @param to - Recipient email
 * @param recipientName - Recipient's full name
 * @param hearing - Public hearing information
 * @param organizerName - Name of the public hearing organizer
 */
export async function sendPublicHearingInvitationEmail(
  to: string,
  recipientName: string,
  hearing: PublicHearing,
  organizerName: string
): Promise<boolean> {
  const hearingDate = new Date(hearing.date);
  const formattedDate = format(hearingDate, 'PPPP', { locale: require('date-fns/locale/pt-BR') }); // 'segunda-feira, 1 de janeiro de 2025'
  const subject = `Convite para Audiência Pública: ${hearing.title}`;
  
  // Fetch hearing files/attachments
  let attachments: Array<{content?: string; path?: string; filename: string; type?: string; disposition?: string; contentId?: string}> = [];
  let hasFiles = false;
  
  try {
    console.log(`Fetching files for public hearing ID ${hearing.id}`);
    const files = await db.query.publicHearingFiles.findMany({
      where: eq(publicHearingFiles.publicHearingId, hearing.id)
    });
    
    if (files && files.length > 0) {
      console.log(`Found ${files.length} files for public hearing ${hearing.id}`);
      hasFiles = true;
      
      // Convert files to email attachments
      for (const file of files) {
        try {
          if (fs.existsSync(file.filePath)) {
            attachments.push({
              filename: file.name,
              path: file.filePath,
              type: file.type,
              disposition: 'attachment'
            });
            console.log(`Added attachment: ${file.name} (${file.type})`);
          } else {
            console.warn(`File not found: ${file.filePath}`);
          }
        } catch (error) {
          console.error(`Error processing file attachment ${file.name}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching files for public hearing ${hearing.id}:`, error);
  }
  
  const text = `
Olá ${recipientName},

Você está convidado(a) para a Audiência Pública: ${hearing.title}

Data: ${formattedDate}
Horário: ${hearing.startTime} - ${hearing.endTime}
Local: ${hearing.location}

Descrição:
${hearing.description}

Organizada por: ${organizerName}

${hasFiles ? `Esta audiência pública inclui ${attachments.length} documento(s) anexado(s) a este email.` : ''}

Acesse a plataforma em: https://comunigov.app

Atenciosamente,
Equipe ComuniGov
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para Audiência Pública</title>
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
      color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      padding: 25px 20px;
      text-align: center;
    }
    .logo {
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    .greeting {
      font-weight: 700;
      font-size: 18px;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .meeting-info {
      background-color: #f3f4f6;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #60a5fa;
    }
    .meeting-info h3 {
      margin-top: 0;
      color: #1f2937;
    }
    .meeting-details {
      margin-top: 15px;
    }
    .meeting-details p {
      margin: 5px 0;
      display: flex;
      align-items: center;
    }
    .icon {
      display: inline-block;
      width: 16px;
      height: 16px;
      margin-right: 8px;
      color: #60a5fa;
    }
    .attachments-note {
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      padding: 15px;
      border-radius: 6px;
      margin-top: 25px;
      display: flex;
      align-items: center;
    }
    .attachments-note p {
      margin: 0;
      color: #0369a1;
    }
    .cta {
      text-align: center;
      margin: 35px 0 25px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
      color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 700;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <!-- Simple text logo since images might be blocked -->
        <div style="font-size: 22px; font-weight: bold; letter-spacing: 1px;">ComuniGov</div>
      </div>
      <h1>Convite para Audiência Pública</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Olá ${recipientName},</div>
      
      <div>
        Você está convidado(a) para participar da seguinte audiência pública:
      </div>
      
      <div class="meeting-info">
        <h3>${hearing.title}</h3>
        <div class="meeting-details">
          <p>
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span><strong>Data:</strong> ${formattedDate}</span>
          </p>
          <p>
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span><strong>Horário:</strong> ${hearing.startTime} - ${hearing.endTime}</span>
          </p>
          <p>
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span><strong>Local:</strong> ${hearing.location}</span>
          </p>
          <p>
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span><strong>Organizado por:</strong> ${organizerName}</span>
          </p>
        </div>
      </div>
      
      <div>
        <h3>Descrição</h3>
        <p>${hearing.description || 'Nenhuma descrição fornecida'}</p>
      </div>
      
      ${hasFiles ? `
      <div class="attachments-note">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0369a1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 10px;">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
        </svg>
        <p><strong>Arquivos anexados:</strong> Esta audiência pública inclui ${attachments.length} documento(s). Eles estão anexados a este email para sua conveniência.</p>
      </div>
      ` : ''}
      
      <div class="cta">
        <a href="https://comunigov.app" class="button">Acessar Plataforma</a>
      </div>
      
      <div class="divider"></div>
      
      <div style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 5px;">
        Por favor, acesse a plataforma ComuniGov para mais informações.
      </div>
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="#">Facebook</a> • 
        <a href="#">Twitter</a> • 
        <a href="#">LinkedIn</a>
      </div>
      <p>Em caso de dúvidas, entre em contato com o organizador da audiência pública.</p>
      <p>&copy; 2025 ComuniGov - Plataforma de Comunicação Institucional</p>
    </div>
  </div>
</body>
</html>
  `;
  
  // Send email with attachments if they exist
  return await sendEmail({
    to,
    subject,
    text,
    html,
    attachments: attachments.length > 0 ? attachments : undefined
  });
}

/**
 * Sends public hearing invitations to all entity members
 * @param hearing - The public hearing object
 * @param entityMembers - List of entity members
 * @param organizerName - Name of the public hearing organizer
 */
export async function sendPublicHearingInvitationsToMembers(
  hearing: PublicHearing,
  entityMembers: User[],
  organizerName: string
): Promise<{ success: number, failed: number, recipients: {id: number, name: string, email: string}[] }> {
  let successCount = 0;
  let failedCount = 0;
  const recipients: {id: number, name: string, email: string}[] = [];
  
  console.log(`Sending public hearing invitations to ${entityMembers.length} members for hearing: ${hearing.title}`);
  
  // Debug: print all members
  entityMembers.forEach((member, index) => {
    console.log(`Member ${index + 1}:`, {
      id: member.id,
      email: member.email || 'No email available',
      name: member.fullName || member.username || 'Unknown'
    });
  });
  
  for (const member of entityMembers) {
    if (member.email) {
      try {
        const memberName = member.fullName || member.username;
        console.log(`Sending public hearing invitation to ${memberName} at ${member.email}`);
        
        const result = await sendPublicHearingInvitationEmail(
          member.email,
          memberName,
          hearing,
          organizerName
        );
        
        // Add to recipients list regardless of success or failure
        recipients.push({
          id: member.id,
          name: memberName,
          email: member.email
        });
        
        if (result) {
          console.log(`Successfully sent public hearing invitation to ${member.email}`);
          successCount++;
        } else {
          console.error(`Failed to send public hearing invitation to ${member.email}`);
          failedCount++;
        }
      } catch (error) {
        console.error(`Error sending public hearing invitation to ${member.email}:`, error);
        failedCount++;
      }
    } else {
      console.warn(`Skipping member ID ${member.id}: No email address available`);
      failedCount++;
    }
  }
  
  console.log(`Public hearing invitations sent: ${successCount} successful, ${failedCount} failed`);
  return { success: successCount, failed: failedCount, recipients };
}
export async function sendMeetingInvitationsToAllAttendees(
  meeting: Meeting,
  attendees: Array<MeetingAttendee & { user?: User }>,
  organizerName: string
): Promise<{ success: number, failed: number }> {
  let successCount = 0;
  let failedCount = 0;
  
  console.log(`Sending meeting invitations to ${attendees.length} attendees for meeting: ${meeting.name}`);
  
  // Debug: print all attendees
  attendees.forEach((attendee, index) => {
    console.log(`Attendee ${index + 1}:`, {
      id: attendee.id,
      userId: attendee.userId,
      email: attendee.user?.email || 'No email available',
      name: attendee.user?.fullName || attendee.user?.username || 'Unknown'
    });
  });
  
  for (const attendee of attendees) {
    // If we have the user object directly attached to the attendee
    if (attendee.user && attendee.user.email) {
      console.log(`Sending invitation to ${attendee.user.fullName || attendee.user.username} at ${attendee.user.email}`);
      const result = await sendMeetingInvitationEmail(
        attendee.user.email,
        attendee.user.fullName || attendee.user.username,
        meeting,
        organizerName
      );
      
      if (result) {
        console.log(`Successfully sent invitation to ${attendee.user.email}`);
        successCount++;
      } else {
        console.error(`Failed to send invitation to ${attendee.user.email}`);
        failedCount++;
      }
      continue;
    }
    
    // If we only have the userId, fetch the user details
    if (attendee.userId) {
      try {
        console.log(`Fetching user details for attendee with userId ${attendee.userId}`);
        const user = await storage.getUser(attendee.userId);
        if (user && user.email) {
          console.log(`Found user ${user.fullName || user.username} with email ${user.email}`);
          const result = await sendMeetingInvitationEmail(
            user.email,
            user.fullName || user.username,
            meeting,
            organizerName
          );
          
          if (result) {
            console.log(`Successfully sent invitation to ${user.email}`);
            successCount++;
          } else {
            console.error(`Failed to send invitation to ${user.email}`);
            failedCount++;
          }
        } else {
          console.warn(`Could not send invitation to user ID ${attendee.userId}: Missing email or user not found`);
          failedCount++;
        }
      } catch (error) {
        console.error(`Error sending invitation to user ID ${attendee.userId}:`, error);
        failedCount++;
      }
    }
  }
  
  console.log(`Meeting invitations sent: ${successCount} successful, ${failedCount} failed`);
  return { success: successCount, failed: failedCount };
}

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
      color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      padding: 25px 20px;
      text-align: center;
    }
    .logo {
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    .greeting {
      font-weight: 700;
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
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
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
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
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
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
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
      color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
      font-weight: 700;
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
      color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      padding: 25px 20px;
      text-align: center;
    }
    .logo {
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 30px;
      background-color: #ffffff;
    }
    .greeting {
      font-weight: 700;
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
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
      font-weight: 700;
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
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
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
      color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      padding: 12px 25px;
      text-decoration: none;
      border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);
      font-weight: 700;
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
              
              // Get MIME type based on file extension or use the default
              let mimeType = file.type || 'application/octet-stream';
              const fileExtension = file.name.split('.').pop()?.toLowerCase();
              
              // Map common file extensions to MIME types
              if (fileExtension && !file.type) {
                const mimeMap: Record<string, string> = {
                  'pdf': 'application/pdf',
                  'doc': 'application/msword',
                  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'xls': 'application/vnd.ms-excel',
                  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'png': 'image/png',
                  'jpg': 'image/jpeg',
                  'jpeg': 'image/jpeg',
                  'gif': 'image/gif',
                  'odt': 'application/vnd.oasis.opendocument.text'
                };
                mimeType = mimeMap[fileExtension] || mimeType;
              }
              
              // Create metadata for the attachment
              const attachmentData = {
                filename: file.name,
                content,
                type: mimeType,
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