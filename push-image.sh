#!/bin/bash

AWS_REGION="${AWS_REGION:-eu-west-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-507881105499}"
IMAGE_NAME="${IMAGE_NAME:-rag-langchain-app-fe}"
ECR_REPOSITORY="${ECR_REPOSITORY:-rag-app}"
SERVICE_TAG="${SERVICE_TAG:-rag-langchain-app-latest-fe}"
ECS_CLUSTER="${ECS_CLUSTER:-my-rag-app-cluster}"
ECS_SERVICE="${ECS_SERVICE:-nginx-load-balancer}"
# 1. Build image Docker (--platform linux/amd64 for Fargate)
echo -e "📦 Building Docker image..."
docker build -f ./docker/Dockerfile --no-cache --platform linux/amd64 --progress=plain -t $IMAGE_NAME .

# 2. Login ad ECR
echo -e "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# --- Delete ONLY the image with the given tag in ECR (if present) ---
echo -e "🧹 Deleting existing ECR image with tag: $SERVICE_TAG (if any)..."
aws ecr batch-delete-image \
  --repository-name "$ECR_REPOSITORY" \
  --image-ids imageTag="$SERVICE_TAG" \
  --region "$AWS_REGION" >/dev/null 2>&1 || true

echo -e "📂 Using existing ECR repository: $ECR_REPOSITORY"

# 4. Tag image for ECR
echo -e "🏷️ Tagging image with service-specific tag..."
docker tag $IMAGE_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$SERVICE_TAG

echo -e "⬆️ Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$SERVICE_TAG

echo -e "⬆️ Deploying..."
aws ecs update-service \
            --cluster "${ECS_CLUSTER}" \
            --service "${ECS_SERVICE}" \
            --force-new-deployment