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
      <div className="px-4 pb-24 pt-4">
        <h1 className="mb-3 text-lg font-semibold">New Milk Mob post</h1>
        <p className="mb-4 text-xs text-slate-400">
          Choose a short video, add your Milk Mob tags, and share it to the feed.
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video preview (4:5 like IG) */}
            <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
              <div className="relative aspect-[4/5] w-full">
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                  {file ? (
                    <div className="px-4 text-center">
                      <p className="text-sm text-slate-50 mb-1 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
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
              className={`flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-3 text-xs transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="text-slate-300">
                {file ? 'Tap to change video or drag a new file here' : 'Tap to select a video or drag & drop'}
              </span>
            </div>

            {/* Caption / hashtags */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-400">
                Hashtags
              </label>
              <textarea
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                rows={3}
                placeholder="#gotmilk #milkmob #skatepark"
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {hashtagList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtagList.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full border border-indigo-600/40 bg-indigo-600/15 px-3 py-1 text-[11px] font-medium text-indigo-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2">
                <p className="text-xs text-rose-300">{error}</p>
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
          <Card className="mt-4 space-y-4 border-emerald-700 bg-emerald-950/40 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <span className="text-xs text-white">✓</span>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-emerald-50">
                  Upload created successfully
                </h2>
                <p className="text-xs text-emerald-200">
                  Your Milk Mob post is ready to be processed.
                </p>
              </div>
            </div>

            <div className="space-y-1 text-[11px]">
              <div>
                <span className="text-slate-400">Video ID:</span>{' '}
                <span className="font-mono text-emerald-300">
                  {result.videoId}
                </span>
              </div>
              <div className="break-all">
                <span className="text-slate-400">Upload URL:</span>{' '}
                <span className="font-mono text-[10px] text-emerald-300">
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
              className="w-full rounded-full bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Upload another video
            </button>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
