/**
 * WhatsApp Messaging Service for ComuniGov
 * 
 * This service handles sending messages via WhatsApp
 * Currently integrated as a mock service for development
 * In production, this would be replaced with an actual WhatsApp Business API
 * integration or a third-party service like Twilio or MessageBird.
 */

// WhatsApp API config (would be read from environment variables in production)
const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED === 'true';
const WHATSAPP_DEBUG = true; // Set to true to see detailed logs

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
  if (!WHATSAPP_ENABLED) {
    if (WHATSAPP_DEBUG) {
      console.log('WhatsApp messaging is disabled. Set WHATSAPP_ENABLED=true to enable.');
    }
    return false;
  }

  try {
    // Format and validate the phone number
    const formattedNumber = formatPhoneNumber(to);
    if (!isValidWhatsAppNumber(formattedNumber)) {
      console.error(`Invalid WhatsApp number: ${to}`);
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
    
    // In a real implementation, this would make an API call to WhatsApp Business API
    // Example with Twilio:
    /*
    const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilioClient.messages.create({
      body: formattedMessage,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${formattedNumber}`
    });
    */
    
    // For now, simulate a successful send
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}