#!/bin/bash

# Run the email attachment test
echo "Running email attachment test..."
NODE_ENV=development tsx server/test-email-attachment.ts

echo "Test completed."