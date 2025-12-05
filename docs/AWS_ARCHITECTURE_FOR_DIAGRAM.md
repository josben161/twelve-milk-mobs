# AWS Architecture Specification for Diagram Generation

This document provides a detailed specification of the Milk Mobs AWS architecture in a format optimized for LLM-based diagram generation tools.

## Architecture Overview

**System Name**: Milk Mobs  
**Architecture Type**: Serverless, Event-Driven  
**Primary Use Case**: Video analysis and community segmentation using TwelveLabs AI models via AWS Bedrock

## Component Categories

### 1. User/Client Layer

**Components**:
- **Internet** (Icon: Internet/Cloud)
  - Description: Users accessing the application
  - Type: External entity
  - Connections: Connects to CloudFront and API Gateway

### 2. Frontend Layer

**Components**:
- **Consumer Web App** (Icon: Application/Client)
  - Description: Next.js application for end users
  - Type: External application (hosted on Vercel or similar)
  - Connections: Connects to API Gateway and CloudFront
  - Purpose: Video upload, feed browsing, mob exploration

- **Admin Dashboard** (Icon: Application/Client)
  - Description: Next.js application for administrators
  - Type: External application (hosted on Vercel or similar)
  - Connections: Connects to API Gateway
  - Purpose: Video monitoring, analytics, usage statistics

### 3. Content Delivery Layer

**Components**:
- **CloudFront Distribution** (Icon: CloudFront)
  - Name: VideoDistribution
  - Description: CDN for video delivery, reduces S3 costs and improves latency
  - Configuration:
    - Origin: S3 Bucket (via Origin Access Identity)
    - Viewer Protocol: HTTPS redirect
    - Caching: Optimized cache policy
    - Compression: Enabled
  - Connections:
    - Receives requests from Internet/Users
    - Serves content from S3 Bucket
  - Purpose: Video playback delivery

### 4. API Layer

**Components**:
- **API Gateway REST API** (Icon: API Gateway)
  - Name: MilkMobsApi
  - Description: RESTful API for frontend integration
  - Endpoints:
    - POST /videos/submit
    - GET /videos/user?userId={userId}
    - GET /videos/{videoId}
    - GET /videos/feed
    - GET /feed
    - GET /mobs
    - GET /mobs/{mobId}
    - GET /search/similar?videoId={videoId}
    - POST /validate
    - GET /validate/{videoId}
    - GET /execution-history?videoId={videoId}
    - GET /admin/videos
    - DELETE /admin/videos/{videoId}
    - GET /admin/stats
    - GET /admin/usage-stats
  - CORS: Enabled for all origins
  - Connections:
    - Receives requests from Consumer Web App and Admin Dashboard
    - Routes to various Lambda functions
  - Purpose: API endpoint for all frontend operations

### 5. Storage Layer

**Components**:
- **S3 Bucket** (Icon: S3)
  - Name: UploadsBucket
  - Description: Video storage with versioning
  - Configuration:
    - Encryption: S3-managed encryption
    - Public Access: Blocked
    - Versioning: Enabled
    - CORS: Enabled for presigned URL uploads
  - Connections:
    - Receives uploads from users (via presigned URLs)
    - Serves content to CloudFront (via Origin Access Identity)
    - Triggers Lambda on object creation
  - Purpose: Raw video file storage

- **DynamoDB Videos Table** (Icon: DynamoDB)
  - Name: VideosTable
  - Description: Video metadata, analysis results, validation scores
  - Configuration:
    - Partition Key: videoId (String)
    - Billing: Pay-per-request
  - Connections:
    - Read/Write from multiple Lambda functions
  - Purpose: Video metadata and analysis results storage

- **DynamoDB Mobs Table** (Icon: DynamoDB)
  - Name: MobsTable
  - Description: Cluster summaries, centroids, video counts
  - Configuration:
    - Partition Key: mobId (String)
    - Billing: Pay-per-request
  - Connections:
    - Read/Write from clustering Lambda functions
    - Read from feed and mob query Lambda functions
  - Purpose: Video cluster/mob metadata storage

- **OpenSearch Domain** (Icon: OpenSearch Service)
  - Name: milk-mobs-videos
  - Description: Vector search index for similarity queries (k-NN)
  - Configuration:
    - Version: OpenSearch 2.3
    - Instance: t3.small.search (1 data node)
    - Storage: 20 GB GP3
    - Encryption: Enabled (at rest and in transit)
    - HTTPS: Enforced
  - Index: videos (created via custom resource)
  - Connections:
    - Write from analysis-write-result Lambda
    - Read from search-similar Lambda
  - Purpose: Vector similarity search for embeddings

