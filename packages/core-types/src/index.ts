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
