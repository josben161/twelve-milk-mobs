# Milk Mobs Architecture

## Overview

The Milk Mobs platform is a serverless video analysis and clustering system built on AWS, leveraging TwelveLabs AI models (Pegasus and Marengo) via AWS Bedrock to enable campaign participation detection, validation, and community segmentation.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────────────┐      ┌──────────────────────┐      │
│  │  Consumer Web App     │      │   Admin Dashboard     │      │
│  │  (Next.js/Vercel)     │      │   (Next.js/Vercel)    │      │
│  │  - Upload videos      │      │   - Monitor videos   │      │
│  │  - Browse feed        │      │   - View analytics    │      │
│  │  - Explore mobs       │      │   - Usage stats       │      │
│  └──────────┬────────────┘      └──────────┬────────────┘      │
└─────────────┼────────────────────────────────┼──────────────────┘
              │                                │
              └────────────┬───────────────────┘
                           │
              ┌────────────▼────────────┐
              │   API Gateway (REST)    │
              │   - /videos/submit      │
              │   - /videos/{id}        │
              │   - /mobs               │
              │   - /admin/*            │
              └────────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌──────▼───────┐  ┌───────▼────────┐
│  S3 Bucket     │  │  DynamoDB    │  │  OpenSearch    │
│  (Video Store) │  │  (Metadata)  │  │  (Vectors)     │
└───────┬────────┘  └──────┬───────┘  └───────┬────────┘
        │                  │                  │
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
              ┌────────────▼────────────┐
              │   Step Functions        │
              │   (Analysis Pipeline)   │
              └────────────┬────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼────────┐  ┌──────▼───────┐  ┌───────▼────────┐
│  Lambda:       │  │  Lambda:     │  │  Lambda:       │
│  Pegasus       │  │  Marengo     │  │  Validation    │
│  Analysis      │  │  Embedding   │  │  & Clustering │
└───────┬────────┘  └──────┬───────┘  └───────┬────────┘
        │                  │                  │
        └──────────┬───────┴──────────┬───────┘
                   │                 │
        ┌──────────▼─────────────────▼──────────┐
        │      AWS Bedrock                      │
        │  ┌──────────────┐  ┌──────────────┐  │
        │  │  TwelveLabs  │  │  TwelveLabs  │  │
        │  │  Pegasus     │  │  Marengo     │  │
        │  │  (Analysis)  │  │  (Embedding) │  │
        │  └──────────────┘  └──────────────┘  │
        └───────────────────────────────────────┘
```

## Data Flow

### 1. Video Upload Flow

```
User → Frontend → API Gateway → Lambda (create-upload)
  → DynamoDB (video metadata)
  → S3 (presigned URL)
  → User uploads video to S3
  → S3 Event → Lambda (start-analysis)
  → Step Functions (analysis pipeline)
```

### 2. Analysis Pipeline (Step Functions)

```
1. Mark Processing
   ↓
2. Parallel Execution:
   ├─→ Pegasus Analysis (Participation Detection + OCR)
   │   └─→ Bedrock: TwelveLabs Pegasus Model
   │       - Detects milk mentions (audio)
   │       - Detects milk objects (visual)
   │       - Detects drinking actions (visual+audio)
   │       - OCR: Detects on-screen text
   │
   └─→ Marengo Embedding (Vector Generation)
       └─→ Bedrock: TwelveLabs Marengo Model
           - Generates 256-dim embedding vector
   ↓
3. Merge Results → Write to DynamoDB + OpenSearch
   ↓
4. Validation (Multimodal Scoring)
   ├─→ Visual: showsMilkObject + showsActionAligned
   ├─→ Audio: mentionsMilk (if available)
   ├─→ OCR: detectedText + onScreenText
   └─→ Hashtags: #gotmilk, #milkmob
   ↓
5. Clustering (K-means on-demand)
   ├─→ Fetch similar videos
   ├─→ Run K-means clustering
   ├─→ Assign to nearest cluster
   └─→ Update mob centroid
   ↓
6. EventBridge Event (Video Analyzed)
```

### 3. Video Discovery Flow

```
User → Frontend → API Gateway → Lambda (get-feed)
  → DynamoDB (query videos by mob)
  → OpenSearch (similarity search)
  → CloudFront (video delivery)
  → User views video with timeline highlights
```

## TwelveLabs API Integration

### Pegasus Model (Participation Analysis)

**Purpose**: Multimodal participation detection for "Got Milk" campaign

**Input**:
- Video S3 URI
- Hashtags from user post
- Campaign context (required hashtags, focus)

**Output**:
- `participationScore`: 0-1 confidence score
- `mentionsMilk`: Boolean (audio analysis)
- `showsMilkObject`: Boolean (visual analysis)
- `showsActionAligned`: Boolean (action detection)
- `detectedText`: Array of all text detected (OCR)
- `onScreenText`: Array of on-screen text (OCR)
- `highlights`: Timeline of key moments
- `rationale`: Explanation text

**Integration Point**: `services/lambdas/analysis-pegasus/index.ts`

### Marengo Model (Embedding Generation)

**Purpose**: Generate semantic embeddings for video clustering

**Input**:
- Video S3 URI

**Output**:
- `embedding`: 256-dimensional vector
- `dim`: Embedding dimension (256)

**Integration Point**: `services/lambdas/analysis-marengo/index.ts`

**Usage**:
- Stored in DynamoDB (JSON string)
- Indexed in OpenSearch (k-NN vector search)
- Used for K-means clustering
- Enables similarity search ("More like this")

## AWS Services

### Compute & Orchestration
- **Lambda**: 15+ functions for video processing, API handlers, clustering
- **Step Functions**: Orchestrates analysis pipeline (Pegasus + Marengo in parallel)
- **EventBridge**: Event-driven notifications for video analysis completion

### Storage & Database
- **S3**: Video storage with versioning, CloudFront origin
- **DynamoDB**: 
  - Videos table: Video metadata, analysis results, validation scores
  - Mobs table: Cluster summaries, centroids, video counts
- **OpenSearch**: Vector search index for similarity queries (k-NN)

### API & Delivery
- **API Gateway**: REST API for frontend integration
- **CloudFront**: CDN for video delivery (reduces S3 costs, improves latency)

### AI/ML
- **Bedrock**: TwelveLabs model invocation (Pegasus, Marengo)
- **CloudWatch**: Custom metrics for Bedrock usage tracking

### Monitoring
- **CloudWatch**: Dashboards, alarms, metrics
- **CloudWatch Logs**: Lambda execution logs

## Key Design Decisions

1. **Parallel Analysis**: Pegasus and Marengo run in parallel via Step Functions to minimize latency
2. **On-Demand K-means**: Clustering happens per-video using K-means for better quality than simple similarity
3. **Multimodal Validation**: Weighted scoring across visual, audio, OCR, and hashtags with dynamic weight adjustment for missing audio
4. **Vector Search**: OpenSearch enables fast similarity search for "More like this" features
5. **Event-Driven**: EventBridge events enable downstream processing (notifications, analytics)

## Scalability Considerations

- **DynamoDB**: Pay-per-request billing scales automatically
- **Lambda**: Auto-scales based on concurrent executions
- **S3**: Unlimited storage, CloudFront caching reduces origin requests
- **OpenSearch**: Single instance for demo, can scale to cluster for production
- **Step Functions**: Handles high concurrency with state management

## Security

- S3 bucket: Private, CloudFront OAI for access
- API Gateway: CORS configured for frontend domains
- DynamoDB: IAM roles with least-privilege access
- Bedrock: IAM policies restrict model access
- Lambda: VPC isolation not required (no sensitive data)

## Cost Optimization

- CloudFront caching reduces S3 requests
- DynamoDB pay-per-request (no provisioned capacity)
- Lambda: Right-sized memory and timeout
- OpenSearch: Single small instance for demo
- Step Functions: Efficient state transitions

