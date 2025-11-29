'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/UserProvider';

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

  // Get avatar color gradient based on avatarColor
  const getAvatarGradient = (color: string) => {
    const gradients: Record<string, string> = {
      indigo: 'from-indigo-500 via-purple-500 to-pink-500',
      emerald: 'from-emerald-500 via-teal-500 to-cyan-500',
      rose: 'from-rose-500 via-pink-500 to-fuchsia-500',
    };
    return gradients[color] || gradients.indigo;
  };

  const getAvatarShadow = (color: string) => {
    const shadows: Record<string, string> = {
      indigo: 'shadow-indigo-500/30',
      emerald: 'shadow-emerald-500/30',
      rose: 'shadow-rose-500/30',
    };
    return shadows[color] || shadows.indigo;
  };

  return (
    <div className="pb-6 transition-colors duration-300">
      {/* profile header */}
      <section className="flex items-center gap-4 px-4 py-6">
        <div
          className={`h-20 w-20 rounded-full bg-gradient-to-br ${getAvatarGradient(
            currentUser.avatarColor
          )} flex items-center justify-center text-xl font-bold text-white shadow-xl ${getAvatarShadow(
            currentUser.avatarColor
          )}`}
        >
          {currentUser.handle.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <span
            className="text-base font-bold transition-colors duration-300"
            style={{ color: 'var(--text)' }}
          >
            @{currentUser.handle}
          </span>
          <span
            className="text-sm transition-colors duration-300"
            style={{ color: 'var(--text-muted)' }}
          >
            {currentUser.displayName}
          </span>
          <div
            className="flex gap-6 text-xs transition-colors duration-300"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="flex flex-col items-center">
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>4</span>
              <span className="font-medium">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>128</span>
              <span className="font-medium">Mobs joined</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>512</span>
              <span className="font-medium">Views</span>
            </div>
          </div>
        </div>
      </section>

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
            borderBottomColor: 'var(--text)',
            borderBottomWidth: '2px',
            color: 'var(--text)',
          }}
        >
          Posts
        </button>
        <button
          className="flex-1 py-3 text-center font-semibold transition-all duration-300 hover:opacity-70"
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
        <div className="px-4 py-12 text-center">
          <p
            className="text-sm transition-colors duration-300"
            style={{ color: 'var(--text-muted)' }}
          >
            No videos yet. Upload your first video to get started!
          </p>
        </div>
      ) : (
        <section
          className="grid grid-cols-3 gap-[1px] transition-colors duration-300"
          style={{ backgroundColor: 'var(--border-subtle)' }}
        >
          {myVideos.map((v) => (
            <div
              key={v.id}
              className="relative aspect-square transition-colors duration-300"
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
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