### 6. Compute Layer - Lambda Functions

**API Lambda Functions**:
- **create-upload** (Icon: Lambda)
  - Description: Creates presigned URL for video upload and initial metadata entry
  - Timeout: 10 seconds
  - Connections:
    - Writes to DynamoDB Videos Table
    - Generates presigned URL for S3 Bucket
  - Triggered by: API Gateway POST /videos/submit

- **list-user-videos** (Icon: Lambda)
  - Description: Lists videos by userId
  - Timeout: 10 seconds
  - Connections:
    - Reads from DynamoDB Videos Table
    - Returns CloudFront URLs
  - Triggered by: API Gateway GET /videos/user

- **get-video-detail** (Icon: Lambda)
  - Description: Retrieves detailed video information
  - Timeout: 10 seconds
  - Connections:
    - Reads from DynamoDB Videos Table
    - Generates presigned URLs for S3
  - Triggered by: API Gateway GET /videos/{videoId}

- **get-feed** (Icon: Lambda)
  - Description: Retrieves video feed for browsing
  - Timeout: 10 seconds
  - Connections:
    - Reads from DynamoDB Videos Table
    - Reads from DynamoDB Mobs Table
    - Returns CloudFront URLs
  - Triggered by: API Gateway GET /videos/feed or GET /feed

- **list-mobs** (Icon: Lambda)
  - Description: Lists all mobs
  - Timeout: 10 seconds
  - Connections:
    - Reads from DynamoDB Mobs Table
  - Triggered by: API Gateway GET /mobs

- **get-mob** (Icon: Lambda)
  - Description: Retrieves mob details and associated videos
  - Timeout: 10 seconds
  - Connections:
    - Reads from DynamoDB Mobs Table
    - Reads from DynamoDB Videos Table
  - Triggered by: API Gateway GET /mobs/{mobId}

- **search-similar** (Icon: Lambda)
  - Description: Finds similar videos using vector search
  - Timeout: 30 seconds
  - Memory: 512 MB
  - Connections:
    - Reads from OpenSearch Domain
    - Reads from DynamoDB Videos Table
  - Triggered by: API Gateway GET /search/similar

- **get-execution-history** (Icon: Lambda)
  - Description: Retrieves Step Functions execution history for a video
  - Timeout: 30 seconds
  - Connections:
    - Reads from Step Functions state machine
  - Triggered by: API Gateway GET /execution-history

**Admin Lambda Functions**:
- **admin-list-videos** (Icon: Lambda)
  - Description: Lists all videos for admin dashboard
  - Timeout: 10 seconds
  - Connections:
    - Reads from DynamoDB Videos Table
  - Triggered by: API Gateway GET /admin/videos

- **admin-delete-video** (Icon: Lambda)
  - Description: Deletes video and associated files
  - Timeout: 30 seconds
  - Connections:
    - Deletes from DynamoDB Videos Table
    - Deletes from S3 Bucket
  - Triggered by: API Gateway DELETE /admin/videos/{videoId}

- **admin-get-stats** (Icon: Lambda)
  - Description: Retrieves system statistics
  - Timeout: 30 seconds
  - Connections:
    - Reads from DynamoDB Videos Table
    - Reads from DynamoDB Mobs Table
  - Triggered by: API Gateway GET /admin/stats

- **admin-get-usage-stats** (Icon: Lambda)
  - Description: Retrieves AWS service usage statistics including Bedrock metrics
  - Timeout: 30 seconds
  - Connections:
    - Reads from CloudWatch Metrics
  - Triggered by: API Gateway GET /admin/usage-stats

**Processing Lambda Functions**:
- **start-analysis** (Icon: Lambda)
  - Description: Triggered by S3 upload event, starts Step Functions state machine
  - Timeout: 30 seconds
  - Connections:
    - Reads from S3 Bucket (event trigger)
    - Reads from DynamoDB Videos Table
    - Starts Step Functions state machine
    - Invokes generate-thumbnail Lambda
  - Triggered by: S3 Object Created event (vid_*.mp4)

