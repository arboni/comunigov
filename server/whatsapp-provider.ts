/**
 * WhatsApp Provider Service
 * 
 * This service manages the selection and configuration of WhatsApp providers
 * Currently supports:
 * - Twilio (requires paid account)
 * - CallMeBot (free alternative for testing)
 */

import * as twilio from './whatsapp-service';
import * as callmebot from './callmebot-service';

// Determine which provider to use - default to CallMeBot if WHATSAPP_PROVIDER is not set
export const WHATSAPP_PROVIDER = process.env.WHATSAPP_PROVIDER || 'callmebot';

/**
 * Check if WhatsApp provider is available
 * @returns Boolean indicating if WhatsApp messaging is enabled
 */
export function isWhatsAppEnabled(): boolean {
  if (WHATSAPP_PROVIDER === 'twilio') {
    return Boolean(process.env.TWILIO_ACCOUNT_SID && 
                  process.env.TWILIO_AUTH_TOKEN && 
                  process.env.TWILIO_WHATSAPP_NUMBER);
  } else if (WHATSAPP_PROVIDER === 'callmebot') {
    // CallMeBot doesn't require any special credentials to start using it
    return true;
  }
  return false;
}

/**
 * Format a phone number for WhatsApp usage based on selected provider
 * @param phone Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (WHATSAPP_PROVIDER === 'twilio') {
    return twilio.formatPhoneNumber(phone);
  } else {
    return callmebot.formatPhoneNumber(phone);
  }
}

/**
 * Check if a phone number is valid for WhatsApp usage
 * @param phone Phone number to validate
 * @returns Boolean indicating if the number is valid
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  if (WHATSAPP_PROVIDER === 'twilio') {
    return twilio.isValidWhatsAppNumber(phone);
  } else {
    return callmebot.isValidWhatsAppNumber(phone);
  }
}

/**
 * Send a WhatsApp message using the configured provider
 * @param to Recipient's phone number
 * @param recipientName Recipient's name
 * @param senderName Sender's name
 * @param subject Message subject
 * @param content Message content
 * @param hasAttachments Whether the message has attachments
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
  console.log(`Using WhatsApp provider: ${WHATSAPP_PROVIDER}`);
  
  if (WHATSAPP_PROVIDER === 'twilio') {
    return twilio.sendWhatsAppMessage(to, recipientName, senderName, subject, content, hasAttachments);
  } else {
    return callmebot.sendWhatsAppMessage(to, recipientName, senderName, subject, content, hasAttachments);
  }
}