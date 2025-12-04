# Milk Mobs: Presentation Summary

## Executive Summary

Milk Mobs is a complete video analysis and community segmentation platform built for a social media campaign celebrating the "Got Milk" movement. The solution leverages **TwelveLabs AI models via AWS Bedrock** to automatically identify, validate, and segment user-generated content, enabling users to discover and join "Milk Mobs" - communities of similar creative content.

## TwelveLabs Value Proposition

### How TwelveLabs Enables the Solution

**1. Participation Detection (Pegasus Model)**
- **Multimodal Analysis**: Detects milk mentions in audio, milk objects in video, and drinking actions
- **OCR Capability**: Extracts on-screen text (e.g., milk carton labels, campaign hashtags)
- **Timeline Highlights**: Identifies key moments in videos for enhanced user experience
- **Campaign Alignment**: Validates content matches "Got Milk" campaign requirements

**2. Semantic Clustering (Marengo Model)**
- **Embedding Generation**: Creates 256-dimensional semantic vectors for each video
- **Similarity Search**: Enables "More like this" recommendations
- **K-means Clustering**: Groups videos into "Milk Mobs" by activity, location, or vibe
- **Community Discovery**: Users explore similar content and join relevant mobs

### Key Differentiators

1. **Multimodal Understanding**: TwelveLabs analyzes video, audio, and text together - not just one modality
2. **Campaign-Specific**: Models understand context (Got Milk campaign, Gen Z focus)
3. **Real-Time Processing**: Analysis completes in minutes, not hours
4. **Scalable**: Handles thousands of videos per month with serverless architecture

## Solution Architecture

### Core Workflow: Identify → Validate → Segment → Explore

```
User Uploads Video
    ↓
Hashtag Detection (#gotmilk, #milkmob)
    ↓
TwelveLabs Pegasus Analysis
    ├─→ Audio: Detects milk mentions
    ├─→ Visual: Detects milk objects & actions
    └─→ OCR: Extracts on-screen text
    ↓
Multimodal Validation (Weighted Scoring)
    ├─→ Visual: 40-50% weight
    ├─→ Audio: 30% weight (if available)
    ├─→ OCR: 20-30% weight
    └─→ Hashtags: 10-20% weight
    ↓
TwelveLabs Marengo Embedding
    └─→ 256-dim vector for similarity
    ↓
K-means Clustering
    └─→ Assigns video to "Milk Mob"
    ↓
User Explores Mob
    ├─→ Browse similar videos
    ├─→ View timeline highlights
    └─→ Join community
```

### AWS Services Integration

- **Bedrock**: TwelveLabs model invocation (Pegasus, Marengo)
- **Step Functions**: Orchestrates parallel analysis pipeline
- **Lambda**: 15+ functions for processing, validation, clustering
- **DynamoDB**: Stores video metadata, analysis results, mob clusters
- **OpenSearch**: Vector search for similarity queries
- **S3 + CloudFront**: Video storage and delivery
- **API Gateway**: REST API for frontend integration

## Key Metrics & Results

### Processing Performance
- **Analysis Time**: ~2-5 minutes per video (Pegasus + Marengo in parallel)
- **Validation Accuracy**: Multimodal scoring with 0.7 threshold
- **Clustering Quality**: K-means produces meaningful mobs (skatepark, café study, etc.)

### TwelveLabs API Usage
- **Pegasus**: 1 invocation per video (participation + OCR)
- **Marengo**: 1 invocation per video (embedding generation)
- **Total**: 2 invocations per video

### Cost Efficiency
- **Small Scale** (1K videos/month): ~$80/month total AWS costs
- **Medium Scale** (10K videos/month): ~$570/month
- **Large Scale** (100K videos/month): ~$5,260/month
- **Bedrock Costs**: ~5-10% of total (demonstrates cost-effective AI)

## Architecture Highlights

### Serverless & Scalable
- No servers to manage
- Auto-scales with demand
- Pay only for what you use

### Event-Driven
- S3 uploads trigger analysis automatically
- EventBridge events enable downstream processing
- Real-time status updates

### Production-Ready
- CloudWatch monitoring and alarms
- Error handling and retries
- Security best practices (IAM, private S3, CloudFront OAI)

## Quota & Cost Analysis

### AWS Quota Requirements

**Small Scale** (1K videos/month):
- No quota increases needed

**Medium Scale** (10K videos/month):
- Monitor Bedrock rate limits (may need increase for bursts)

**Large Scale** (100K videos/month):
- **REQUIRED**: Bedrock rate limit increase to 50K requests/minute
- **REQUIRED**: Lambda concurrent execution increase to 2K-3K

### Cost Breakdown (Large Scale)

| Service | Monthly Cost | % of Total |
|---------|--------------|------------|
| CloudFront | $4,250 | 81% |
| Bedrock | $500 | 10% |
| Lambda | $300 | 6% |
| DynamoDB | $250 | 5% |
| Other | $60 | 1% |
| **Total** | **$5,260** | **100%** |

**Key Insight**: Video delivery (CloudFront) is the largest cost driver, not AI processing (Bedrock).

## TwelveLabs Impact

### Before TwelveLabs
- Manual content review (expensive, slow)
- Simple keyword matching (inaccurate)
- No semantic understanding
- No community segmentation

### After TwelveLabs
- Automated validation (fast, scalable)
- Multimodal understanding (accurate)
- Semantic clustering (meaningful communities)
- Enhanced user experience (timeline highlights, recommendations)

## Demo Highlights

1. **Upload Flow**: User uploads video with hashtags → automatic analysis
2. **Validation Dashboard**: Admin sees multimodal scores and breakdown
3. **Timeline Highlights**: Interactive video player with key moment markers
4. **Mob Discovery**: Users explore videos in their mob and similar mobs
5. **Usage Analytics**: Real-time Bedrock usage tracking and cost breakdown

## Next Steps

1. **Deploy to Production**: CDK stack ready for deployment
2. **Monitor Usage**: CloudWatch dashboards track all metrics
3. **Scale Quotas**: Request increases before campaign launch
4. **Optimize Costs**: CloudFront caching, Lambda right-sizing
5. **Enhance Features**: User feedback, additional mob types

## Conclusion

Milk Mobs demonstrates how **TwelveLabs AI models enable sophisticated video understanding** at scale. The combination of Pegasus (multimodal analysis) and Marengo (semantic embeddings) creates a complete solution for campaign validation and community building.

**Key Takeaway**: TwelveLabs transforms video content into structured, searchable, and clusterable data - enabling features that would be impossible with traditional video processing.

---

**For AWS Stakeholders**: This solution showcases high-value AWS services (Bedrock, Lambda, Step Functions, DynamoDB, OpenSearch) and demonstrates customer commitment to AI transformation and serverless architecture.

