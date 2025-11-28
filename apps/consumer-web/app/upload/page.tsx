'use client';

import { useState } from 'react';
import type { SubmitVideoResponse } from '@twelve/core-types';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hashtags, setHashtags] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubmitVideoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please select a video file.');
      return;
    }

    const hashtagList = hashtags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

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
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg">
        <h1 className="text-xl font-semibold mb-4">Upload a Milk Mob Video</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Video file</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-600 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Hashtags (comma separated)</label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#gotmilk, #milkmob"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Starting upload…' : 'Start upload'}
          </button>
        </form>

        {result && (
          <div className="mt-4 rounded-md border border-slate-800 bg-slate-900/60 p-3 text-xs">
            <div className="font-semibold mb-1">Upload created</div>
            <div>videoId: {result.videoId}</div>
            <div className="break-all mt-1">
              uploadUrl: {result.uploadUrl}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}