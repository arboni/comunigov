/**
 * Telegram Messaging Service for ComuniGov
 * 
 * This service handles sending messages via Telegram
 * Currently integrated as a mock service for development
 * In production, this would be replaced with an actual Telegram Bot API integration.
 */

// Telegram API config (would be read from environment variables in production)
const TELEGRAM_ENABLED = process.env.TELEGRAM_ENABLED === 'true';
const TELEGRAM_DEBUG = true; // Set to true to see detailed logs

/**
 * Validates if a Telegram username is in the correct format
 * Very basic validation - in production this would verify with Telegram API
 */
function isValidTelegramUsername(username: string): boolean {
  // Basic validation: should start with @ and have at least 5 characters
  return username.startsWith('@') && username.length >= 5;
}

/**
 * Validates if a string is likely a valid Telegram chat ID
 */
function isValidTelegramChatId(chatId: string): boolean {
  // Chat IDs are numeric values
  return /^-?\d+$/.test(chatId);
}

/**
 * Formats a message for Telegram with proper Markdown V2 syntax
 */
function formatTelegramMessage(
  recipientName: string,
  senderName: string,
  subject: string,
  content: string,
  hasAttachments: boolean
): string {
  // Escape special characters for Markdown V2
  const escapedSubject = subject.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  const escapedContent = content.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  
  let message = `*ComuniGov: ${escapedSubject}*\n\n`;
  message += `Hello ${recipientName},\n\n`;
  message += `You have received a message from *${senderName}*.\n\n`;
  message += `*Message:*\n${escapedContent}\n\n`;
  
  if (hasAttachments) {
    message += `_This message has attachments. Please log in to the ComuniGov platform to view them._\n\n`;
  }
  
  message += `For more information, visit comunigov.app`;
  
  return message;
}

/**
 * Sends a communication message via Telegram
 * @param to - Recipient's Telegram username or chat ID
 * @param recipientName - Recipient's name
 * @param senderName - Sender's name
 * @param subject - Message subject
 * @param content - Message content
 * @param hasAttachments - Whether the message has attachments
 * @returns Promise resolving to true if successful
 */
export async function sendTelegramMessage(
  to: string,
  recipientName: string,
  senderName: string,
  subject: string,
  content: string,
  hasAttachments: boolean = false
): Promise<boolean> {
  // Skip if Telegram is disabled
  if (!TELEGRAM_ENABLED) {
    if (TELEGRAM_DEBUG) {
      console.log('Telegram messaging is disabled. Set TELEGRAM_ENABLED=true to enable.');
    }
    return false;
  }

  try {
    // Validate the recipient info (username or chat ID)
    if (!isValidTelegramUsername(to) && !isValidTelegramChatId(to)) {
      console.error(`Invalid Telegram identifier: ${to}`);
      return false;
    }
    
    // Format the message with Markdown V2
    const formattedMessage = formatTelegramMessage(
      recipientName,
      senderName,
      subject,
      content,
      hasAttachments
    );
    
    // Debug log in development
    if (TELEGRAM_DEBUG) {
      console.log(`TELEGRAM MESSAGE to ${to} (${recipientName})`);
      console.log(`From: ${senderName}`);
      console.log(`Subject: ${subject}`);
      console.log('Content:');
      console.log(formattedMessage);
    }
    
    // In a real implementation, this would make an API call to Telegram Bot API
    // Example:
    /*
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: to,
        text: formattedMessage,
        parse_mode: 'MarkdownV2',
      }),
    });
    
    const data = await response.json();
    return data.ok === true;
    */
    
    // For now, simulate a successful send
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}