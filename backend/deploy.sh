#!/bin/bash

# 스크립트 실행 중 단 한 줄이라도 에러가 나면(예: 도커 빌드 실패) 그 즉시 스크립트를 멈춥니다. 
set -e 

ACCOUNT_ID="559198857556"
REGION="ap-northeast-2"
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

echo "========================================"
echo "🚀 1. AWS ECR 로그인 진행 중..."
echo "========================================"
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ECR_URI}

echo "========================================"
echo "📦 2. 메인 API (api) 빌드 및 푸시..."
echo "========================================"
docker build --platform linux/amd64 --provenance=false --target api -t ${ECR_URI}/recipick:api-latest .
docker push ${ECR_URI}/recipick:api-latest

echo "========================================"
echo "📦 3. LLM 워커 (worker) 빌드 및 푸시..."
echo "========================================"
docker build --platform linux/amd64 --provenance=false --target worker -t ${ECR_URI}/recipick:worker-latest .
docker push ${ECR_URI}/recipick:worker-latest

echo "========================================"
echo "☁️  4. AWS Lambda 함수 코드 업데이트..."
echo "========================================"
aws lambda update-function-code \
    --function-name recipick-main-api \
    --image-uri ${ECR_URI}/recipick:api-latest \
    --no-cli-pager

aws lambda update-function-code \
    --function-name recipick-llm-worker \
    --image-uri ${ECR_URI}/recipick:worker-latest \
    --no-cli-pager

echo "========================================"
echo "✅ 배포가 성공적으로 완료되었습니다!"
echo "========================================"