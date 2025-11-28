export type VideoStatus = 'uploaded' | 'processing' | 'validated' | 'rejected';

export interface VideoRecord {
  videoId: string;
  userId: string;
  s3Key: string;
  hashtags: string[];
  createdAt: string;
  status: VideoStatus;
  validationScore?: number;
  mobId?: string;
  embeddingId?: string;
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