/**
 * Unified Messaging Service for ComuniGov
 * 
 * This service provides a unified interface for sending messages through various channels:
 * - Email (via SendGrid)
 * - WhatsApp 
 * - Telegram
 */

import { sendCommunicationEmail } from './email-service';
import { sendWhatsAppMessage } from './whatsapp-service';
import { sendTelegramMessage } from './telegram-service';

// Message channel types
export type MessageChannel = 'email' | 'whatsapp' | 'telegram' | 'system_notification';

// Message send result
export interface MessageSendResult {
  success: boolean;
  channel: MessageChannel;
  error?: string;
}

/**
 * Sends a communication message through the specified channel
 * @param channel - The communication channel to use
 * @param to - Recipient's contact info (email/phone/username depending on channel)
 * @param recipientName - Recipient's name
 * @param senderName - Sender's name
 * @param subject - Message subject
 * @param content - Message content
 * @param hasAttachments - Whether the message has attachments
 * @returns Promise resolving to a MessageSendResult
 */
export async function sendMessage(
  channel: MessageChannel,
  to: string,
  recipientName: string,
  senderName: string,
  subject: string,
  content: string,
  hasAttachments: boolean = false
): Promise<MessageSendResult> {
  try {
    let success = false;
    
    switch (channel) {
      case 'email':
        success = await sendCommunicationEmail(
          to,
          recipientName,
          senderName,
          subject,
          content,
          hasAttachments
        );
        break;
        
      case 'whatsapp':
        success = await sendWhatsAppMessage(
          to,
          recipientName,
          senderName,
          subject,
          content,
          hasAttachments
        );
        break;
        
      case 'telegram':
        success = await sendTelegramMessage(
          to,
          recipientName,
          senderName,
          subject,
          content,
          hasAttachments
        );
        break;
        
      default:
        return {
          success: false,
          channel,
          error: `Unsupported channel: ${channel}`
        };
    }
    
    return { success, channel };
  } catch (error) {
    console.error(`Error sending message via ${channel}:`, error);
    return {
      success: false,
      channel,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Attempts to send a message through multiple channels in order until one succeeds
 * @param channels - Array of channels to try, in priority order
 * @param to - Map of recipient's contact info for each channel
 * @param recipientName - Recipient's name
 * @param senderName - Sender's name
 * @param subject - Message subject
 * @param content - Message content
 * @param hasAttachments - Whether the message has attachments
 * @returns Promise resolving to an array of MessageSendResults for each attempted channel
 */
export async function sendMessageWithFallback(
  channels: MessageChannel[],
  to: Record<MessageChannel, string | undefined>,
  recipientName: string,
  senderName: string,
  subject: string,
  content: string,
  hasAttachments: boolean = false
): Promise<MessageSendResult[]> {
  const results: MessageSendResult[] = [];
  
  // Try each channel in order until one succeeds
  for (const channel of channels) {
    const contactInfo = to[channel];
    
    // Skip channels without contact info
    if (!contactInfo) {
      results.push({
        success: false,
        channel,
        error: `No contact information available for ${channel}`
      });
      continue;
    }
    
    const result = await sendMessage(
      channel,
      contactInfo,
      recipientName,
      senderName,
      subject,
      content,
      hasAttachments
    );
    
    results.push(result);
    
    // If this channel was successful, stop trying others
    if (result.success) break;
  }
  
  return results;
}