- **generate-thumbnail** (Icon: Lambda)
  - Description: Generates video thumbnail using FFmpeg
  - Timeout: 5 minutes
  - Memory: 1024 MB
  - Layers: FFmpeg layer
  - Connections:
    - Reads from S3 Bucket
    - Writes thumbnail to S3 Bucket
    - Updates DynamoDB Videos Table
  - Triggered by: start-analysis Lambda (invocation)

**Analysis Pipeline Lambda Functions** (used in Step Functions):
- **analysis-mark-processing** (Icon: Lambda)
  - Description: Marks video as processing in DynamoDB
  - Timeout: 30 seconds
  - Connections:
    - Updates DynamoDB Videos Table
  - Used in: Step Functions state machine (first step)

- **analysis-pegasus** (Icon: Lambda)
  - Description: Invokes TwelveLabs Pegasus model via Bedrock for participation analysis and OCR
  - Timeout: 5 minutes
  - Permissions: Bedrock InvokeModel, CloudWatch PutMetricData
  - Connections:
    - Invokes Bedrock (Pegasus model)
    - Emits metrics to CloudWatch
  - Used in: Step Functions state machine (parallel branch)

- **analysis-marengo** (Icon: Lambda)
  - Description: Invokes TwelveLabs Marengo model via Bedrock for embedding generation
  - Timeout: 5 minutes
  - Permissions: Bedrock InvokeModel, CloudWatch PutMetricData
  - Connections:
    - Invokes Bedrock (Marengo model)
    - Emits metrics to CloudWatch
  - Used in: Step Functions state machine (parallel branch)

- **analysis-write-result** (Icon: Lambda)
  - Description: Writes analysis results to DynamoDB and OpenSearch
  - Timeout: 30 seconds
  - Connections:
    - Writes to DynamoDB Videos Table
    - Writes to OpenSearch Domain
  - Used in: Step Functions state machine (after parallel analysis)

- **validate-video** (Icon: Lambda)
  - Description: Validates video using multimodal scoring (visual, audio, OCR, hashtags)
  - Timeout: 30 seconds
  - Connections:
    - Reads from DynamoDB Videos Table
    - Updates DynamoDB Videos Table with validation results
  - Used in: Step Functions state machine (after write-result)

- **cluster-video** (Icon: Lambda)
  - Description: Clusters video into mobs using K-means clustering
  - Timeout: 30 seconds
  - Connections:
    - Reads from DynamoDB Videos Table
    - Updates DynamoDB Videos Table (mobId assignment)
    - Updates DynamoDB Mobs Table (centroid updates)
  - Used in: Step Functions state machine (after validation)

**Batch Processing Lambda Functions**:
- **cluster-embeddings** (Icon: Lambda)
  - Description: Batch K-means clustering of all videos (runs on schedule)
  - Timeout: 5 minutes
  - Memory: 512 MB
  - Connections:
    - Reads from DynamoDB Videos Table
    - Updates DynamoDB Videos Table
    - Updates DynamoDB Mobs Table
  - Triggered by: EventBridge schedule (hourly)

- **create-opensearch-index** (Icon: Lambda)
  - Description: Custom resource Lambda that creates OpenSearch index on stack deployment
  - Timeout: 2 minutes
  - Connections:
    - Writes to OpenSearch Domain
  - Triggered by: CloudFormation custom resource

### 7. Orchestration Layer

**Components**:
- **Step Functions State Machine** (Icon: Step Functions)
  - Name: VideoAnalysisStateMachine
  - Description: Orchestrates video analysis pipeline
  - Timeout: 10 minutes
  - State Machine Definition:
    1. Mark Processing (Lambda: analysis-mark-processing)
    2. Parallel Analysis:
       - Branch 1: Pegasus Analysis (Lambda: analysis-pegasus)
       - Branch 2: Marengo Embedding (Lambda: analysis-marengo)
    3. Merge Results (Pass state)
    4. Write Results (Lambda: analysis-write-result)
    5. Validate Video (Lambda: validate-video)
    6. Cluster Video (Lambda: cluster-video)
    7. Emit Event (EventBridge)
  - Connections:
    - Started by: start-analysis Lambda
    - Invokes: Multiple analysis Lambda functions
    - Publishes to: EventBridge
  - Purpose: Coordinates video analysis workflow

### 8. AI/ML Layer

