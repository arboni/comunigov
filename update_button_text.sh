#!/bin/bash

# This script updates the button text color in email-service.ts for better readability

# Replace the button text color style and add text shadow for better visibility
sed -i 's/color: white;/color: #ffffff; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);/g' server/email-service.ts

# Make text bolder for better visibility
sed -i 's/font-weight: 600;/font-weight: 700;/g' server/email-service.ts

echo "Button text styling updated for better visibility"
