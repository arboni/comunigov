/**
 * WhatsApp Messaging Service for ComuniGov
 * 
 * This service handles sending messages via WhatsApp using Twilio's API
 * It requires the following environment variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_NUMBER (in the format: +14155238886)
 */

import twilio from 'twilio';

// Check if Twilio credentials are available
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// WhatsApp API config
const WHATSAPP_ENABLED = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER;
const WHATSAPP_DEBUG = true; // Set to true to see detailed logs

// Initialize Twilio client if credentials are available
const twilioClient = WHATSAPP_ENABLED ? twilio(TWILIO_ACCOUNT_SID!, TWILIO_AUTH_TOKEN!) : null;

// Log configuration status on startup
if (WHATSAPP_ENABLED) {
  console.log('WhatsApp messaging service is ready with Twilio');
} else {
  console.log('WhatsApp messaging is disabled (missing Twilio credentials)');
}

/**
 * Formats a phone number for WhatsApp
 * Removes any non-digit characters and ensures it starts with a "+"
 */
function formatPhoneNumber(phone: string): string {
  // Strip any non-digit characters except the + sign
  let formatted = phone.replace(/[^0-9+]/g, '');
  
  // Ensure it starts with a +
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  
  return formatted;
}

/**
 * Validates if a phone number is likely valid for WhatsApp
 * Very basic validation - in production this would call the WhatsApp API
 * to check if the number exists on WhatsApp
 */
function isValidWhatsAppNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Basic validation: should be at least 10 digits plus the + sign
  return formatted.length >= 11;
}

/**
 * Sends a communication message via WhatsApp
 * @param to - Recipient phone number (with country code)
 * @param recipientName - Recipient's name
 * @param senderName - Sender's name
 * @param subject - Message subject
 * @param content - Message content
 * @param hasAttachments - Whether the message has attachments
 * @returns Promise resolving to true if successful
 */
export async function sendWhatsAppMessage(
  to: string,
  recipientName: string,
  senderName: string,
  subject: string,
  content: string,
  hasAttachments: boolean = false
): Promise<boolean> {
  // Skip if WhatsApp is disabled
  if (!WHATSAPP_ENABLED || !twilioClient) {
    if (WHATSAPP_DEBUG) {
      console.log('WhatsApp messaging is disabled. Check that Twilio credentials are set properly.');
    }
    return false;
  }

  try {
    // Check if to parameter is empty or null
    if (!to) {
      console.error('WhatsApp target number is empty or null');
      return false;
    }

    // Format and validate the phone number
    const formattedNumber = formatPhoneNumber(to);
    console.log(`WhatsApp: Formatted number from "${to}" to "${formattedNumber}"`);
    
    if (!isValidWhatsAppNumber(formattedNumber)) {
      console.error(`Invalid WhatsApp number: ${to} (formatted: ${formattedNumber})`);
      return false;
    }
    
    // Format the message content
    const formattedMessage = `
*ComuniGov: ${subject}*

Hello ${recipientName},

You have received a message from ${senderName}.

*Message:*
${content}

${hasAttachments ? 'This message has attachments. Please log in to the ComuniGov platform to view them.' : ''}

For more information, visit comunigov.app
`;
    
    // Debug log in development
    if (WHATSAPP_DEBUG) {
      console.log(`WHATSAPP MESSAGE to ${formattedNumber} (${recipientName})`);
      console.log(`From: ${senderName}`);
      console.log(`Subject: ${subject}`);
      console.log('Content:');
      console.log(formattedMessage);
    }
    
    // Make an API call to Twilio's WhatsApp API
    if (!twilioClient) {
      console.error('Twilio client not initialized');
      return false;
    }
    
    try {
      // Clean and prepare the WhatsApp number formats
      const fromNumber = TWILIO_WHATSAPP_NUMBER!.startsWith('+') 
          ? TWILIO_WHATSAPP_NUMBER 
          : `+${TWILIO_WHATSAPP_NUMBER}`;
          
      console.log(`Using WhatsApp from number: ${fromNumber}`);
      
      // Send the message via Twilio WhatsApp
      await twilioClient.messages.create({
        body: formattedMessage,
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${formattedNumber}`
      });
      
      console.log(`WhatsApp message successfully sent to ${formattedNumber}`);
      return true;
    } catch (twilioError) {
      console.error('Twilio WhatsApp API error:', twilioError);
      return false;
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}