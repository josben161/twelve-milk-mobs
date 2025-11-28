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

      // In the next iteration, we will actually PUT the file to data.uploadUrl.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell maxWidth="2xl">
      <h1 className="text-3xl font-bold mb-8">Upload a Milk Mob Video</h1>

      {!result ? (
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                  : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="space-y-3">
                <svg
                  className="h-12 w-12 mx-auto text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-slate-300">
                  {file ? (
                    <>
                      <span className="font-medium text-slate-50">
                        {file.name}
                      </span>
                      <span className="text-slate-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="block font-medium text-slate-50 mb-1">
                        Drag & drop a video file here
                      </span>
                      <span className="text-sm text-slate-400">
                        or click to select
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Hashtags Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Hashtags (comma separated)
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#gotmilk, #milkmob, #skatepark"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {hashtagList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {hashtagList.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-600/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-800 bg-red-950/30 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <PrimaryButton
              type="submit"
              disabled={loading || !file || hashtagList.length === 0}
              className="w-full"
            >
              {loading ? 'Starting upload…' : 'Start upload'}
            </PrimaryButton>
          </form>
        </Card>
      ) : (
        /* Success Banner */
        <Card className="p-8 border-emerald-800 bg-emerald-950/30">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-emerald-50">
                Upload created successfully!
              </h2>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Video ID:</span>{' '}
                <span className="font-mono text-emerald-300">
                  {result.videoId}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Upload URL:</span>{' '}
                <span className="font-mono text-xs text-emerald-300 break-all">
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
              className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Upload another video
            </button>
          </div>
        </Card>
      )}
    </PageShell>
  );
}