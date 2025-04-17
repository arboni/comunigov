# ComuniGov WhatsApp Integration Guide

This guide explains how to set up and troubleshoot the WhatsApp messaging integration in ComuniGov using Twilio.

## Prerequisites

1. A Twilio account with:
   - Account SID
   - Auth Token
   - WhatsApp-enabled number
   
2. Proper environment variables configured:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER` (in the format: +14155238886)

## Setup Process

### 1. Joining the Twilio WhatsApp Sandbox

Before you can receive messages from the Twilio WhatsApp API, you must join the sandbox:

1. Log in to your Twilio account and navigate to the WhatsApp sandbox
2. Find your unique "join" code (e.g., "join apple-green")
3. Using your personal WhatsApp, send this exact code to the Twilio WhatsApp number
4. You'll receive a confirmation message once you've successfully joined

**Important:** This is a required step! Your phone cannot receive WhatsApp messages from Twilio until you complete this process.

### 2. Testing Direct WhatsApp Integration

To test the direct WhatsApp connection:

```bash
npx tsx test-whatsapp.ts +YOUR_PHONE_NUMBER
```

Replace `+YOUR_PHONE_NUMBER` with your full phone number including country code (e.g., +1234567890).

A successful test will show:
```
Attempting to send WhatsApp message directly to +1234567890...
Make sure you have connected to the Twilio WhatsApp Sandbox...
💬 WhatsApp message sent successfully!
```

### 3. Using WhatsApp in ComuniGov

Once the direct test works, you can:

1. Log in to ComuniGov
2. Navigate to Communications
3. Create a new communication
4. Select "WhatsApp" as the delivery channel
5. Choose recipients who have WhatsApp numbers in their profiles
6. Send the message

## Troubleshooting

### Common Issues

1. **Messages Not Being Received**
   - Verify you've joined the Twilio sandbox
   - Confirm your phone number is formatted with the country code (e.g., +1234567890)
   - Check the Twilio console for any error messages

2. **Invalid Phone Number Errors**
   - Ensure the phone number includes the country code
   - Remove any spaces or special characters except the + sign
   - Format should be: +[country code][number]

3. **WhatsApp Being Skipped for Email**
   - Check if the user profile has a valid WhatsApp number
   - Verify the Twilio credentials are correct
   - Look for error messages in the server logs

### Viewing Logs

For debugging, check the server logs:
```
Sending WhatsApp message to +1234567890 for recipient User Name
WHATSAPP MESSAGE to +1234567890 (User Name)
From: Sender Name
Subject: Message Subject
Content: [Message Content]
WhatsApp message succeeded/failed
```

### Twilio Sandbox Limitations

The Twilio WhatsApp Sandbox has some limitations:

1. Messages can only be sent to phones that have joined the sandbox
2. The sandbox expires after 72 hours of inactivity (you'll need to rejoin)
3. Templates may be required for certain message types
4. Only a limited number of messages can be sent per day

## Production Considerations

When moving to production:

1. Apply for a Twilio WhatsApp Business account
2. Register message templates for different use cases
3. Configure a webhook for delivery confirmations
4. Consider implementing retry logic for failed messages

## Testing

Always test your WhatsApp integration after:
1. Changing Twilio credentials
2. Updating the messaging service code
3. Modifying message templates
4. Adding new types of notifications

## Need Help?

If you're still having issues:
1. Check the Twilio console for specific error messages
2. Review the ComuniGov server logs
3. Try sending a direct message with the test script
4. Verify your WhatsApp number is still connected to the sandbox