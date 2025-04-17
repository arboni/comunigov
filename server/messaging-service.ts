/**
 * Unified Messaging Service for ComuniGov
 * 
 * This service provides a unified interface for sending messages through various channels:
 * - Email (via Gmail SMTP)
 * - WhatsApp 
 * - Telegram
 */

import { sendCommunicationEmail } from './email-service';
import { sendWhatsAppMessage } from './whatsapp-provider';
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
 * @param communicationId - The ID of the communication (for fetching attachments)
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
  communicationId?: number,
  hasAttachments: boolean = false
): Promise<MessageSendResult> {
  try {
    console.log(`sendMessage called with channel: ${channel}, communicationId: ${communicationId}, hasAttachments: ${hasAttachments}`);
    let success = false;
    
    switch (channel) {
      case 'email':
        console.log(`Sending email for communication ID: ${communicationId} with attachments: ${hasAttachments}`);
        success = await sendCommunicationEmail(
          to,
          recipientName,
          senderName,
          subject,
          content,
          communicationId,
          hasAttachments
        );
        break;
        
      case 'whatsapp':
        console.log(`Sending WhatsApp message to ${to} for recipient ${recipientName}`);
        success = await sendWhatsAppMessage(
          to,
          recipientName,
          senderName,
          subject,
          content,
          hasAttachments
        );
        console.log(`WhatsApp message ${success ? 'succeeded' : 'failed'}`);
        break;
        
      case 'telegram':
        console.log(`Sending Telegram message to ${to} for recipient ${recipientName}`);
        success = await sendTelegramMessage(
          to,
          recipientName,
          senderName,
          subject,
          content,
          hasAttachments
        );
        console.log(`Telegram message ${success ? 'succeeded' : 'failed'}`);
        break;
        
      case 'system_notification':
        // System notifications not implemented yet, will be stored in the database
        // and displayed in the user's notification center
        console.log(`SYSTEM NOTIFICATION for ${recipientName}`);
        console.log(`From: ${senderName}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${content}`);
        // For now, return true as if it was sent successfully
        success = true;
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
 * @param communicationId - The ID of the communication (for fetching attachments)
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
  communicationId?: number,
  hasAttachments: boolean = false
): Promise<MessageSendResult[]> {
  const results: MessageSendResult[] = [];
  
  // Try each channel in order until one succeeds
  for (const channel of channels) {
    const contactInfo = to[channel];
    
    // Skip channels without contact info
    if (!contactInfo) {
      console.log(`Skipping ${channel} channel for ${recipientName}: No contact information available`);
      results.push({
        success: false,
        channel,
        error: `No contact information available for ${channel}`
      });
      continue;
    }
    
    // Extended logging for WhatsApp
    if (channel === 'whatsapp') {
      console.log(`Attempting WhatsApp message to: "${contactInfo}" for user ${recipientName}`);
    }
    
    const result = await sendMessage(
      channel,
      contactInfo,
      recipientName,
      senderName,
      subject,
      content,
      communicationId,
      hasAttachments
    );
    
    results.push(result);
    
    // If this channel was successful, stop trying others
    if (result.success) break;
  }
  
  return results;
}

/**
 * Helper function to send a message to multiple recipients with fallback options
 * @param recipients - Array of recipient information
 * @param defaultChannel - Default channel to try first
 * @param senderName - Name of the sender
 * @param subject - Subject of the message
 * @param content - Content of the message
 * @param communicationId - The ID of the communication (for fetching attachments)
 * @param hasAttachments - Whether the message has attachments
 * @returns Promise resolving to an array of results for each recipient
 */
export async function sendMessageToAll(
  recipients: Array<{
    userId?: number;
    entityId?: number;
    name: string;
    contactInfo: Record<MessageChannel, string | undefined>;
  }>,
  defaultChannel: MessageChannel,
  senderName: string,
  subject: string,
  content: string,
  communicationId?: number,
  hasAttachments: boolean = false
): Promise<Record<string, MessageSendResult[]>> {
  const results: Record<string, MessageSendResult[]> = {};
  
  // Define fallback channels in order of preference
  const fallbackChannels: MessageChannel[] = ['email', 'whatsapp', 'telegram'];
  
  for (const recipient of recipients) {
    const recipientKey = `${recipient.userId || ''}:${recipient.entityId || ''}:${recipient.name}`;
    
    // Try primary channel first, then fallbacks
    results[recipientKey] = await sendMessageWithFallback(
      [defaultChannel, ...fallbackChannels.filter(c => c !== defaultChannel)],
      recipient.contactInfo,
      recipient.name,
      senderName,
      subject,
      content,
      communicationId,
      hasAttachments
    );
  }
  
  return results;
}