// Core status for a video as it moves through the system
export type VideoStatus = 'uploaded' | 'processing' | 'validated' | 'rejected';

// Low-level storage representation (e.g. DynamoDB row)
// This is your internal "source of truth" shape.
export interface VideoRecord {
  videoId: string;
  userId: string;       // backend user identifier (email, sub, etc.)
  userHandle: string;   // user handle for display
  s3Key: string;        // path in S3 bucket
  hashtags: string[];
  createdAt: string;    // ISO timestamp
  status: VideoStatus;

  // TwelveLabs Pegasus analysis results
  participationScore?: number;    // 0–1, from Pegasus
  mentionsMilk?: boolean;         // Pegasus flag
  showsMilkObject?: boolean;       // Pegasus flag
  showsActionAligned?: boolean;   // Pegasus flag
  participationRationale?: string; // Pegasus explanation
  detectedText?: string[];         // OCR: All text detected in video
  onScreenText?: string[];        // OCR: Text visible on screen (e.g., milk carton labels)

  // TwelveLabs Marengo embedding results
  embedding?: string;             // JSON string of embedding vector
  embeddingDim?: number;          // Dimension of embedding (e.g. 256)

  // Legacy fields (deprecated, kept for backward compatibility)
  validationScore?: number; // 0–1, optional until analysis finishes (use participationScore)
  actions?: string[];       // detected actions from TL analysis
  objectsScenes?: string[]; // detected objects/scenes from TL analysis
  timeline?: string;        // JSON string of timeline events

  // Clustering
  mobId?: string;           // cluster id
  embeddingId?: string;     // reference into vector store if you add one
}

/**
 * Public-facing summary of a video for feeds, tables, etc.
 * Derived from VideoRecord plus some denormalised fields.
 */
export interface VideoSummary {
  id: string;               // videoId
  userHandle: string;       // e.g. "sk8milk" – safe to show in UI
  mobId: string | null;     // null if not yet clustered
  status: VideoStatus;
  createdAt: string;        // ISO timestamp

  caption: string;
  hashtags: string[];

  thumbnailUrl: string | null;

  validationScore?: number; // 0–1 score; optional
}

/**
 * Detailed view of a video for admin / "view analysis".
 * Builds on VideoSummary with semantic context from TwelveLabs.
 */
export interface VideoDetail extends VideoSummary {
  location?: string;        // e.g. "Venice Skatepark"
  playbackUrl?: string;    // CloudFront or S3 presigned URL for video playback

  // Semantic outputs from TwelveLabs:
  actions?: string[];       // e.g. ["Ollie", "Drink from milk carton"]
  objectsScenes?: string[]; // e.g. ["Skatepark bowl", "Milk carton", "LED lights"]

  // coarse timeline of key moments (highlights)
  timeline?: Array<{
    timestamp: number; // seconds
    description: string;
    score?: number; // 0–1 relevance
  }>;

  // TwelveLabs Pegasus participation detection results
  mentionsMilk?: boolean;         // Pegasus flag: detects spoken mentions of milk
  showsMilkObject?: boolean;      // Pegasus flag: detects milk containers/objects
  showsActionAligned?: boolean;  // Pegasus flag: detects drinking milk actions
  participationRationale?: string; // Pegasus explanation text
  detectedText?: string[];        // OCR: All text detected in video
  onScreenText?: string[];       // OCR: Text visible on screen (e.g., milk carton labels)

  // TwelveLabs Marengo embedding results
  embeddingDim?: number;          // Dimension of embedding vector (e.g., 256)
  clusteringMethod?: 'embedding' | 'keyword' | 'unknown'; // How video was assigned to mob
  similarityScore?: number;       // Similarity score to mob centroid (0-1)
  
  // Validation breakdown
  validationBreakdown?: {
    visual: number;
    audio: number | null;  // null if audio unavailable
    ocr: number;
    hashtags: number;
  };
}

/**
 * Cluster of similar videos – a "Mob".
 */
export interface MobSummary {
  id: string;
  name: string;             // "Skatepark", "Café Study", etc.
  description: string;
  videoCount: number;
  exampleHashtags: string[];
  // Clustering metadata
  centroidDim?: number;      // Dimension of centroid embedding vector
  clusteringMethod?: 'k-means' | 'similarity' | 'keyword'; // How mob was created
  avgSimilarityScore?: number; // Average similarity of videos to centroid
  centroid?: string;         // JSON string of centroid embedding vector
}

/** Request from frontend to start a video upload */
export interface SubmitVideoRequest {
  hashtags: string[];
  userId: string;
  userHandle: string;
}

/** Response with a videoId and a URL to upload the file to */
export interface SubmitVideoResponse {
  videoId: string;
  uploadUrl: string;
}

/**
 * Aggregate metrics for the admin dashboard.
 * This will eventually back your Overview page.
 */
export interface AdminStats {
  totalVideos: number;
  validated: number;
  rejected: number;
  processing: number;
  activeMobs: number;

  // 0–1
  avgValidationScore: number;
  // seconds
  avgTimeToValidateSeconds: number;
}

/**
 * Feed post format for consumer web home feed
 */
export interface FeedPost {
  id: string;
  user: {
    handle: string;
    avatarColor: string;
  };
  mobName: string | null;
  location: string | null;
  tags: string[];
  caption: string;
  status: string;
  createdAt: string;
  video: {
    id: string;
    videoUrl?: string;
    thumbnailUrl?: string;
  };
}

/**
 * Usage statistics for AWS services
 */
export interface UsageStats {
  timeRange: string;
  bedrock: {
    invocations: number;
    estimatedCost: number;
    byModel: Array<{ modelId: string; invocations: number }>;
  };
  lambda: { invocations: number; duration: number; errors: number; estimatedCost: number };
  apiGateway: { requests: number; errors: number; dataTransfer: number; estimatedCost: number };
  dynamodb: { readUnits: number; writeUnits: number; storage: number; estimatedCost: number };
  s3: { storage: number; requests: number; dataTransfer: number; estimatedCost: number };
  opensearch: { instanceHours: number; storage: number; estimatedCost: number };
  stepFunctions: { executions: number; duration: number; estimatedCost: number };
  cloudfront: { requests: number; dataTransfer: number; estimatedCost: number };
}
