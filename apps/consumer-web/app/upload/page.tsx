'use client';

import { useState, useRef } from 'react';
import type { SubmitVideoResponse } from '@twelve/core-types';
import { Card, PrimaryButton, PageShell } from '@/components/ui';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hashtags, setHashtags] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitVideoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hashtagList = hashtags
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

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
    <PageShell maxWidth="md">
      <div className="px-4 pb-24 pt-6 transition-colors duration-300">
        <h1
          className="mb-2 text-xl font-bold tracking-tight transition-colors duration-300"
          style={{ color: 'var(--text)' }}
        >
          New Milk Mob post
        </h1>
        <p
          className="mb-6 text-sm leading-relaxed transition-colors duration-300"
          style={{ color: 'var(--text-muted)' }}
        >
          Choose a short video, add your Milk Mob tags, and share it to the feed.
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video preview (4:5 like IG) */}
            <Card className="overflow-hidden transition-colors duration-300 shadow-lg">
              <div className="relative aspect-[4/5] w-full bg-gradient-to-br from-[var(--bg-soft)] via-[var(--bg)] to-[var(--bg-soft)]">
                <div
                  className="absolute inset-0 flex items-center justify-center text-sm font-medium transition-colors duration-300"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  {file ? (
                    <div className="px-6 text-center">
                      <p
                        className="text-base mb-1.5 font-semibold transition-colors duration-300"
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
            </Card>

            {/* Tap / drag to select */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-3 text-xs transition-all duration-300"
              style={{
                borderColor: isDragging ? 'var(--accent)' : 'var(--border-subtle)',
                backgroundColor: isDragging ? 'var(--accent-soft)' : 'transparent',
                transform: isDragging ? 'scale(1.01)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.backgroundColor = 'var(--accent-soft)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDragging) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.backgroundColor = 'transparent';
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
              <span style={{ color: 'var(--text-muted)' }}>
                {file ? 'Tap to change video or drag a new file here' : 'Tap to select a video or drag & drop'}
              </span>
            </div>

            {/* Caption / hashtags */}
            <div className="space-y-3">
              <label
                className="block text-sm font-semibold transition-colors duration-300"
                style={{ color: 'var(--text)' }}
              >
                Hashtags
              </label>
              <textarea
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                rows={3}
                placeholder="#gotmilk #milkmob #skatepark"
                className="w-full resize-none rounded-xl border px-4 py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2 placeholder:opacity-50"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-soft)',
                  color: 'var(--text)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-soft)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {hashtagList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtagList.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium transition-colors duration-300"
                      style={{
                        borderColor: 'var(--accent)',
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent-strong)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div
                className="rounded-xl border px-3 py-2 transition-colors duration-300"
                style={{
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                }}
              >
                <p className="text-xs" style={{ color: 'rgb(252, 165, 165)' }}>
                  {error}
                </p>
              </div>
            )}

            <PrimaryButton
              type="submit"
              disabled={loading || !file || hashtagList.length === 0}
              className="w-full rounded-full"
            >
              {loading ? 'Sharing…' : 'Share to Milk Mob'}
            </PrimaryButton>
          </form>
        ) : (
          // Success view
          <Card
            className="mt-4 space-y-4 p-4 transition-colors duration-300"
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
    </PageShell>
  );
}
