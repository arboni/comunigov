import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// Interface for communication recipient info
export interface CommunicationRecipientInfo {
  userId?: number;
  entityId?: number;
  email: string;
  name: string;
}

// Email configuration
const DEFAULT_SUBJECT = 'ComuniGov Notification';
const FROM_EMAIL = process.env.GMAIL_USER || 'notifications@comunigov.app';
const FROM_NAME = 'ComuniGov Notifications';

// Path to the OAuth2 credentials file
const OAUTH2_CREDENTIALS_PATH = path.join(process.cwd(), 'config/credentials/service-account.json');

// OAuth2 token storage path
const TOKEN_PATH = path.join(process.cwd(), 'config/credentials/token.json');

// Gmail API client and OAuth2 client
let gmailClient: any = null;
let oauth2Client: any = null;
let isOAuth2Configured = false;

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
 * Get OAuth2 client
 * @returns OAuth2 client or null if configuration fails
 */
async function getOAuth2Client() {
  if (oauth2Client) {
    return oauth2Client;
  }

  try {
    // Check if credentials file exists
    if (!fs.existsSync(OAUTH2_CREDENTIALS_PATH)) {
      console.warn('OAuth2 credentials file not found. Email functionality will not be available.');
      return null;
    }

    // Load client credentials from file
    const credentials = JSON.parse(fs.readFileSync(OAUTH2_CREDENTIALS_PATH, 'utf8'));
    const { client_id, client_secret } = credentials.web;
    
    // Create OAuth2 client
    oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      'https://developers.google.com/oauthplayground'  // Redirect URI for testing - you may need to adjust this
    );

    // Check if we have stored token and set it
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      oauth2Client.setCredentials(token);
      isOAuth2Configured = true;
      console.log('OAuth2 token loaded successfully');
    } else {
      // We would normally have a flow to get a token here, but for simplicity
      // in this app, we'll use an app password instead if OAuth2 isn't fully configured
      console.log('No OAuth2 token found - will fallback to app password if available');
    }
    
    return oauth2Client;
  } catch (error) {
    console.error('Error initializing OAuth2 client:', error);
    return null;
  }
}

/**
 * Creates a nodemailer transporter with either OAuth2 or app password authentication
 * @returns Nodemailer transporter
 */
async function createTransporter() {
  // Try to get OAuth2 client first
  const auth = await getOAuth2Client();
  
  // If OAuth2 is configured and we have a token, use it
  if (auth && isOAuth2Configured) {
    console.log('Creating Gmail transporter with OAuth2');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: auth._clientId,
        clientSecret: auth._clientSecret,
        refreshToken: auth.credentials.refresh_token,
        accessToken: auth.credentials.access_token
      }
    });
  }
  
  // Fallback to app password
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log('Creating Gmail transporter with app password');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }
  
  console.warn('Neither OAuth2 nor app password credentials are available for email');
  return null;
}

/**
 * Sends an email using Gmail
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

    // Get transporter
    const transporter = await createTransporter();
    if (!transporter) {
      console.warn('Email not sent: No valid transporter available');
      return false;
    }

    // Prepare the email message
    const mailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
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