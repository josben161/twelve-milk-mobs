'use client';

import { useState, useRef } from 'react';
import type { SubmitVideoResponse } from '@twelve/core-types';
import { Card, PrimaryButton, PageShell } from '@/components/ui';
import { getApiBase } from '@/lib/api';
import { useAuth } from '@/components/auth/UserProvider';

export const dynamic = 'force-dynamic';

export default function UploadPage() {
  const { currentUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [hashtags, setHashtags] = useState('#gotmilk #milkmob #skatepark');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitVideoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hashtagList = hashtags
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && tag.startsWith('#'));

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please select a video file.');
      return;
    }

    if (hashtagList.length === 0) {
      setError('Please add at least one hashtag.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const apiBase = getApiBase();
      if (!currentUser) {
        throw new Error('Please log in as a demo user to upload videos');
      }

      // 1) Ask backend for videoId + presigned upload URL
      const res = await fetch(`${apiBase}/videos/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hashtags: hashtagList,
          userId: currentUser.id,
          userHandle: currentUser.handle,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to start upload (${res.status})`);
      }

      const data = (await res.json()) as SubmitVideoResponse;

      // 2) Upload the video bytes to S3 with the presigned URL
      const putRes = await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'video/mp4',
        },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error(`Failed to upload video to storage (${putRes.status})`);
      }

      // 3) Show success state
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  // ✅ IG-style layout starts here
  return (
    <div className="px-4 pb-24 pt-4 transition-colors duration-300">
      <div className="mb-8">
        <h1
          className="mb-6 text-2xl font-bold tracking-tight transition-colors duration-300"
          style={{ color: 'var(--text)' }}
        >
          New Post
        </h1>
        <p
          className="text-sm transition-colors duration-300"
          style={{ color: 'var(--text-muted)' }}
        >
          Share a moment with your Milk Mob
        </p>
      </div>

      {!currentUser ? (
        <div className="text-center py-12">
          <p
            className="text-base mb-4 transition-colors duration-300"
            style={{ color: 'var(--text)' }}
          >
            Please log in as a demo user (e.g. user_1) to upload videos.
          </p>
          <p
            className="text-sm transition-colors duration-300"
            style={{ color: 'var(--text-muted)' }}
          >
            Use the user switch control in the header to log in.
          </p>
        </div>
      ) : !result ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Video preview (4:5 like IG) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full overflow-hidden rounded-lg transition-all duration-200 cursor-pointer"
            style={{
              borderWidth: file ? '2px' : '2px',
              borderStyle: file ? 'solid' : 'dashed',
              borderColor: isDragging ? 'var(--accent)' : 'var(--border-subtle)',
              backgroundColor: isDragging ? 'var(--accent-soft)' : 'var(--bg-card)',
              aspectRatio: '4/5',
            }}
            onMouseEnter={(e) => {
              if (!isDragging && !file) {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragging && !file) {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <p
                  className="text-sm mb-1 font-medium transition-colors duration-300"
                  style={{ color: 'var(--text)' }}
                >
                  {file.name}
                </p>
                <p
                  className="text-xs transition-colors duration-300"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center text-xs font-normal transition-colors duration-300"
                style={{ color: 'var(--text-subtle)' }}
              >
                Video preview
              </div>
            )}
          </div>

          {/* Tap / drag to select - subtle hint below preview */}
          <p
            className="text-xs text-center mb-8 transition-colors duration-300"
            style={{ color: 'var(--text-subtle)' }}
          >
            Tap to select or drag & drop
          </p>

          {/* Hashtags - Instagram style single line input */}
          <div className="space-y-3">
            <label
              className="block text-sm font-medium transition-colors duration-300"
              style={{ color: 'var(--text)' }}
            >
              Hashtags
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#gotmilk #milkmob #skatepark"
              className="w-full border-b border-t-0 border-l-0 border-r-0 px-0 py-3 text-sm transition-all duration-200 focus:outline-none focus:border-b-2 placeholder:opacity-60"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.backgroundColor = 'var(--bg-soft)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
          </div>

            {error && (
              <div
                className="rounded-lg border px-3 py-2 transition-colors duration-300"
                style={{
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                }}
              >
                <p className="text-xs font-normal" style={{ color: 'rgb(239, 68, 68)' }}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file || hashtagList.length === 0}
              className="w-full rounded-lg py-3 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              style={{
                backgroundColor: loading || !file || hashtagList.length === 0 
                  ? 'var(--accent-soft)' 
                  : 'var(--accent)',
                color: 'white',
              }}
              onMouseEnter={(e) => {
                if (!loading && file && hashtagList.length > 0) {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && file && hashtagList.length > 0) {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }
              }}
            >
              {loading ? 'Sharing…' : 'Share'}
            </button>
          </form>
        ) : (
          // Success view
          <Card
            className="mt-4 space-y-4 p-6 transition-colors duration-300"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-soft)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <span className="text-xs text-white">✓</span>
              </div>
              <div>
                <h2
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  Your post was created
                </h2>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  We&apos;ll analyze it for Milk Mob participation and update its status shortly.
                </p>
              </div>
            </div>

            <div className="space-y-1 text-[11px]">
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Video ID:</span>{' '}
                <span className="font-mono" style={{ color: 'var(--text)' }}>
                  {result.videoId}
                </span>
              </div>
              <div className="break-all">
                <span style={{ color: 'var(--text-muted)' }}>Upload URL:</span>{' '}
                <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {result.uploadUrl}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setResult(null);
                setFile(null);
                setHashtags('');
              }}
              className="w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-80 active:scale-95"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--text)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Post another
            </button>
          </Card>
        )}
    </div>
  );
}