**Components**:
- **AWS Bedrock** (Icon: Bedrock)
  - Description: Foundation model service for TwelveLabs models
  - Models:
    - **TwelveLabs Pegasus Model**
      - Purpose: Participation analysis, OCR/text detection
      - Invoked by: analysis-pegasus Lambda
      - Output: Participation scores, OCR results, timeline highlights
    - **TwelveLabs Marengo Model**
      - Purpose: Semantic embedding generation
      - Invoked by: analysis-marengo Lambda
      - Output: 256-dimensional embedding vectors
  - Connections:
    - Receives invocations from analysis-pegasus Lambda
    - Receives invocations from analysis-marengo Lambda
  - Purpose: AI-powered video analysis

### 9. Event & Messaging Layer

**Components**:
- **EventBridge Custom Bus** (Icon: EventBridge)
  - Name: milk-mobs-bus
  - Description: Custom event bus for video analysis events
  - Events:
    - VideoAnalyzed (source: milk-mobs.analysis)
      - Contains: videoId, status, participationScore, validationScore, mobId
  - Connections:
    - Receives events from Step Functions state machine
  - Purpose: Event-driven notifications for downstream processing

- **EventBridge Rule** (Icon: EventBridge)
  - Name: ClusteringSchedule
  - Description: Scheduled rule for batch clustering
  - Schedule: Hourly (rate: 1 hour)
  - Target: cluster-embeddings Lambda
  - Purpose: Periodic batch clustering of all videos

### 10. Monitoring & Observability Layer

**Components**:
- **CloudWatch Dashboard** (Icon: CloudWatch)
  - Name: MilkMobsSystemHealth
  - Description: System health and performance monitoring
  - Widgets:
    - Analysis Lambda Invocations
    - Analysis Lambda Errors
    - Lambda Duration
    - Step Functions Executions
    - Step Functions Execution Time
    - DynamoDB Read/Write Capacity
    - S3 Bucket Size
    - API Gateway Requests
    - Bedrock Usage (TwelveLabs)
    - Bedrock Token Usage
  - Purpose: Centralized observability dashboard

- **CloudWatch Metrics** (Icon: CloudWatch)
  - Namespace: MilkMobs/Bedrock
  - Metrics:
    - BedrockInvocations (dimensions: ModelId, ModelType)
    - BedrockInputTokens (dimensions: ModelId, ModelType)
    - BedrockOutputTokens (dimensions: ModelId, ModelType)
  - Emitted by: analysis-pegasus and analysis-marengo Lambdas
  - Purpose: Track Bedrock usage and costs

- **CloudWatch Alarms** (Icon: CloudWatch)
  - StepFunctionsHighFailureRate: Alarms when failure rate > 5%
  - LambdaHighErrorRate: Alarms when error rate > 10%
  - AnalysisPegasusErrors: Alarms on Pegasus Lambda errors
  - AnalysisMarengoErrors: Alarms on Marengo Lambda errors
  - Purpose: Alert on critical failures

- **CloudWatch Logs** (Icon: CloudWatch)
  - Description: Log groups for all Lambda functions
  - Purpose: Debugging and troubleshooting

### 11. Security & Access Layer

**Components**:
- **IAM Roles** (Icon: IAM)
  - Description: Least-privilege IAM roles for all Lambda functions
  - Permissions:
    - S3 read/write for specific buckets
    - DynamoDB read/write for specific tables
    - Bedrock InvokeModel for specific models
    - CloudWatch PutMetricData (with namespace condition)
    - Step Functions StartExecution
    - OpenSearch index read/write
  - Purpose: Secure access control

- **Origin Access Identity** (Icon: IAM/CloudFront)
  - Description: OAI for CloudFront to access S3 bucket
  - Connections:
    - Used by CloudFront Distribution
    - Grants read access to S3 Bucket
  - Purpose: Secure S3 access via CloudFront

## Data Flow Specifications

### Flow 1: Video Upload Flow

**Path**:
1. User → Consumer Web App
2. Consumer Web App → API Gateway (POST /videos/submit)
3. API Gateway → create-upload Lambda
4. create-upload Lambda → DynamoDB Videos Table (create metadata entry)
5. create-upload Lambda → S3 Bucket (generate presigned URL)
6. create-upload Lambda → API Gateway → Consumer Web App (return presigned URL)
7. User → S3 Bucket (direct upload using presigned URL)
8. S3 Bucket → S3 Event → start-analysis Lambda
9. start-analysis Lambda → Step Functions State Machine (start execution)
10. start-analysis Lambda → generate-thumbnail Lambda (async invocation)

