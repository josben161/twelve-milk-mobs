'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from './Card';

interface Props {
  id: string;
  name: string;
  description: string;
  videoCount: number;
  gradient: string;
}

export function MobPreviewCard({
  id,
  name,
  description,
  videoCount,
  gradient,
}: Props) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link href={`/mob/${id}`}>
        <Card className="p-4 hover:border-indigo-600/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div
              className={`h-16 w-16 rounded-lg bg-gradient-to-br ${gradient} flex-shrink-0 shadow-lg`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-50 mb-1">{name}</h3>
              <p className="text-sm text-slate-400 mb-1">{description}</p>
              <p className="text-xs text-slate-500">{videoCount} videos</p>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

