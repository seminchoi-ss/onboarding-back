#!/bin/bash

echo "Starting application with PM2..."

# Source nvm to get node/npm/pm2 on the PATH for ubuntu user
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /home/ubuntu/app-tier
pm2 start index.js --name app-tier
pm2 save
