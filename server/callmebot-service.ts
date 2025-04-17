/**
 * Callmebot WhatsApp Messaging Service for ComuniGov
 * 
 * This service handles sending messages via WhatsApp using Callmebot's API
 * It's a free alternative to Twilio for testing purposes
 * 
 * For setup instructions, see: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 */

import axios from 'axios';

// Callmebot API base URL
const CALLMEBOT_API_URL = 'https://api.callmebot.com/whatsapp.php';

// CallMeBot API key - this should be stored in an environment variable in production
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY || '8339051';

// Debug flag for verbose logging
const CALLMEBOT_DEBUG = true;

/**
 * Validate a phone number for WhatsApp usage
 * @param phone The phone number to validate
 * @returns True if the phone number is valid for WhatsApp
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  if (!phone) {
    if (CALLMEBOT_DEBUG) console.log(`CallMeBot validation failed: Phone number is empty`);
    return false;
  }
  
  // Remove any non-digit characters except the + sign
  const formatted = phone.replace(/[^0-9+]/g, '');
  
  // Basic validation: should be at least 10 digits plus the + sign
  const isValid = formatted.length >= 11;
  
  // Advanced debugging for all WhatsApp validation attempts
  if (CALLMEBOT_DEBUG) {
    console.log(`CallMeBot validation for number: "${formatted}"`);
    console.log(`- Number length: ${formatted.length}`);
    console.log(`- Valid: ${isValid}`);
    console.log(`- Starts with +: ${formatted.startsWith('+')}`);
    console.log(`- Digits only (except +): ${/^\+[0-9]+$/.test(formatted)}`);
  }
  
  return isValid;
}

/**
 * Format a phone number for CallMeBot
 * @param phone The phone number to format
 * @returns Formatted phone number for Callmebot
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove any non-digit characters except the + sign
  let formatted = phone.replace(/[^0-9+]/g, '');
  
  // Ensure it starts with a +
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  
  // For CallMeBot, we need to remove the + sign
  formatted = formatted.replace('+', '');
  
  // Debug log
  if (CALLMEBOT_DEBUG && phone !== formatted) {
    console.log(`CallMeBot: Formatted number from "${phone}" to "${formatted}"`);
  }
  
  return formatted;
}

/**
 * Sends a WhatsApp message using Callmebot API
 * 
 * NOTE: Before using this, the recipient must:
 * 1. Send a message to CallMeBot: +34 644 66 01 95 with "I allow callmebot to send me messages"
 * 2. Wait for the confirmation message from CallMeBot
 * 
 * @param to Recipient phone number (without + sign)
 * @param recipientName Recipient name (for logging)
 * @param senderName Sender name (to display in the message)
 * @param subject Message subject
 * @param content Message content
 * @param hasAttachments Whether there are attachments
 * @returns True if message was sent successfully
 */
export async function sendWhatsAppMessage(
  to: string,
  recipientName: string,
  senderName: string,
  subject: string,
  content: string,
  hasAttachments: boolean = false
): Promise<boolean> {
  try {
    // Check if to parameter is empty or null
    if (!to) {
      console.error('CallMeBot target number is empty or null');
      return false;
    }

    // Format and validate the phone number
    const formattedNumber = formatPhoneNumber(to);
    
    if (!isValidWhatsAppNumber(to)) {
      console.error(`Invalid CallMeBot number: ${to} (formatted: ${formattedNumber})`);
      return false;
    }
    
    // Format the message content - CallMeBot supports basic formatting
    const formattedMessage = `
*ComuniGov: ${subject}*

Hello ${recipientName},

You have received a message from ${senderName}.

*Message:*
${content}

${hasAttachments ? 'This message has attachments. Please log in to the ComuniGov platform to view them.' : ''}

For more information, visit comunigov.app
`;

    // Add a setup reminder note
    const setupNote = `
⚠️ IMPORTANT: For CallMeBot to work, the recipient must:
1. Send "I allow callmebot to send me messages" to +34 644 66 01 95 on WhatsApp
2. Wait for confirmation from CallMeBot before receiving messages
`;

    // Debug log in development
    if (CALLMEBOT_DEBUG) {
      console.log(`CALLMEBOT MESSAGE to ${formattedNumber} (${recipientName})`);
      console.log(`From: ${senderName}`);
      console.log(`Subject: ${subject}`);
      console.log('Content:');
      console.log(formattedMessage);
      console.log(setupNote);
    }

    // Prepare API request params
    const params = new URLSearchParams({
      phone: formattedNumber,
      text: `${formattedMessage}`,
      apikey: CALLMEBOT_API_KEY, // Your CallMeBot API key
    });

    console.log(`Sending CallMeBot request to phone: ${formattedNumber}`);
    
    // Make an API request to CallMeBot
    const response = await axios.get(`${CALLMEBOT_API_URL}?${params.toString()}`);
    
    if (response.status === 200) {
      console.log(`CallMeBot message sent to ${formattedNumber}`);
      console.log(`Response: ${response.data}`);
      
      // Check if response contains error message
      if (response.data.includes('ERROR') || response.data.includes('error')) {
        console.error(`CallMeBot API returned an error: ${response.data}`);
        console.error(setupNote);
        return false;
      }
      
      console.log(`CallMeBot message sent successfully`);
      return true;
    } else {
      console.error(`CallMeBot API returned status code: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending CallMeBot WhatsApp message:', error);
    return false;
  }
}