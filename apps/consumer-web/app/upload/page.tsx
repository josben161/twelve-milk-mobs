'use client';

import { useState, useRef } from 'react';
import type { SubmitVideoResponse } from '@twelve/core-types';
import { Card, PrimaryButton, PageShell } from '@/components/ui';

export default function UploadPage() {
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
      const res = await fetch('/api/videos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtags: hashtagList }),
      });

      if (!res.ok) {
        throw new Error('Failed to start upload.');
      }

      const data = (await res.json()) as SubmitVideoResponse;
      setResult(data);
      // next iteration: PUT file to data.uploadUrl
    } catch (err) {
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
          className="mb-2 text-2xl font-semibold tracking-tight transition-colors duration-300"
          style={{ color: 'var(--text)' }}
        >
          New Milk Mob post
        </h1>
        <p
          className="text-sm leading-relaxed transition-colors duration-300"
          style={{ color: 'var(--text-muted)' }}
        >
          Choose a short video, add your Milk Mob tags, and share it to the feed.
        </p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Video preview (4:5 like IG) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full overflow-hidden rounded-lg border transition-all duration-200 cursor-pointer"
            style={{
              borderColor: isDragging ? 'var(--accent)' : 'var(--border-subtle)',
              backgroundColor: 'var(--bg-card)',
              aspectRatio: '4/5',
            }}
            onMouseEnter={(e) => {
              if (!isDragging) {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragging) {
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
            <div
              className="absolute inset-0 flex items-center justify-center text-xs font-normal transition-colors duration-300"
              style={{ color: 'var(--text-subtle)' }}
            >
              {file ? (
                <div className="px-6 text-center">
                  <p
                    className="text-sm mb-1 font-normal transition-colors duration-300"
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
                'Video preview'
              )}
            </div>
          </div>

          {/* Tap / drag to select - subtle hint below preview */}
          <p
            className="text-xs text-center mb-8 transition-colors duration-300"
            style={{ color: 'var(--text-subtle)' }}
          >
            Tap to select a video or drag & drop
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
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
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
              className="w-full rounded-lg py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {loading ? 'Sharing…' : 'Share to Milk Mob'}
            </button>
          </form>
        ) : (
          // Success view
          <Card
            className="mt-4 space-y-4 p-6 transition-colors duration-300"
            style={{
              borderColor: 'rgba(34, 197, 94, 0.5)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <span className="text-xs text-white">✓</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'rgb(209, 250, 229)' }}>
                  Upload created successfully
                </h2>
                <p className="text-xs" style={{ color: 'rgb(167, 243, 208)' }}>
                  Your Milk Mob post is ready to be processed.
                </p>
              </div>
            </div>

            <div className="space-y-1 text-[11px]">
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Video ID:</span>{' '}
                <span className="font-mono" style={{ color: 'rgb(167, 243, 208)' }}>
                  {result.videoId}
                </span>
              </div>
              <div className="break-all">
                <span style={{ color: 'var(--text-muted)' }}>Upload URL:</span>{' '}
                <span className="font-mono text-[10px]" style={{ color: 'rgb(167, 243, 208)' }}>
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
              className="w-full rounded-full px-3 py-2 text-xs font-medium transition-colors duration-300 hover:opacity-80"
              style={{
                backgroundColor: 'var(--bg-soft)',
                color: 'var(--text)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Upload another video
            </button>
          </Card>
        )}
    </div>
  );
}
