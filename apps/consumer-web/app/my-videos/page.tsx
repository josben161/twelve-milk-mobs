'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/UserProvider';
import { ProfileHeader, EmptyState } from '@/components/ui';
import { StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

interface Video {
  id: string;
  thumb: string;
  status: string;
}

export default function MyVideosPage() {
  const { currentUser } = useAuth();
  const [myVideos, setMyVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const fetchVideos = async () => {
      setLoading(true);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE;
        if (apiBase) {
          const res = await fetch(
            `${apiBase.replace(/\/$/, '')}/videos/user?userId=${currentUser.id}`
          );
          if (res.ok) {
            const data = await res.json();
            setMyVideos(data.videos || []);
          } else {
            // Fallback to mock data if API not available
            setMyVideos([
              { id: 'vid_1', thumb: '', status: 'validated' },
              { id: 'vid_2', thumb: '', status: 'processing' },
              { id: 'vid_3', thumb: '', status: 'rejected' },
              { id: 'vid_4', thumb: '', status: 'validated' },
            ]);
          }
        } else {
          // Fallback to mock data if API not configured
          setMyVideos([
            { id: 'vid_1', thumb: '', status: 'validated' },
            { id: 'vid_2', thumb: '', status: 'processing' },
            { id: 'vid_3', thumb: '', status: 'rejected' },
            { id: 'vid_4', thumb: '', status: 'validated' },
          ]);
        }
      } catch (err) {
        // Fallback to mock data on error
        setMyVideos([
          { id: 'vid_1', thumb: '', status: 'validated' },
          { id: 'vid_2', thumb: '', status: 'processing' },
          { id: 'vid_3', thumb: '', status: 'rejected' },
          { id: 'vid_4', thumb: '', status: 'validated' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="px-4 py-12 text-center">
        <p
          className="text-base mb-4 transition-colors duration-300"
          style={{ color: 'var(--text)' }}
        >
          Please log in as a demo user (e.g. user_1 or user_2) to view your videos.
        </p>
        <p
          className="text-sm transition-colors duration-300"
          style={{ color: 'var(--text-muted)' }}
        >
          Use the user switch control in the header to log in.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-6 transition-colors duration-300">
      {/* profile header */}
      <ProfileHeader
        user={currentUser}
        stats={{
          posts: myVideos.length,
          mobs: 0,
          views: 0,
        }}
      />

      {/* tabs */}
      <div
        className="flex border-t border-b text-sm transition-colors duration-300"
        style={{
          borderColor: 'var(--border-subtle)',
        }}
      >
        <button
          className="flex-1 py-3 text-center border-b-2 font-bold transition-all duration-300"
          style={{
            borderBottomColor: 'var(--accent)',
            borderBottomWidth: '2px',
            color: 'var(--text)',
          }}
        >
          Posts
        </button>
        <button
          className="flex-1 py-3 text-center font-medium transition-all duration-300 hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          Saved
        </button>
      </div>

      {/* grid of posts */}
      {loading ? (
        <div className="px-4 py-12 text-center">
          <p
            className="text-sm transition-colors duration-300"
            style={{ color: 'var(--text-muted)' }}
          >
            Loading videos...
          </p>
        </div>
      ) : myVideos.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="No posts yet"
          subtitle="When you share photos and videos, they'll appear here"
          action={{
            label: 'Share your first post',
            href: '/upload',
          }}
        />
      ) : (
        <section
          className="grid grid-cols-3 gap-[1px] transition-colors duration-300"
          style={{ backgroundColor: 'var(--border-subtle)' }}
        >
          {myVideos.map((v) => (
            <Link
              key={v.id}
              href={`/video/${v.id}`}
              className="relative aspect-square transition-all duration-200 hover:scale-105 rounded-sm overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom right, var(--bg-soft), var(--bg))',
              }}
            >
              <span
                className="absolute inset-0 flex items-center justify-center text-[10px] transition-colors duration-300"
                style={{ color: 'var(--text-subtle)' }}
              >
                Video
              </span>
              {v.status && (
                <div className="absolute top-1 right-1">
                  <StatusPill status={v.status as any} />
                </div>
              )}
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