**Data Transferred**:
- Video metadata (JSON)
- Presigned URL (string)
- Video file (binary)

### Flow 2: Video Analysis Pipeline Flow

**Path** (Step Functions orchestration):
1. Step Functions → analysis-mark-processing Lambda
   - Updates DynamoDB Videos Table (status = processing)
2. Step Functions → Parallel Branch:
   - Branch A: analysis-pegasus Lambda
     - Invokes Bedrock (Pegasus model)
     - Bedrock returns participation analysis + OCR
     - Emits CloudWatch metrics
   - Branch B: analysis-marengo Lambda
     - Invokes Bedrock (Marengo model)
     - Bedrock returns embedding vector
     - Emits CloudWatch metrics
3. Step Functions → Merge Results (Pass state)
4. Step Functions → analysis-write-result Lambda
   - Writes to DynamoDB Videos Table (analysis results)
   - Writes to OpenSearch Domain (embedding vector)
5. Step Functions → validate-video Lambda
   - Reads from DynamoDB Videos Table
   - Calculates multimodal validation score
   - Updates DynamoDB Videos Table (validation results)
6. Step Functions → cluster-video Lambda
   - Reads from DynamoDB Videos Table (all videos with embeddings)
   - Runs K-means clustering
   - Updates DynamoDB Videos Table (mobId assignment)
   - Updates DynamoDB Mobs Table (centroid updates)
7. Step Functions → EventBridge (emit VideoAnalyzed event)

**Data Transferred**:
- Video S3 URI
- Participation analysis results
- Embedding vector (256 dimensions)
- Validation scores
- Cluster assignments

### Flow 3: Video Feed/Discovery Flow

**Path**:
1. User → Consumer Web App
2. Consumer Web App → API Gateway (GET /videos/feed)
3. API Gateway → get-feed Lambda
4. get-feed Lambda → DynamoDB Videos Table (query by status)
5. get-feed Lambda → DynamoDB Mobs Table (read mob metadata)
6. get-feed Lambda → API Gateway → Consumer Web App (return feed)
7. User → CloudFront Distribution (request video playback)
8. CloudFront Distribution → S3 Bucket (fetch video if not cached)
9. CloudFront Distribution → User (serve video)

**Data Transferred**:
- Video metadata list (JSON)
- Video files (via CloudFront)

### Flow 4: Similar Video Search Flow

**Path**:
1. User → Consumer Web App
2. Consumer Web App → API Gateway (GET /search/similar?videoId={id})
3. API Gateway → search-similar Lambda
4. search-similar Lambda → DynamoDB Videos Table (get source video embedding)
5. search-similar Lambda → OpenSearch Domain (k-NN vector search)
6. search-similar Lambda → DynamoDB Videos Table (get similar video metadata)
7. search-similar Lambda → API Gateway → Consumer Web App (return similar videos)

**Data Transferred**:
- Video ID
- Embedding vector
- Similar video IDs and metadata

### Flow 5: Admin Statistics Flow

**Path**:
1. Admin → Admin Dashboard
2. Admin Dashboard → API Gateway (GET /admin/usage-stats)
3. API Gateway → admin-get-usage-stats Lambda
4. admin-get-usage-stats Lambda → CloudWatch Metrics (query Bedrock metrics)
5. admin-get-usage-stats Lambda → API Gateway → Admin Dashboard (return stats)

**Data Transferred**:
- CloudWatch metric queries
- Usage statistics (JSON)

### Flow 6: Batch Clustering Flow

**Path**:
1. EventBridge Rule (hourly schedule) → cluster-embeddings Lambda
2. cluster-embeddings Lambda → DynamoDB Videos Table (scan all videos with embeddings)
3. cluster-embeddings Lambda → (runs K-means clustering in memory)
4. cluster-embeddings Lambda → DynamoDB Videos Table (update mobId for all videos)
5. cluster-embeddings Lambda → DynamoDB Mobs Table (update mob centroids)

**Data Transferred**:
- Video embeddings
- Cluster assignments
- Mob centroids

## Component Groupings for Visual Organization

### Group 1: User Interface Layer
- Internet
- Consumer Web App
- Admin Dashboard

### Group 2: API & Gateway Layer
- API Gateway REST API
- CloudFront Distribution

### Group 3: Storage Services
- S3 Bucket
- DynamoDB Videos Table
- DynamoDB Mobs Table
- OpenSearch Domain

