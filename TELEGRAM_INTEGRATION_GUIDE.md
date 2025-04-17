# ComuniGov Telegram Integration Guide

This guide explains how to set up and troubleshoot the Telegram messaging integration in ComuniGov.

## Prerequisites

1. A Telegram account
2. A Telegram bot (created through BotFather)
3. The bot's API token

## Setup Process

### 1. Creating a Telegram Bot

To create a Telegram bot:

1. Open Telegram and search for "@BotFather"
2. Start a chat with BotFather and send the command `/newbot`
3. Follow the instructions to name your bot
4. Once created, BotFather will provide you with an API token - this is your `TELEGRAM_BOT_TOKEN`

### 2. Setting Up Environment Variables

Add the following environment variable to your ComuniGov application:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### 3. Preparing Users to Receive Messages

Before users can receive messages from your Telegram bot:

1. They must search for and find your bot by its username
2. They must start a conversation with the bot by sending any message
3. The user's Telegram username should be added to their ComuniGov profile

### 4. Testing the Telegram Integration

To test if your Telegram integration is working:

```bash
npx tsx test-all-channels.ts user@example.com +1234567890 @telegramuser
```

Replace `@telegramuser` with your Telegram username. Make sure to include the `@` symbol.

Alternatively, test just the Telegram channel:

```bash
npx tsx -e "import { sendTelegramMessage } from './server/telegram-service'; sendTelegramMessage('@telegramuser', 'Test User', 'Admin', 'Test Message', 'This is a test message');"
```

## User Profile Setup

For users to receive Telegram messages from ComuniGov:

1. The user should have a Telegram account
2. The user must start a chat with your bot
3. Their Telegram username must be added to their ComuniGov profile
4. The username format should include the `@` symbol (e.g., `@username`)

## Troubleshooting

### Common Issues

1. **Bot Not Responding**
   - Make sure the `TELEGRAM_BOT_TOKEN` is correctly set
   - Verify the bot is active and online
   - Check if the user has started a conversation with the bot

2. **Messages Not Being Delivered**
   - Confirm the username is correct and includes the `@` symbol
   - Ensure the user has not blocked the bot
   - Verify the bot has permission to send messages

3. **API Errors**
   - Check the application logs for specific Telegram API errors
   - Verify the bot token is valid and not expired
   - Ensure you're not hitting Telegram API rate limits

### Viewing Logs

For debugging, check the server logs:

```
TELEGRAM MESSAGE to @username (User Name)
From: Sender Name
Subject: Message Subject
Content: [Message Content]
```

## Production Considerations

When moving to production:

1. Consider creating a more sophisticated bot with commands and interactivity
2. Implement webhook callbacks to track message delivery status
3. Add retry mechanisms for failed messages
4. Include message templates for common communications

## Additional Features

The Telegram API offers many additional features you might want to consider:

1. Rich media messages (photos, documents, etc.)
2. Interactive buttons and inline keyboards
3. Message formatting (bold, italic, links, etc.)
4. Bot commands for specific actions

## Need Help?

If you're still having issues:

1. Check the Telegram Bot API documentation
2. Review the ComuniGov server logs for error details
3. Verify the bot is properly configured via BotFather
4. Test with a different Telegram user to isolate user-specific issues