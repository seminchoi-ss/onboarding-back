#!/bin/bash

echo "Stopping existing PM2 process..."

# Source nvm to get node/npm/pm2 on the PATH for ubuntu user
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Navigate to the application directory
cd /home/ubuntu/app-tier || { echo "Error: /home/ubuntu/app-tier not found. Exiting."; exit 1; }

# Stop if running, ignore if not, and suppress all output (stdout and stderr)
pm2 stop app-tier >/dev/null 2>&1 || true

# Delete if exists, ignore if not, and suppress all output
pm2 delete app-tier >/dev/null 2>&1 || true

echo "Cleaning up previous application files in /home/ubuntu/app-tier..."
# Remove all contents of the application directory
# This ensures a clean slate for the new deployment
rm -rf /home/ubuntu/app-tier/*
rm -rf /home/ubuntu/app-tier/.* 2>/dev/null # Remove hidden files/dirs, suppress error if none exist
