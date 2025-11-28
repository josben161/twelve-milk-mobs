import { NextResponse } from 'next/server';
import type { SubmitVideoRequest, SubmitVideoResponse } from '@twelve/core-types';

export async function POST(request: Request) {
  const body = (await request.json()) as SubmitVideoRequest;

  if (!Array.isArray(body.hashtags) || body.hashtags.length === 0) {
    return NextResponse.json(
      { error: 'hashtags array is required' },
      { status: 400 }
    );
  }

  // For now we fake a videoId and uploadUrl.
  // Later, this route will call our AWS API Gateway to get a real presigned URL.
  const videoId = `vid_${Math.random().toString(36).slice(2, 10)}`;
  const fakeUploadUrl = `https://example.com/upload/${videoId}`;

  const payload: SubmitVideoResponse = {
    videoId,
    uploadUrl: fakeUploadUrl,
  };

  return NextResponse.json(payload, { status: 200 });
}