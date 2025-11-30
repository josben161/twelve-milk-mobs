'use client';

interface ProfileHeaderProps {
  user: {
    handle: string;
    displayName: string;
    avatarColor?: string;
  };
  stats: {
    posts: number;
    mobs: number;
    views: number;
  };
}

export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  const getAvatarGradient = (color?: string) => {
    const gradients: Record<string, string> = {
      indigo: 'from-indigo-500 via-purple-500 to-pink-500',
      emerald: 'from-emerald-500 via-teal-500 to-cyan-500',
      rose: 'from-rose-500 via-pink-500 to-fuchsia-500',
    };
    return gradients[color || 'indigo'] || gradients.indigo;
  };

  const getAvatarShadow = (color?: string) => {
    const shadows: Record<string, string> = {
      indigo: 'shadow-indigo-500/30',
      emerald: 'shadow-emerald-500/30',
      rose: 'shadow-rose-500/30',
    };
    return shadows[color || 'indigo'] || shadows.indigo;
  };

  return (
    <section className="flex items-center gap-6 px-4 py-6">
      <div
        className={`h-20 w-20 rounded-full bg-gradient-to-br ${getAvatarGradient(
          user.avatarColor
        )} flex items-center justify-center text-xl font-bold text-white shadow-xl ${getAvatarShadow(
          user.avatarColor
        )}`}
      >
        {user.handle.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          @{user.handle}
        </span>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {user.displayName}
        </span>
        <div className="flex gap-6 text-xs">
          <div className="flex flex-col items-center">
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {stats.posts}
            </span>
            <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
              Posts
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {stats.mobs}
            </span>
            <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
              Mobs joined
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {stats.views}
            </span>
            <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
              Views
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

