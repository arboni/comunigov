#!/bin/bash

# Test script for password reset email functionality

echo "Testing password reset email in ComuniGov"
echo "-----------------------------------------------------"

if [ -z "$1" ]; then
  echo "Error: No recipient email specified."
  echo "Usage: $0 <recipient-email>"
  exit 1
fi

RECIPIENT_EMAIL="$1"

echo "Will send test password reset email to: $RECIPIENT_EMAIL"

# Execute test using tsx
npx tsx << SCRIPT
import { sendPasswordResetEmail } from './server/email-service';

async function testResetEmail() {
  console.log('Sending test password reset email to ${RECIPIENT_EMAIL}');
  
  const result = await sendPasswordResetEmail(
    '${RECIPIENT_EMAIL}',
    'Test User',
    'testuser',
    'NewTemp1234!'
  );
  
  if (result) {
    console.log('Password reset email sent successfully!');
  } else {
    console.error('Failed to send password reset email.');
    process.exit(1);
  }
}

testResetEmail();
SCRIPT

echo "Test completed."
