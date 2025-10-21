#!/bin/bash

echo "Installing Node.js dependencies..."

# Source nvm to get node/npm/pm2 on the PATH for ubuntu user
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /home/ubuntu/app-tier
npm install --production
