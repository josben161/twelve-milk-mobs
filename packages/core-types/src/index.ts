// Core status for a video as it moves through the system
export type VideoStatus = 'uploaded' | 'processing' | 'validated' | 'rejected';

// Low-level storage representation (e.g. DynamoDB row)
// This is your internal “source of truth” shape.
export interface VideoRecord {
  videoId: string;
  userId: string;       // backend user identifier (email, sub, etc.)
  s3Key: string;        // path in S3 bucket
  hashtags: string[];
  createdAt: string;    // ISO timestamp
  status: VideoStatus;

  validationScore?: number; // 0–1, optional until analysis finishes
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
 * Detailed view of a video for admin / “view analysis”.
 * Builds on VideoSummary with semantic context from TwelveLabs.
 */
export interface VideoDetail extends VideoSummary {
  location?: string;        // e.g. "Venice Skatepark"

  // Semantic outputs from TwelveLabs:
  actions?: string[];       // e.g. ["Ollie", "Drink from milk carton"]
  objectsScenes?: string[]; // e.g. ["Skatepark bowl", "Milk carton", "LED lights"]

  // coarse timeline of key moments
  timeline?: { t: string; event: string }[];
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
