#!/bin/bash

# Test script for welcome email functionality

echo "Testing welcome email in ComuniGov"
echo "-----------------------------------------------------"

if [ -z "$1" ]; then
  echo "Error: No recipient email specified."
  echo "Usage: $0 <recipient-email>"
  exit 1
fi

RECIPIENT_EMAIL="$1"

echo "Will send test welcome email to: $RECIPIENT_EMAIL"

# Execute test using tsx
npx tsx << SCRIPT
import { sendNewMemberWelcomeEmail } from './server/email-service';

async function testWelcomeEmail() {
  console.log('Sending test welcome email to ${RECIPIENT_EMAIL}');
  
  const result = await sendNewMemberWelcomeEmail(
    '${RECIPIENT_EMAIL}',
    'Test User',
    'testuser',
    'Temp1234!',
    'Test Organization'
  );
  
  if (result) {
    console.log('Welcome email sent successfully!');
  } else {
    console.error('Failed to send welcome email.');
    process.exit(1);
  }
}

testWelcomeEmail();
SCRIPT

echo "Test completed."
