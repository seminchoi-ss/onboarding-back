packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "ap-northeast-2"
}

variable "git_hash" {
  type    = string
  default = "local"
}

source "amazon-ebs" "app-tier" {
  region        = var.aws_region
  instance_type = "t3.small"
  ssh_username  = "ubuntu"
  source_ami_filter {
    filters = {
      "tag:Name"          = "csm-app-tier-ami"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["self"]
  }
  ami_name = "csm-app-tier-${var.git_hash}"
  tags = {
    Name       = "csm-app-tier-ami"
    GitHash    = var.git_hash
  }
}

build {
  name    = "app-tier-build"
  sources = ["source.amazon-ebs.app-tier"]

  // Node.js, npm, pm2는 기반 AMI에 이미 설치되어 있다고 가정합니다.

  provisioner "file" {
    description = "Copy application files to temporary location"
    source      = "."
    destination = "/tmp/app-source"
  }

  provisioner "shell" {
    description = "Deploy application and start/reload with pm2"
    inline = [
      // Ensure directory exists and has correct owner
      "sudo mkdir -p /home/ubuntu/app-tier",
      "sudo chown -R ubuntu:ubuntu /tmp/app-source /home/ubuntu/app-tier",

      // Sync new code to the final destination
      "sudo -u ubuntu rsync -a --delete /tmp/app-source/ /home/ubuntu/app-tier/",

      // Run subsequent commands as the ubuntu
      "sudo -u ubuntu bash -c '",
      "  # Source nvm to get node/npm/pm2 on the PATH",
      "  export NVM_DIR=\"$HOME/.nvm\"",
      "  [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\"",
      "",
      "  cd /home/ubuntu/app-tier",
      "  echo \"Running npm install...\"",
      "  npm install --production",
      "",
      "  echo \"Reloading app with pm2...\"",
      "  # Reload the app if it is running, otherwise start it.",
      "  pm2 reload app-tier || pm2 start index.js --name app-tier",
      "  # Save the process list to resurrect on reboot",
      "  pm2 save",
      "'",

      "# Configure pm2 to run on system startup",
      "echo \"Configuring pm2 startup script...\"",
      "# Get the directory containing the node and pm2 executables",
      "NVM_BIN_PATH=$(sudo -u ubuntu bash -c 'export NVM_DIR=\"$HOME/.nvm\"; [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\"; echo \"$(dirname $(which pm2))\"')",
      "# Then, run the startup command as root with the correct bin path added to the PATH",
      "sudo env PATH=$PATH:$NVM_BIN_PATH pm2 startup systemd -u ubuntu --hp /home/ubuntu",
    ]
  }
}
