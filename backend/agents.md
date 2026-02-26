# Recipick Project - AI Agent Context

## 1. Project Overview
Recipick은 유튜브 요리 영상을 분석하여 정형화된 레시피 데이터(재료, 조리 순서, 칼로리, 예상 비용 등)를 추출하고 제공하는 서비스입니다. AWS Serverless 아키텍처를 기반으로 비동기 데이터 처리(ETL) 파이프라인을 운영합니다.

## 2. Tech Stack & Environment
- **Language**: Python 3.9+
- **Framework**: FastAPI (Main API)
- **Package Manager**: Poetry (`pyproject.toml`)
- **Infrastructure (IaC)**: Terraform (AWS Provider >= 6.0)
- **Cloud Provider (AWS)**: 
  - API Gateway (HTTP API) -> 메인 API 연결
  - Lambda (Docker Image 방식 배포) -> Main API, LLM Worker 분리
  - SQS -> 비동기 작업 큐
  - DynamoDB -> 메인 데이터베이스 (단일 테이블 설계)
  - S3 -> 원본 영상 또는 정적 파일 백업
- **AI/LLM**: Google GenAI SDK (`gemini-3-flash-preview`)

## 3. Architecture & Core Workflow
API Gateway의 29초 타임아웃 제한과 LLM의 긴 추론 시간(1~2분)을 해결하기 위해 **비동기 큐(SQS) 패턴**을 사용합니다.

1. **Client Request**: 클라이언트가 `POST /api/recipes` 호출 (유튜브 video_id 전달)
2. **Main API (Lambda)**: 
   - DynamoDB 조회 후 이미 데이터가 있으면 즉시 반환 (캐싱/중복 방지).
   - 없으면 SQS에 메시지를 전송하고 DB에 `status: "PROCESSING"`으로 임시 저장 후 HTTP 200 반환.
3. **LLM Worker (Lambda)**:
   - SQS 트리거를 통해 백그라운드에서 실행 (Timeout: 15분).
   - Gemini API를 호출하여 유튜브 URL(`file_uri`)을 전달하고 영상/자막 멀티모달 분석 수행.
   - 분석된 JSON 데이터를 파싱하여 DynamoDB에 `status: "COMPLETED"`와 함께 저장.
   - 분석 실패 또는 에러 발생 시 반드시 DB `status`를 `"FAILED"`로 업데이트하여 프론트엔드의 무한 로딩 방지.
4. **Client Polling**: 클라이언트는 `GET /api/recipes/{video_id}`를 주기적으로 호출하여 상태 확인.

## 4. DynamoDB Schema Design
이 프로젝트는 유연성과 확장성을 위해 Single Table Design을 사용합니다.
- **Table Name**: `Recipick-Recipes`
- **Partition Key (PK)**: `VIDEO#{video_id}` (Type: String)
- **Sort Key (SK)**: `INFO` (Type: String, 현재 기본 정보는 INFO로 고정)
- **Global Secondary Indexes (GSI)**:
  - `CategoryIndex`: PK=`category`, SK=`created_at` (카테고리별 최신순 정렬 탐색용)
  - `UserActivityIndex`: PK=`user_id`, SK=`created_at` (유저별 활동 내역 탐색용)
- **Key Attributes**:
  - `status`: "PROCESSING" | "COMPLETED" | "FAILED"
  - `total_calorie`, `total_estimated_price`: 숫자형(Number). API 입력/출력 시 자료형 변환에 주의.
  - `ingredients`, `steps`: 리스트 안의 딕셔너리 구조.

## 5. Coding Guidelines & AI Agent Rules
AI 에이전트는 코드를 작성하거나 수정할 때 다음 규칙을 엄격히 준수해야 합니다.

1. **No Direct YouTube Downloads (IP Binding 403 Error Avoidance)**: 
   - `googlevideo.com` 스트리밍 링크를 서버에서 직접 다운로드하지 마세요 (403 Forbidden 및 IP 바인딩 이슈 발생).
   - Gemini API 호출 시 `types.Part.from_uri(file_uri="youtube_url", mime_type='video/mp4')` 방식을 사용하여 구글 내부망을 통해 영상을 분석하도록 구성하세요.
2. **Strict Error Handling & State Management**: 
   - LLM Worker 람다에서 예외(Exception)가 발생할 경우, 반드시 `except` 블록에서 DynamoDB의 `status`를 `FAILED`로 변경하는 `update_status` 함수를 호출해야 합니다.
3. **Response Validation**:
   - LLM이 반환하는 값은 때때로 순수 JSON 딕셔너리가 아닌 리스트 `[{...}]` 형태이거나 Markdown 코드 블록(```json)을 포함할 수 있습니다. `json.loads()` 전후로 방어적 파싱 로직을 반드시 포함하세요.
4. **Boto3 Resource Usage**:
   - DynamoDB 작업 시 `boto3.client`보다 객체 지향적인 `boto3.resource('dynamodb').Table()` 사용을 지향하세요.
5. **Clear Separation of Concerns**:
   - 라우터(`routers/`), 비즈니스 로직(`services/`), 데이터 접근(`repositories/`), 데이터 검증(`schemas/`) 계층을 엄격히 분리하여 코드를 작성하세요.