### Group 4: API Lambda Functions
- create-upload
- list-user-videos
- get-video-detail
- get-feed
- list-mobs
- get-mob
- search-similar
- get-execution-history

### Group 5: Admin Lambda Functions
- admin-list-videos
- admin-delete-video
- admin-get-stats
- admin-get-usage-stats

### Group 6: Processing Lambda Functions
- start-analysis
- generate-thumbnail

### Group 7: Analysis Pipeline Lambda Functions
- analysis-mark-processing
- analysis-pegasus
- analysis-marengo
- analysis-write-result
- validate-video
- cluster-video

### Group 8: Batch Processing Lambda Functions
- cluster-embeddings
- create-opensearch-index

### Group 9: Orchestration
- Step Functions State Machine

### Group 10: AI/ML Services
- AWS Bedrock
  - TwelveLabs Pegasus Model
  - TwelveLabs Marengo Model

### Group 11: Event & Messaging
- EventBridge Custom Bus
- EventBridge Rule (ClusteringSchedule)

### Group 12: Monitoring
- CloudWatch Dashboard
- CloudWatch Metrics
- CloudWatch Alarms
- CloudWatch Logs

### Group 13: Security
- IAM Roles
- Origin Access Identity

## Connection Specifications

### Direct Connections (with labels)

1. **Internet → CloudFront Distribution**
   - Label: "Video Playback Requests"
   - Direction: Bidirectional

2. **Internet → API Gateway**
   - Label: "API Requests"
   - Direction: Bidirectional

3. **Consumer Web App → API Gateway**
   - Label: "REST API Calls"
   - Direction: Bidirectional

4. **Admin Dashboard → API Gateway**
   - Label: "Admin API Calls"
   - Direction: Bidirectional

5. **CloudFront Distribution → S3 Bucket**
   - Label: "Video Content (via OAI)"
   - Direction: CloudFront → S3 (read)

6. **API Gateway → create-upload Lambda**
   - Label: "POST /videos/submit"
   - Direction: API Gateway → Lambda

7. **API Gateway → list-user-videos Lambda**
   - Label: "GET /videos/user"
   - Direction: API Gateway → Lambda

8. **API Gateway → get-video-detail Lambda**
   - Label: "GET /videos/{videoId}"
   - Direction: API Gateway → Lambda

9. **API Gateway → get-feed Lambda**
   - Label: "GET /videos/feed"
   - Direction: API Gateway → Lambda

10. **API Gateway → list-mobs Lambda**
    - Label: "GET /mobs"
    - Direction: API Gateway → Lambda

11. **API Gateway → get-mob Lambda**
    - Label: "GET /mobs/{mobId}"
    - Direction: API Gateway → Lambda

12. **API Gateway → search-similar Lambda**
    - Label: "GET /search/similar"
    - Direction: API Gateway → Lambda

13. **API Gateway → get-execution-history Lambda**
    - Label: "GET /execution-history"
    - Direction: API Gateway → Lambda

14. **API Gateway → admin-list-videos Lambda**
    - Label: "GET /admin/videos"
    - Direction: API Gateway → Lambda

15. **API Gateway → admin-delete-video Lambda**
    - Label: "DELETE /admin/videos/{videoId}"
    - Direction: API Gateway → Lambda

16. **API Gateway → admin-get-stats Lambda**
    - Label: "GET /admin/stats"
    - Direction: API Gateway → Lambda

17. **API Gateway → admin-get-usage-stats Lambda**
    - Label: "GET /admin/usage-stats"
    - Direction: API Gateway → Lambda

18. **S3 Bucket → start-analysis Lambda**
    - Label: "Object Created Event (vid_*.mp4)"
    - Direction: S3 → Lambda (event trigger)

19. **start-analysis Lambda → Step Functions State Machine**
    - Label: "Start Execution"
    - Direction: Lambda → Step Functions

20. **start-analysis Lambda → generate-thumbnail Lambda**
    - Label: "Async Invocation"
    - Direction: Lambda → Lambda

21. **Step Functions State Machine → analysis-mark-processing Lambda**
    - Label: "Mark Processing Task"
    - Direction: Step Functions → Lambda

22. **Step Functions State Machine → analysis-pegasus Lambda**
    - Label: "Pegasus Analysis Task (Parallel Branch A)"
    - Direction: Step Functions → Lambda

