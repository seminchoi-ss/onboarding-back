#!/bin/bash

echo "Validating service health..."

# Add a health check here. For example, curl a health endpoint.
# For now, just check if pm2 process is online.
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if pm2 list | grep -q "app-tier.*online"; then
  echo "Application 'app-tier' is online."
  exit 0
else
  echo "Application 'app-tier' is NOT online."
  exit 1
fi
