# GitHub Workflow Plan: App-Tier Deployment

This document outlines the plan for a GitHub workflow that automates the deployment of the `app-tier` application.

## Workflow Overview

- **Name:** `Deploy App Tier`
- **Trigger:** On push to the `main` branch.
- **Runner:** `self-hosted` (EC2 instance).

## Jobs

### `build-and-deploy`

This job will perform the following steps:

1.  **Checkout Code:**
    - Uses the `actions/checkout@v3` action to get the latest code from the repository.

2.  **Configure AWS Credentials:**
    - Uses the `aws-actions/configure-aws-credentials@v2` action.
    - Requires the following secrets to be configured in the GitHub repository:
        - `AWS_ACCESS_KEY_ID`
        - `AWS_SECRET_ACCESS_KEY`
        - `AWS_REGION`

3.  **Build AMI:**
    - This step will use either Packer or the AWS CLI to create a new Amazon Machine Image (AMI).
    - **TODO:** The specific implementation for this step needs to be determined. This could involve:
        - A Packer template file in the repository.
        - A script that uses the AWS CLI to create an AMI from a running instance.

4.  **Update Launch Template:**
    - This step will use the AWS CLI to create a new version of the launch template.
    - The new launch template version will use the ID of the AMI created in the previous step.
    - **TODO:** The ID of the launch template to be updated needs to be provided as a variable or secret.

5.  **Start Instance Refresh:**
    - This step will use the AWS CLI to start an instance refresh on the Auto Scaling group.
    - This will cause the Auto Scaling group to terminate old instances and launch new ones using the updated launch template.
    - **TODO:** The name of the Auto Scaling group to be refreshed needs to be provided as a variable or secret.

## Workflow Implementation (YAML)

```yaml
name: Deploy App Tier

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: self-hosted
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Build AMI
        run: |
          # TODO: Implement AMI creation logic here.
          # This could involve running a Packer build or using the AWS CLI.
          echo "AMI_ID=ami-1234567890" >> $GITHUB_ENV

      - name: Update Launch Template
        run: |
          # TODO: Replace with your launch template ID.
          LAUNCH_TEMPLATE_ID="lt-0123456789abcdef0"
          aws ec2 create-launch-template-version \
            --launch-template-id $LAUNCH_TEMPLATE_ID \
            --version-description "New version with AMI ${{ env.AMI_ID }}" \
            --source-version \$Latest \
            --launch-template-data "{ \"ImageId\": \"${{ env.AMI_ID }}\" }"

      - name: Start Instance Refresh
        run: |
          # TODO: Replace with your Auto Scaling group name.
          AUTO_SCALING_GROUP_NAME="my-asg"
          aws autoscaling start-instance-refresh \
            --auto-scaling-group-name $AUTO_SCALING_GROUP_NAME \
            --strategy "Rolling"
```
