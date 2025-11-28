'use client';

import Link from 'next/link';

const mockMobs = [
  {
    id: 'skatepark',
    name: 'Skatepark',
    description: 'Milk tricks & action',
    videoCount: 24,
    gradient: 'from-orange-500 to-red-600',
  },
  {
    id: 'bedroom-dance',
    name: 'Bedroom Dance',
    description: 'Late night vibes',
    videoCount: 18,
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    id: 'cafe-study',
    name: 'Café Study',
    description: 'Chill study sessions',
    videoCount: 12,
    gradient: 'from-blue-500 to-cyan-600',
  },
];

export default function HomePage() {
  return (
    <main className="py-12">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left: Headline + CTA */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Join the Milk Mob
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            Upload your videos, join themed mobs, and see your content come
            together with others. Powered by TwelveLabs AI.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Upload a video
          </Link>
        </div>

        {/* Right: Mob preview cards */}
        <div className="space-y-4">
          {mockMobs.map((mob) => (
            <Link
              key={mob.id}
              href={`/mob/${mob.id}`}
              className="block rounded-xl border border-slate-800 bg-gradient-to-br bg-slate-900/70 p-4 hover:border-indigo-600/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`h-16 w-16 rounded-lg bg-gradient-to-br ${mob.gradient} flex-shrink-0`}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-50 mb-1">
                    {mob.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-1">
                    {mob.description}
                  </p>
                  <p className="text-xs text-slate-500">
                    {mob.videoCount} videos
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}