23. **Step Functions State Machine → analysis-marengo Lambda**
    - Label: "Marengo Embedding Task (Parallel Branch B)"
    - Direction: Step Functions → Lambda

24. **Step Functions State Machine → analysis-write-result Lambda**
    - Label: "Write Result Task"
    - Direction: Step Functions → Lambda

25. **Step Functions State Machine → validate-video Lambda**
    - Label: "Validate Task"
    - Direction: Step Functions → Lambda

26. **Step Functions State Machine → cluster-video Lambda**
    - Label: "Cluster Task"
    - Direction: Step Functions → Lambda

27. **Step Functions State Machine → EventBridge Custom Bus**
    - Label: "Emit VideoAnalyzed Event"
    - Direction: Step Functions → EventBridge

28. **EventBridge Rule → cluster-embeddings Lambda**
    - Label: "Hourly Schedule"
    - Direction: EventBridge → Lambda

29. **analysis-pegasus Lambda → AWS Bedrock**
    - Label: "Invoke Pegasus Model"
    - Direction: Lambda → Bedrock

30. **analysis-marengo Lambda → AWS Bedrock**
    - Label: "Invoke Marengo Model"
    - Direction: Lambda → Bedrock

31. **analysis-pegasus Lambda → CloudWatch Metrics**
    - Label: "Emit Bedrock Metrics"
    - Direction: Lambda → CloudWatch

32. **analysis-marengo Lambda → CloudWatch Metrics**
    - Label: "Emit Bedrock Metrics"
    - Direction: Lambda → CloudWatch

33. **admin-get-usage-stats Lambda → CloudWatch Metrics**
    - Label: "Query Bedrock Metrics"
    - Direction: Lambda → CloudWatch (read)

34. **create-upload Lambda → DynamoDB Videos Table**
    - Label: "Create Video Metadata"
    - Direction: Lambda → DynamoDB (write)

35. **create-upload Lambda → S3 Bucket**
    - Label: "Generate Presigned URL"
    - Direction: Lambda → S3 (generate URL)

36. **list-user-videos Lambda → DynamoDB Videos Table**
    - Label: "Query by userId"
    - Direction: Lambda → DynamoDB (read)

37. **get-video-detail Lambda → DynamoDB Videos Table**
    - Label: "Get Video Details"
    - Direction: Lambda → DynamoDB (read)

38. **get-feed Lambda → DynamoDB Videos Table**
    - Label: "Query Validated Videos"
    - Direction: Lambda → DynamoDB (read)

39. **get-feed Lambda → DynamoDB Mobs Table**
    - Label: "Get Mob Metadata"
    - Direction: Lambda → DynamoDB (read)

40. **list-mobs Lambda → DynamoDB Mobs Table**
    - Label: "Scan All Mobs"
    - Direction: Lambda → DynamoDB (read)

41. **get-mob Lambda → DynamoDB Mobs Table**
    - Label: "Get Mob Details"
    - Direction: Lambda → DynamoDB (read)

42. **get-mob Lambda → DynamoDB Videos Table**
    - Label: "Get Mob Videos"
    - Direction: Lambda → DynamoDB (read)

43. **search-similar Lambda → OpenSearch Domain**
    - Label: "k-NN Vector Search"
    - Direction: Lambda → OpenSearch (read)

44. **search-similar Lambda → DynamoDB Videos Table**
    - Label: "Get Similar Video Metadata"
    - Direction: Lambda → DynamoDB (read)

45. **admin-list-videos Lambda → DynamoDB Videos Table**
    - Label: "Scan All Videos"
    - Direction: Lambda → DynamoDB (read)

46. **admin-delete-video Lambda → DynamoDB Videos Table**
    - Label: "Delete Video Metadata"
    - Direction: Lambda → DynamoDB (write)

47. **admin-delete-video Lambda → S3 Bucket**
    - Label: "Delete Video File"
    - Direction: Lambda → S3 (delete)

48. **admin-get-stats Lambda → DynamoDB Videos Table**
    - Label: "Query Statistics"
    - Direction: Lambda → DynamoDB (read)

49. **admin-get-stats Lambda → DynamoDB Mobs Table**
    - Label: "Query Mob Statistics"
    - Direction: Lambda → DynamoDB (read)

50. **start-analysis Lambda → DynamoDB Videos Table**
    - Label: "Read Video Metadata"
    - Direction: Lambda → DynamoDB (read)

