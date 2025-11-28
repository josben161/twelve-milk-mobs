'use client';

import Link from 'next/link';
import { Card, PrimaryButton, MobPreviewCard, PageShell } from '@/components/ui';

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
    <PageShell>
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left: Headline + CTA */}
        <Card className="p-8 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/50">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
              Join the Milk Mob
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Upload your videos, join themed mobs, and see your content come
              together with others. Powered by TwelveLabs AI.
            </p>
            <Link href="/upload">
              <PrimaryButton>Upload a video</PrimaryButton>
            </Link>
          </div>
        </Card>

        {/* Right: Mob preview cards */}
        <div className="space-y-4">
          {mockMobs.map((mob) => (
            <MobPreviewCard key={mob.id} {...mob} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}