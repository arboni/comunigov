#!/bin/bash

# This script updates the color scheme in email-service.ts to use softer blue tones
# Replacing the current indigo/purple color scheme with a gentler sky blue palette

# Replace the header background gradient 
sed -i 's/background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);/background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);/g' server/email-service.ts

# Replace the button background gradient
sed -i 's/background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);/background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);/g' server/email-service.ts

# Replace the border color for message boxes
sed -i 's/border-left: 4px solid #4f46e5;/border-left: 4px solid #60a5fa;/g' server/email-service.ts

# Replace the link color in footer
sed -i 's/color: #4f46e5;/color: #3b82f6;/g' server/email-service.ts

# Replace box shadow color for buttons
sed -i 's/box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25);/box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);/g' server/email-service.ts

echo "Color scheme updated to soft blue tones"
