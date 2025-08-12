#!/bin/bash

AWS_REGION="eu-west-1"  # Cambia con la tua region
AWS_ACCOUNT_ID="507881105499"  # Il tuo AWS Account ID
IMAGE_NAME="rag-langchain-app-fe"
ECR_REPOSITORY="rag-app"  # Usa il repository esistente
SERVICE_TAG="rag-langchain-app-latest-fe"  # Tag specifico per questo servizio

# 1. Build image Docker
echo -e "📦 Building Docker image..."
docker build -f ./docker/Dockerfile --progress=plain -t $IMAGE_NAME .

# 2. Login ad ECR
echo -e "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo -e "📂 Using existing ECR repository: $ECR_REPOSITORY"

# 4. Tag image for ECR
echo -e "🏷️ Tagging image with service-specific tag..."
docker tag $IMAGE_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$SERVICE_TAG

echo -e "⬆️ Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$SERVICE_TAG