51. **generate-thumbnail Lambda → S3 Bucket**
    - Label: "Read Video, Write Thumbnail"
    - Direction: Lambda → S3 (read/write)

52. **generate-thumbnail Lambda → DynamoDB Videos Table**
    - Label: "Update Thumbnail URL"
    - Direction: Lambda → DynamoDB (write)

53. **analysis-mark-processing Lambda → DynamoDB Videos Table**
    - Label: "Update Status to Processing"
    - Direction: Lambda → DynamoDB (write)

54. **analysis-write-result Lambda → DynamoDB Videos Table**
    - Label: "Write Analysis Results"
    - Direction: Lambda → DynamoDB (write)

55. **analysis-write-result Lambda → OpenSearch Domain**
    - Label: "Index Embedding Vector"
    - Direction: Lambda → OpenSearch (write)

56. **validate-video Lambda → DynamoDB Videos Table**
    - Label: "Read/Write Validation Results"
    - Direction: Lambda ↔ DynamoDB (read/write)

57. **cluster-video Lambda → DynamoDB Videos Table**
    - Label: "Read All Videos, Update mobId"
    - Direction: Lambda ↔ DynamoDB (read/write)

58. **cluster-video Lambda → DynamoDB Mobs Table**
    - Label: "Update Mob Centroids"
    - Direction: Lambda → DynamoDB (write)

59. **cluster-embeddings Lambda → DynamoDB Videos Table**
    - Label: "Scan All Videos, Update mobId"
    - Direction: Lambda ↔ DynamoDB (read/write)

60. **cluster-embeddings Lambda → DynamoDB Mobs Table**
    - Label: "Update All Mob Centroids"
    - Direction: Lambda → DynamoDB (write)

61. **create-opensearch-index Lambda → OpenSearch Domain**
    - Label: "Create Index (Custom Resource)"
    - Direction: Lambda → OpenSearch (write)

## Special Relationships

### Parallel Execution
- **Step Functions Parallel State**: 
  - Branch A: analysis-pegasus Lambda
  - Branch B: analysis-marengo Lambda
  - Both branches execute simultaneously
  - Results merged before proceeding to next step

### Event-Driven Triggers
- **S3 Event → Lambda**: Automatic trigger on video upload
- **EventBridge Schedule → Lambda**: Hourly batch clustering
- **Step Functions → EventBridge**: Video analysis completion events

### Custom Resources
- **CloudFormation → create-opensearch-index Lambda**: Creates OpenSearch index on stack deployment

## Diagram Generation Instructions for LLM

When generating the architecture diagram, please:

1. **Use AWS Architecture Icons**: Use official AWS service icons where available
2. **Group Related Components**: Organize components into logical groups (layers)
3. **Show Data Flow**: Use arrows to indicate direction of data flow
4. **Label Connections**: Add labels to connections showing the type of interaction
5. **Color Code**: Use consistent colors for similar component types
6. **Show Parallel Execution**: Clearly indicate parallel branches in Step Functions
7. **Include Event Triggers**: Show event-driven connections (S3 events, EventBridge)
8. **Show Security Boundaries**: Indicate IAM roles and access controls
9. **Layer Organization**: Organize from top (users) to bottom (storage/AI services)
10. **Include Monitoring**: Show CloudWatch connections for observability

## Key Architectural Patterns

1. **Serverless Architecture**: All compute is Lambda-based
2. **Event-Driven**: S3 events and EventBridge triggers
3. **Parallel Processing**: Step Functions orchestrates parallel AI analysis
4. **Vector Search**: OpenSearch for semantic similarity
5. **CDN Caching**: CloudFront for video delivery optimization
6. **Pay-per-Request**: DynamoDB and Lambda scale automatically
7. **Custom Metrics**: CloudWatch for Bedrock usage tracking
8. **K-means Clustering**: On-demand and batch clustering for video segmentation

## Notes for Diagram Generation

- The architecture is fully serverless (no EC2 instances)
- All Lambda functions use Node.js 20.x runtime
- Step Functions orchestrates the analysis pipeline
- Bedrock is the only external AI service (TwelveLabs models)
- CloudFront uses Origin Access Identity for secure S3 access
- OpenSearch is single-node for demo, can scale to cluster
- All services are in the same AWS region
- IAM roles follow least-privilege principle
- CloudWatch provides comprehensive observability

