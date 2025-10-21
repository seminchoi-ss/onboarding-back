#!/bin/bash

echo "Stopping existing PM2 process..."

# Source nvm to get node/npm/pm2 on the PATH for ubuntu user
export NVM_DIR="/home/ubuntu/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /home/ubuntu/app-tier

pm2 stop app-tier || true # Stop if running, ignore if not
pm2 delete app-tier || true # Delete if exists, ignore if not
