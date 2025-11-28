// apps/consumer-web/app/my-videos/page.tsx
const myVideos = [
  { id: 'vid_1', thumb: '', status: 'validated' },
  { id: 'vid_2', thumb: '', status: 'processing' },
  { id: 'vid_3', thumb: '', status: 'rejected' },
  { id: 'vid_4', thumb: '', status: 'validated' },
];

export default function MyVideosPage() {
  return (
    <div className="pb-6 transition-colors duration-300">
      {/* profile header */}
      <section className="flex items-center gap-4 px-4 py-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-lg font-semibold text-white">
          MM
        </div>
        <div className="flex flex-col gap-1">
          <span
            className="text-sm font-semibold transition-colors duration-300"
            style={{ color: 'var(--text)' }}
          >
            @milk_mob_user
          </span>
          <div
            className="flex gap-6 text-xs transition-colors duration-300"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="flex flex-col items-center">
              <span className="font-semibold">4</span>
              <span>Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold">128</span>
              <span>Mobs joined</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-semibold">512</span>
              <span>Views</span>
            </div>
          </div>
        </div>
      </section>

      {/* tabs */}
      <div
        className="flex border-t border-b text-xs transition-colors duration-300"
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        <button
          className="flex-1 py-2 text-center border-b-2 font-semibold transition-colors duration-300"
          style={{
            borderBottomColor: 'var(--text)',
            color: 'var(--text)',
          }}
        >
          Posts
        </button>
        <button
          className="flex-1 py-2 text-center transition-colors duration-300 hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          Saved
        </button>
      </div>

      {/* grid of posts */}
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
    </div>
  );
}
