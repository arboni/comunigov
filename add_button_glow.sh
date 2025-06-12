#!/bin/bash

# This script adds a subtle inner glow to buttons in email-service.ts

# Add a bright border to create a glow effect
perl -i -pe 's/border-radius: 6px;/border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.5);/g' server/email-service.ts

echo "Added subtle glow to buttons for better visibility"
