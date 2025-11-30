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
      className="border-b border-[var(--border-subtle)] bg-[var(--bg)] transition-colors duration-300"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full bg-gradient-to-br ${getAvatarGradient(
              user.avatarColor
            )} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}
          >
            {user.handle.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold leading-tight text-[var(--text)] truncate">
              {user.handle}
            </span>
            {location && (
              <span className="text-xs leading-tight text-[var(--text-muted)] truncate">
                {location}
              </span>
            )}
          </div>
        </div>
        <button
          className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors duration-200 flex-shrink-0"
          aria-label="More options"
        >
          <MoreIcon className="h-6 w-6 text-[var(--text)]" />
        </button>
      </header>

      {/* Video Player */}
      <div className="relative w-full overflow-hidden bg-[var(--bg-soft)]" style={{ aspectRatio: '4/5' }}>
        {(video.playbackUrl || video.videoUrl) ? (
          <VideoPlayer
            videoUrl={video.playbackUrl || video.videoUrl || ''}
            thumbnailUrl={video.thumbnailUrl}
            autoplay={false}
            muted={true}
            className="w-full h-full"
          />
        ) : (
          <div className="relative w-full h-full bg-gradient-to-br from-[var(--bg-soft)] via-[var(--bg)] to-[var(--bg-soft)] flex items-center justify-center">
            <div className="text-xs font-medium text-[var(--text-subtle)]">
              Video preview
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-1.5">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={handleLike}
            className="transition-colors duration-200"
            aria-label="Like"
            whileTap={{ scale: 0.9 }}
            animate={{ scale: liked ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <HeartIcon className={`h-6 w-6 ${liked ? 'text-red-500' : 'text-[var(--text)]'}`} filled={liked} />
          </motion.button>
          <button
            className="transition-colors duration-200"
            aria-label="Comment"
          >
            <CommentIcon className="h-6 w-6 text-[var(--text)]" />
          </button>
          <button
            className="transition-colors duration-200"
            aria-label="Share"
          >
            <ShareIcon className="h-6 w-6 text-[var(--text)]" />
          </button>
        </div>
        <button
          onClick={handleSave}
          className="transition-colors duration-200"
          aria-label="Save"
        >
          <BookmarkIcon className={`h-6 w-6 ${saved ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`} filled={saved} />
        </button>
      </div>

      {/* Caption */}
      <div className="px-4 pb-4 space-y-1.5">
        <p className="text-sm leading-[18px] text-[var(--text)]">
          <span className="font-semibold mr-1.5">{user.handle}</span>
          {caption}
        </p>
        {hashtags.length > 0 && (
          <p className="text-xs font-normal text-[var(--accent-strong)]">
            {hashtags.join(' ')}
          </p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-subtle)]">
            {mobName && `${mobName} · `}
            {timestamp} ago
          </p>
          <Link
            href={`/video/${video.id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium text-[var(--accent)] bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)]/80 transition-colors duration-200"
          >
            View analysis
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

