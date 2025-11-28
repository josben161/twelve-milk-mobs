'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="max-w-lg w-full px-6 py-8 rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">
        <h1 className="text-2xl font-semibold mb-3">
          Milk Mobs Demo
        </h1>
        <p className="text-sm text-slate-300 mb-6">
          This is a TwelveLabs-powered prototype for a youth milk campaign.
          Start by uploading a short video and joining a Mob.
        </p>

        <Link
          href="/upload"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Go to Upload
        </Link>

        <p className="mt-4 text-xs text-slate-500">
          (This replaced the default Turborepo starter page.)
        </p>
      </div>
    </main>
  );
}