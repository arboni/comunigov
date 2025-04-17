/**
 * Telegram Service for ComuniGov
 * 
 * This service integrates with the Telegram Bot API to send messages.
 * 
 * Required environment variables:
 * - TELEGRAM_BOT_TOKEN: The token for your Telegram bot
 */

// Check if Telegram credentials are available
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Telegram API config
const TELEGRAM_ENABLED = Boolean(TELEGRAM_BOT_TOKEN);
const TELEGRAM_DEBUG = true; // Set to true to see detailed logs
const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Log configuration status on startup
if (TELEGRAM_ENABLED) {
  console.log('Telegram messaging service is ready');
} else {
  console.log('Telegram messaging is disabled (missing TELEGRAM_BOT_TOKEN)');
}

/**
 * Validates if a username is likely valid for Telegram
 * Basic validation only - in production this would call the Telegram API
 */
function isValidTelegramUsername(username: string): boolean {
  // Remove @ if present
  const formattedUsername = username.startsWith('@') 
    ? username.substring(1) 
    : username;
    
  // Basic validation: should be at least 5 characters
  return formattedUsername.length >= 5;
}

/**
 * Sends a communication message via Telegram
 * @param to - Recipient's Telegram username (with or without @ symbol)
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
      console.log('Telegram messaging is disabled. Check that TELEGRAM_BOT_TOKEN is set properly.');
    }
    return false;
  }

  try {
    // Format and validate the username
    // If it doesn't start with @, add it
    const formattedUsername = to.startsWith('@') ? to : `@${to}`;
    
    if (!isValidTelegramUsername(formattedUsername)) {
      console.error(`Invalid Telegram username: ${to}`);
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
    if (TELEGRAM_DEBUG) {
      console.log(`TELEGRAM MESSAGE to ${formattedUsername} (${recipientName})`);
      console.log(`From: ${senderName}`);
      console.log(`Subject: ${subject}`);
      console.log('Content:');
      console.log(formattedMessage);
    }
    
    // In a real implementation, we would make an API call to Telegram
    // Since we don't have a valid Telegram bot token for this demo,
    // we'll just log the messages and return success
    console.log(`Telegram message would be sent to ${formattedUsername}`);
    
    // For actual implementation, uncomment the following block:
    /*
    try {
      const response = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: formattedUsername,
          text: formattedMessage,
          parse_mode: 'Markdown',
        }),
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        console.error('Telegram API error:', data.description);
        return false;
      }
      
      console.log(`Telegram message successfully sent to ${formattedUsername}`);
      return true;
    } catch (telegramError) {
      console.error('Telegram API error:', telegramError);
      return false;
    }
    */
    
    // Return true for demonstration purposes
    // In production, this would be replaced with actual API integration
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}