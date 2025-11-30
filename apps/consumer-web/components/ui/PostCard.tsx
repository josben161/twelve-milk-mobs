'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon, MoreIcon } from './Icons';
import { VideoPlayer } from './VideoPlayer';

interface PostCardProps {
  video: {
    id: string;
    playbackUrl?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
  };
  user: {
    handle: string;
    avatarColor?: string;
  };
  caption: string;
  hashtags: string[];
  timestamp: string;
  mobName?: string;
  location?: string;
}

export function PostCard({ video, user, caption, hashtags, timestamp, mobName, location }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const getAvatarGradient = (color?: string) => {
    const gradients: Record<string, string> = {
      indigo: 'from-indigo-500 via-purple-500 to-pink-500',
      emerald: 'from-emerald-500 via-teal-500 to-cyan-500',
      rose: 'from-rose-500 via-pink-500 to-fuchsia-500',
    };
    return gradients[color || 'indigo'] || gradients.indigo;
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-b transition-colors duration-300 pb-8"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarGradient(
              user.avatarColor
            )} flex items-center justify-center text-xs font-bold text-white shadow-lg`}
          >
            {user.handle.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>
              {user.handle}
            </span>
            {location && (
              <span className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>
                {location}
              </span>
            )}
          </div>
        </div>
        <button
          className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] transition-all duration-200 active:scale-95"
          style={{ color: 'var(--text-subtle)' }}
          aria-label="More options"
        >
          <MoreIcon className="h-5 w-5" />
        </button>
      </header>

      {/* Video Player */}
      <div className="relative w-full mb-3 overflow-hidden rounded-lg" style={{ aspectRatio: '4/5' }}>
        {(video.playbackUrl || video.videoUrl) ? (
          <VideoPlayer
            videoUrl={video.playbackUrl || video.videoUrl || ''}
            thumbnailUrl={video.thumbnailUrl}
            autoplay={false}
            muted={true}
            className="w-full h-full"
          />
        ) : (
          <div
            className="relative w-full h-full bg-gradient-to-br from-[var(--bg-soft)] via-[var(--bg)] to-[var(--bg-soft)] flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--bg-soft) 0%, var(--bg) 50%, var(--bg-soft) 100%)',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>
              Video preview
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-5">
          <motion.button
            onClick={handleLike}
            className="transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ color: liked ? '#ef4444' : 'var(--text)' }}
            aria-label="Like"
            whileTap={{ scale: 0.9 }}
            animate={{ scale: liked ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <HeartIcon className="h-6 w-6" filled={liked} />
          </motion.button>
          <button
            className="transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ color: 'var(--text)' }}
            aria-label="Comment"
          >
            <CommentIcon className="h-6 w-6" />
          </button>
          <button
            className="transition-all duration-200 hover:scale-110 active:scale-95"
            style={{ color: 'var(--text)' }}
            aria-label="Share"
          >
            <ShareIcon className="h-6 w-6" />
          </button>
        </div>
        <button
          onClick={handleSave}
          className="transition-all duration-200 hover:scale-110 active:scale-95"
          style={{ color: saved ? 'var(--accent)' : 'var(--text)' }}
          aria-label="Save"
        >
          <BookmarkIcon className="h-6 w-6" filled={saved} />
        </button>
      </div>

      {/* Caption */}
      <div className="px-4 space-y-2">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          <span className="font-bold mr-1.5">{user.handle}</span>
          {caption}
        </p>
        <p className="text-xs font-medium" style={{ color: 'var(--accent-strong)' }}>
          {hashtags.join(' ')}
        </p>
        <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--text-subtle)' }}>
          {mobName && `${mobName} · `}
          {timestamp} ago
        </p>
        <Link
          href={`/video/${video.id}`}
          className="text-[11px] font-medium transition-colors hover:opacity-70 inline-block"
          style={{ color: 'var(--text-muted)' }}
        >
          View analysis →
        </Link>
      </div>
    </motion.article>
  );
}

