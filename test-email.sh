#!/bin/bash

# Email test script
echo "Testing email functionality in ComuniGov"
echo "----------------------------------------"

# Check if recipient email is provided
if [ -z "$1" ]; then
  echo "Error: No recipient email specified."
  echo "Usage: ./test-email.sh <recipient-email>"
  exit 1
fi

RECIPIENT="$1"
echo "Will send test email to: $RECIPIENT"

# Run the test-email.ts script
NODE_ENV=development tsx server/test-email.ts "$RECIPIENT"